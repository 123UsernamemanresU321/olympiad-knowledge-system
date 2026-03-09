import type { EntityRef, KnowledgeEntity, RelationRef, StepBlock } from '../types';
import { validateEntity } from './validator';

const taxonomyModules = import.meta.glob('../../../taxonomy/taxonomy.json', { eager: true });
const taxonomyRaw = Object.values(taxonomyModules)[0]
  ? (Object.values(taxonomyModules)[0] as { default: TaxonomyRoot }).default
  : null;

const contentModules = import.meta.glob('../../../content/**/*.json', { eager: true });

export interface TaxonomySubtopic {
  id: string;
  name: string;
  display_order: number;
}

export interface TaxonomyTopic {
  id: string;
  slug: string;
  name: string;
  level: string;
  display_order: number;
  subtopics: TaxonomySubtopic[];
}

export interface TaxonomySubject {
  id: string;
  name: string;
  nav_order: number;
  learning_order: number;
  topics: TaxonomyTopic[];
}

export interface TaxonomyRoot {
  schema_version: string;
  name: string;
  file_name: string;
  subjects: TaxonomySubject[];
}

export const taxonomy = taxonomyRaw;

export interface ImportError {
  path: string;
  errors: Array<{ message: string }>;
}

export interface LoadResult {
  entries: KnowledgeEntity[];
  errors: ImportError[];
}

interface CandidateEntry {
  path: string;
  entry: KnowledgeEntity;
}

interface ValidationOptions {
  existingEntries?: KnowledgeEntity[];
  allowCandidateIdOverrides?: boolean;
}

const TOPIC_FIELD_NAMES = [
  'primary_topic_id',
  'primary_topic_ids',
  'secondary_topic_ids',
  'prerequisite_topic_ids',
  'related_topic_ids',
] as const;

const ENTITY_ID_FIELD_NAMES = [
  'definition_ids',
  'theorem_ids',
  'technique_ids',
  'example_ids',
  'problem_ids',
  'solution_ids',
  'used_definition_ids',
  'used_theorem_ids',
  'used_technique_ids',
  'related_problem_ids',
  'related_theorem_ids',
  'related_technique_ids',
  'equivalent_definition_ids',
  'expected_technique_ids',
  'linked_progress_record_ids',
  'supporting_progress_record_ids',
  'weak_ref_ids',
  'strong_ref_ids',
] as const;

function getCanonicalTopicIds() {
  const topicIds = new Set<string>();

  for (const subject of taxonomy?.subjects ?? []) {
    for (const topic of subject.topics) {
      topicIds.add(topic.id);
      for (const subtopic of topic.subtopics) {
        topicIds.add(subtopic.id);
      }
    }
  }

  return topicIds;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toEntityRefIds(refs?: EntityRef[]) {
  return (refs ?? []).map((ref) => ref.id);
}

function toRelationTargets(refs?: RelationRef[]) {
  return (refs ?? []).map((ref) => ref.target.id);
}

function toStepBlockRefs(stepBlocks?: StepBlock[]) {
  return (stepBlocks ?? []).flatMap((block) => toEntityRefIds(block.uses_refs));
}

function extractTopicIds(entry: KnowledgeEntity) {
  const topicIds = new Set<string>();

  for (const field of TOPIC_FIELD_NAMES) {
    const value = (entry as unknown as Record<string, unknown>)[field];
    if (typeof value === 'string') {
      topicIds.add(value);
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          topicIds.add(item);
        }
      }
    }
  }

  if (entry.entity_type === 'topic') {
    topicIds.add(entry.id);
  }

  return Array.from(topicIds);
}

