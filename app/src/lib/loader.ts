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

function validateEntries(candidates: Array<{ path: string; data: unknown }>): LoadResult {
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

  const canonicalTopicIds = getCanonicalTopicIds();
  const allEntityIds = new Set(accepted.map((candidate) => candidate.entry.id));
  const graphAccepted: KnowledgeEntity[] = [];

  for (const candidate of accepted) {
    const graphErrors = validateGraph(candidate.entry, allEntityIds, canonicalTopicIds);
    if (graphErrors.length > 0) {
      errors.push({ path: candidate.path, errors: graphErrors });
      continue;
    }
    graphAccepted.push(candidate.entry);
  }

  return { entries: graphAccepted, errors };
}

export function loadAllContent(): LoadResult {
  return validateEntries(
    Object.entries(contentModules).map(([path, moduleValue]) => ({
      path,
      data: (moduleValue as { default?: unknown }).default,
    })),
  );
}

export function validateImportedPayload(payload: unknown): LoadResult {
  if (Array.isArray(payload)) {
    return validateEntries(
      payload.map((item, index) => ({
        path: `input[${index}]`,
        data: item,
      })),
    );
  }

  return validateEntries([{ path: 'input[0]', data: payload }]);
}