function extractEntityIds(entry: KnowledgeEntity) {
  const ids = new Set<string>();
  const entityRecord = entry as unknown as Record<string, unknown>;

  for (const field of ENTITY_ID_FIELD_NAMES) {
    const value = entityRecord[field];
    if (typeof value === 'string') {
      ids.add(value);
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          ids.add(item);
        }
      }
    }
  }

  if ('parent_theorem_id' in entry && typeof entry.parent_theorem_id === 'string') {
    ids.add(entry.parent_theorem_id);
  }

  if ('solution_id' in entry && typeof entry.solution_id === 'string') {
    ids.add(entry.solution_id);
  }

  if ('review_schedule_id' in entry && typeof entry.review_schedule_id === 'string') {
    ids.add(entry.review_schedule_id);
  }

  if ('target_ref' in entry && isPlainObject(entry.target_ref) && typeof entry.target_ref.id === 'string') {
    ids.add(entry.target_ref.id);
  }

  if ('counterexample_to' in entry && isPlainObject(entry.counterexample_to) && typeof entry.counterexample_to.id === 'string') {
    ids.add(entry.counterexample_to.id);
  }

  if ('prerequisite_refs' in entry && Array.isArray(entry.prerequisite_refs)) {
    for (const refId of toEntityRefIds(entry.prerequisite_refs)) {
      ids.add(refId);
    }
  }

  if ('relation_refs' in entry && Array.isArray(entry.relation_refs)) {
    for (const refId of toRelationTargets(entry.relation_refs)) {
      ids.add(refId);
    }
  }

  if ('step_blocks' in entry && Array.isArray(entry.step_blocks)) {
    for (const refId of toStepBlockRefs(entry.step_blocks)) {
      ids.add(refId);
    }
  }

  return Array.from(ids);
}

function validateGraph(entry: KnowledgeEntity, allEntityIds: Set<string>, canonicalTopicIds: Set<string>) {
  const errors: Array<{ message: string }> = [];

  for (const topicId of extractTopicIds(entry)) {
    if (!canonicalTopicIds.has(topicId)) {
      errors.push({ message: `Unknown taxonomy topic reference "${topicId}".` });
    }
  }

  if (entry.entity_type === 'topic') {
    if (entry.prerequisite_topic_ids?.includes(entry.id)) {
      errors.push({ message: 'A topic cannot list itself as a prerequisite.' });
    }
    if (entry.related_topic_ids?.includes(entry.id)) {
      errors.push({ message: 'A topic cannot list itself as related.' });
    }
  }

  if (entry.entity_type === 'theorem' && entry.parent_theorem_id === entry.id) {
    errors.push({ message: 'A theorem cannot be its own parent theorem.' });
  }

  for (const entityId of extractEntityIds(entry)) {
    if (!allEntityIds.has(entityId)) {
      errors.push({ message: `Missing referenced entity "${entityId}".` });
    }
  }

  return errors;
}

function getKnownTopicIds(entries: Iterable<KnowledgeEntity>) {
  const topicIds = getCanonicalTopicIds();

  for (const entry of entries) {
    if (entry.entity_type === 'topic') {
      topicIds.add(entry.id);
    }
  }

  return topicIds;
}

function mergeImportErrors(target: ImportError[], entry: ImportError) {
  const existing = target.find((item) => item.path === entry.path);
  if (!existing) {
    target.push(entry);
    return;
  }

  const seenMessages = new Set(existing.errors.map((error) => error.message));
  for (const error of entry.errors) {
    if (!seenMessages.has(error.message)) {
      existing.errors.push(error);
      seenMessages.add(error.message);
    }
  }
}

function validateEntries(
  candidates: Array<{ path: string; data: unknown }>,
  options: ValidationOptions = {},
): LoadResult {
  const accepted: CandidateEntry[] = [];
  const errors: ImportError[] = [];

  for (const candidate of candidates) {
    if (!isPlainObject(candidate.data) || typeof candidate.data.entity_type !== 'string') {
      errors.push({
        path: candidate.path,
        errors: [{ message: 'Imported document is not a top-level entity object.' }],
      });
      continue;
    }

    try {
      const result = validateEntity(candidate.data);
      if (result.valid) {
        accepted.push({ path: candidate.path, entry: candidate.data as unknown as KnowledgeEntity });
      } else {
        errors.push({
          path: candidate.path,
          errors: (result.errors ?? []).map((error) => ({
            message: `${error.instancePath || '/'} ${error.message ?? 'Schema validation failed.'}`.trim(),
          })),
        });
      }
    } catch (error) {
      errors.push({
        path: candidate.path,
        errors: [{ message: error instanceof Error ? error.message : 'Unknown validation failure.' }],
      });
    }
  }

  const existingEntries = options.existingEntries ?? [];
  const allowCandidateIdOverrides = options.allowCandidateIdOverrides ?? false;

  const candidateEntries = allowCandidateIdOverrides
    ? accepted.reduce<CandidateEntry[]>((items, candidate) => {
        const existingIndex = items.findIndex((item) => item.entry.id === candidate.entry.id);
        if (existingIndex >= 0) {
          items[existingIndex] = candidate;
        } else {
          items.push(candidate);
        }
        return items;
      }, [])
    : accepted;

  if (!allowCandidateIdOverrides) {
    const duplicatePathsById = new Map<string, string[]>();

    for (const candidate of candidateEntries) {
      const paths = duplicatePathsById.get(candidate.entry.id) ?? [];
      paths.push(candidate.path);
      duplicatePathsById.set(candidate.entry.id, paths);
    }

    const duplicateIds = new Set(
      Array.from(duplicatePathsById.entries())
        .filter(([, paths]) => paths.length > 1)
        .map(([id]) => id),
    );

    for (const candidate of candidateEntries) {
      if (!duplicateIds.has(candidate.entry.id)) {
        continue;
      }

      mergeImportErrors(errors, {
        path: candidate.path,
        errors: [{ message: `Duplicate imported entity id "${candidate.entry.id}".` }],
      });
    }

    if (duplicateIds.size > 0) {
      for (let index = candidateEntries.length - 1; index >= 0; index -= 1) {
        if (duplicateIds.has(candidateEntries[index].entry.id)) {
          candidateEntries.splice(index, 1);
        }
      }
    }
  }

  const retained = new Map(candidateEntries.map((candidate) => [candidate.entry.id, candidate]));
  let changed = true;

  while (changed) {
    changed = false;

    const mergedEntries = new Map(existingEntries.map((entry) => [entry.id, entry]));
    for (const candidate of retained.values()) {
      mergedEntries.set(candidate.entry.id, candidate.entry);
    }

    const knownTopicIds = getKnownTopicIds(mergedEntries.values());
    const allEntityIds = new Set(mergedEntries.keys());
    const invalidIds: string[] = [];

    for (const candidate of retained.values()) {
      const graphErrors = validateGraph(candidate.entry, allEntityIds, knownTopicIds);
      if (graphErrors.length === 0) {
        continue;
      }

      mergeImportErrors(errors, { path: candidate.path, errors: graphErrors });
      invalidIds.push(candidate.entry.id);
    }

    if (invalidIds.length > 0) {
      changed = true;
      for (const invalidId of invalidIds) {
        retained.delete(invalidId);
      }
    }
  }

  const mergedEntries = new Map(existingEntries.map((entry) => [entry.id, entry]));
  for (const candidate of retained.values()) {
    mergedEntries.set(candidate.entry.id, candidate.entry);
  }

  return {
    entries: Array.from(mergedEntries.values()),
    errors,
  };
}

export function loadAllContent(extraCandidates: Array<{ path: string; data: unknown }> = []): LoadResult {
  return validateEntries(
    [
      ...Object.entries(contentModules).map(([path, moduleValue]) => ({
        path,
        data: (moduleValue as { default?: unknown }).default,
      })),
      ...extraCandidates,
    ],
    { allowCandidateIdOverrides: true },
  );
}

export function validateImportedPayload(payload: unknown, existingEntries: KnowledgeEntity[] = []): LoadResult {
  const candidates = Array.isArray(payload)
    ? payload.map((item, index) => ({
        path: `input[${index}]`,
        data: item,
      }))
    : [{ path: 'input[0]', data: payload }];

  const result = validateEntries(candidates, { existingEntries });
  const importedIds = new Set(candidates
    .filter((candidate) => isPlainObject(candidate.data) && typeof candidate.data.id === 'string')
    .map((candidate) => String(candidate.data.id)));

  if (Array.isArray(payload)) {
    return {
      entries: result.entries.filter((entry) => importedIds.has(entry.id)),
      errors: result.errors,
    };
  }

  return {
    entries: result.entries.filter((entry) => importedIds.has(entry.id)),
    errors: result.errors,
  };
}
