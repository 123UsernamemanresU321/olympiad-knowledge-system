import { dataIndex } from './dataIndex';
import type { TaxonomySubject, TaxonomySubtopic, TaxonomyTopic } from './loader';
import type {
  EntityType,
  KnowledgeEntity,
  LearnableEntity,
  MathContent,
  ProblemEntity,
  SubjectId,
  TopicEntity,
} from '../types';

export type { TaxonomySubject, TaxonomySubtopic, TaxonomyTopic } from './loader';

type ProgressSnapshot = {
  problemStates?: Record<string, string>;
  reviewSchedules?: Record<
    string,
    {
      due_at: string;
      interval_days: number;
      ease_factor: number;
      repetition_count: number;
      last_reviewed_at?: string | null;
      status?: string;
      target_type?: EntityType;
    }
  >;
};

export type CatalogType = 'theorem' | 'definition' | 'technique' | 'problem' | 'example';

export interface CatalogItem {
  id: string;
  title: string;
  type: CatalogType;
  route: string;
  subjectId: SubjectId;
  topicId: string;
  focusIds?: string[];
  description: string;
  formula?: string;
  status: 'Draft' | 'Reviewed' | 'Published' | 'Archived' | 'Solved' | 'Mastered';
  difficulty: 'Easy' | 'Intermediate' | 'Hard';
  tags: string[];
  updatedLabel: string;
  collection?: string;
}

export interface ReviewQueueItem {
  entryId: string;
  tone: 'rose' | 'amber' | 'emerald';
  dueLabel: string;
  lastReviewed: string;
  retention: number;
  ribbon: string;
  collection: string;
  art: 'lines' | 'chalk' | 'wave';
}

export interface ValidationLogItem {
  level: 'error' | 'warning';
  message: string;
}

export interface ImportPreviewRow {
  entryId: string;
  topic: string;
  difficulty: number;
  concept: string;
  status: 'Valid' | 'Modified';
}

function formatRelativeDate(input: string) {
  const date = new Date(input);
  const now = new Date();
  const deltaMs = date.getTime() - now.getTime();
  const absDays = Math.round(Math.abs(deltaMs) / 86400000);
  const absHours = Math.round(Math.abs(deltaMs) / 3600000);

  if (Math.abs(deltaMs) < 3600000) {
    return deltaMs <= 0 ? 'due now' : 'due within the hour';
  }
  if (absHours < 24) {
    return deltaMs < 0 ? `${absHours}h ago` : `in ${absHours}h`;
  }
  if (absDays === 0) {
    return deltaMs < 0 ? 'today' : 'later today';
  }
  if (absDays === 1) {
    return deltaMs < 0 ? 'yesterday' : 'tomorrow';
  }
  return deltaMs < 0 ? `${absDays} days ago` : `in ${absDays} days`;
}

function formatUpdatedLabel(input: string) {
  const value = new Date(input);
  return `Updated ${value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapDifficulty(entity: LearnableEntity): CatalogItem['difficulty'] {
  if (entity.entity_type === 'problem') {
    if (entity.difficulty <= 2) {
      return 'Easy';
    }
    if (entity.difficulty <= 4) {
      return 'Intermediate';
    }
    return 'Hard';
  }

  const effort = entity.tracking_profile.estimated_effort_minutes;
  if (effort <= 18) {
    return 'Easy';
  }
  if (effort <= 32) {
    return 'Intermediate';
  }
  return 'Hard';
}

function mapStatus(entity: LearnableEntity): CatalogItem['status'] {
  if (entity.entity_type === 'problem') {
    return entity.status === 'published' ? 'Reviewed' : titleCase(entity.status) as CatalogItem['status'];
  }
  return titleCase(entity.status) as CatalogItem['status'];
}

function mapFormula(entity: LearnableEntity) {
  if (entity.entity_type === 'theorem') {
    return entity.statement.latex ?? entity.conclusion?.latex ?? undefined;
  }
  if (entity.entity_type === 'definition') {
    return entity.statement.latex ?? undefined;
  }
  if (entity.entity_type === 'example') {
    return entity.final_result?.latex ?? undefined;
  }
  if (entity.entity_type === 'problem') {
    return entity.answer_key?.latex ?? undefined;
  }
  return undefined;
}

export function readMathContent(content?: MathContent | null) {
  if (!content) {
    return '';
  }
  return content.plain_text || content.markdown || content.latex || '';
}

export function readMathParagraphs(content?: MathContent | null) {
  return readMathContent(content)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function getEntityRoute(entity: LearnableEntity | KnowledgeEntity) {
  return entity.entity_type === 'problem' ? `/problems/${entity.id}` : `/entries/${entity.id}`;
}

export function getEntityTitle(entity: KnowledgeEntity) {
  if ('title' in entity && entity.title) {
    return entity.title;
  }
  if ('name' in entity && entity.name) {
    return entity.name;
  }
  if ('term' in entity && entity.term) {
    return entity.term;
  }
  if ('short_label' in entity && entity.short_label) {
    return entity.short_label;
  }
  return entity.id;
}

export function getEntitySummary(entity: LearnableEntity | TopicEntity) {
  switch (entity.entity_type) {
    case 'topic':
      return readMathContent(entity.summary);
    case 'definition':
      return readMathContent(entity.statement);
    case 'theorem':
      return readMathContent(entity.statement);
    case 'technique':
      return readMathContent(entity.summary);
    case 'example':
      return readMathContent(entity.prompt);
    case 'problem':
      return readMathContent(entity.statement);
    default:
      return '';
  }
}

function getEntitySubjectId(entity: LearnableEntity | TopicEntity): SubjectId {
  const topicId = entity.entity_type === 'topic'
    ? entity.id
    : 'primary_topic_id' in entity
      ? entity.primary_topic_id
      : entity.primary_topic_ids[0];
  return dataIndex.getTopicContext(topicId)?.subject.id as SubjectId;
}

function getCollectionLabel(entity: LearnableEntity) {
  if (entity.entity_type === 'problem' && entity.source?.name) {
    const year = entity.source.year ? ` ${entity.source.year}` : '';
    return `${entity.source.name}${year}`;
  }
  const topicContext = dataIndex.getTopicContext(
    'primary_topic_id' in entity ? entity.primary_topic_id : entity.primary_topic_ids[0],
  );
  return topicContext ? `${topicContext.subject.name} / ${topicContext.topic.name}` : undefined;
}

function toCatalogItem(entity: LearnableEntity): CatalogItem {
  const topicId = 'primary_topic_id' in entity ? entity.primary_topic_id : entity.primary_topic_ids[0];
  const subjectId = getEntitySubjectId(entity);

  return {
    id: entity.id,
    title: getEntityTitle(entity),
    type: entity.entity_type,
    route: getEntityRoute(entity),
    subjectId,
    topicId,
    focusIds: dataIndex.getTopicContext(topicId)?.subtopicId ? [dataIndex.getTopicContext(topicId)!.subtopicId!] : undefined,
    description: getEntitySummary(entity),
    formula: mapFormula(entity),
    status: mapStatus(entity),
    difficulty: mapDifficulty(entity),
    tags: dataIndex.getTagsForEntity(entity.id),
    updatedLabel: formatUpdatedLabel(entity.audit.updated_at),
    collection: getCollectionLabel(entity),
  };
}

export function getSubjects(): TaxonomySubject[] {
  return dataIndex.getAuthoredSubjects().map((subject) => ({
    ...subject,
    topics: dataIndex.getAuthoredTopics(subject.id as SubjectId),
  }));
}

export function getSubjectById(subjectId?: string) {
  if (!subjectId) {
    return undefined;
  }
  return getSubjects().find((subject) => subject.id === subjectId);
}

export function getSubjectDescription(subjectId: string) {
  const subject = getSubjectById(subjectId);
  if (!subject) {
    return 'A curated olympiad track with layered topics, definitions, theorems, and practice.';
  }

  const topicSummaries = dataIndex
    .getEntitiesBySubject(subject.id as SubjectId)
    .filter((entity): entity is TopicEntity => entity.entity_type === 'topic')
    .slice(0, 2)
    .map((topic) => readMathContent(topic.summary));

  if (topicSummaries.length > 0) {
    return topicSummaries.join(' ');
  }

  return `${subject.name} authored track with ${subject.topics.length} validated topic lanes.`;
}

export function getTopicDescription(topicId: string) {
  const topic = dataIndex.getEntity<TopicEntity>(topicId);
  if (topic?.entity_type === 'topic') {
    return readMathContent(topic.summary);
  }

  const context = dataIndex.getTopicContext(topicId);
  return context
    ? `${context.subtopicName ?? context.topic.name} sits inside ${context.subject.name} and is reachable from the validated authored track.`
    : 'A structured knowledge lane with linked entries, worked examples, and practice references.';
}

export function resolveTopic(topicId: string): {
  subject: TaxonomySubject;
  topic: TaxonomyTopic;
  activeSubtopic?: TaxonomySubtopic;
} | null {
  for (const subject of getSubjects()) {
    for (const topic of subject.topics) {
      if (topic.id === topicId) {
        return { subject, topic };
      }
      const activeSubtopic = topic.subtopics.find((subtopic) => subtopic.id === topicId);
      if (activeSubtopic) {
        return { subject, topic, activeSubtopic };
      }
    }
  }

  const context = dataIndex.getTopicContext(topicId);
  if (context) {
    return {
      subject: context.subject,
      topic: context.topic,
      activeSubtopic: context.subtopicId
        ? context.topic.subtopics.find((subtopic) => subtopic.id === context.subtopicId)
        : undefined,
    };
  }

  return null;
}

export function getCatalogItems() {
  return dataIndex.getLearnableEntities().map(toCatalogItem);
}

export function getCatalogItem(itemId: string) {
  return getCatalogItems().find((item) => item.id === itemId);
}

export function getCatalogForSubject(subjectId: string) {
  return getCatalogItems().filter((item) => item.subjectId === subjectId);
}

export function getCatalogForTopic(topicId: string) {
  const resolved = resolveTopic(topicId);
  if (!resolved) {
    return [];
  }

  return getCatalogItems().filter((item) => item.topicId === resolved.topic.id);
}

export function searchCatalog(query: string, filterType: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return getCatalogItems().filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.description,
      item.subjectId,
      item.topicId,
      item.tags.join(' '),
      item.formula ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function getRelatedCatalogItems(entityId: string) {
  return dataIndex
    .getRelatedIds(entityId)
    .map((id) => getCatalogItem(id))
    .filter((item): item is CatalogItem => Boolean(item));
}

export function getPrerequisiteCatalogItems(entityId: string) {
  return dataIndex
    .getPrerequisiteIds(entityId)
    .map((id) => getCatalogItem(id))
    .filter((item): item is CatalogItem => Boolean(item));
}

export function getReviewQueueItems(progress?: ProgressSnapshot): ReviewQueueItem[] {
  const schedules = Object.entries(progress?.reviewSchedules ?? {})
    .sort(([, left], [, right]) => new Date(left.due_at).getTime() - new Date(right.due_at).getTime());

  const items: ReviewQueueItem[] = [];

  schedules.forEach(([entryId, schedule], index) => {
    const entry = getCatalogItem(entryId);
    if (!entry) {
      return;
    }

    const hoursUntilDue = Math.round((new Date(schedule.due_at).getTime() - Date.now()) / 3600000);
    const retention = Math.max(48, Math.min(99, 92 - schedule.interval_days * 4 + schedule.repetition_count * 3));
    const tone: ReviewQueueItem['tone'] =
      hoursUntilDue < 0 ? 'rose' : hoursUntilDue < 24 ? 'amber' : 'emerald';

    items.push({
      entryId,
      tone,
      dueLabel: `Due: ${formatRelativeDate(schedule.due_at)}`,
      lastReviewed: schedule.last_reviewed_at ? formatRelativeDate(schedule.last_reviewed_at) : 'Not reviewed yet',
      retention,
      ribbon: entry.difficulty,
      collection: entry.collection ?? `${titleCase(entry.subjectId)} / ${entry.type}`,
      art: (['lines', 'chalk', 'wave'] as const)[index % 3],
    });
  });

  return items;
}

export function getValidationLogs() {
  return dataIndex.getValidationErrors().flatMap((entry) =>
    entry.errors.map((error) => ({
      level: 'error' as const,
      message: `${entry.path}: ${error.message}`,
    })),
  );
}

export function getImportPreviewRows(entries: KnowledgeEntity[] = dataIndex.getLearnableEntities()): ImportPreviewRow[] {
  return entries
    .filter((entity): entity is LearnableEntity => ['definition', 'theorem', 'technique', 'example', 'problem'].includes(entity.entity_type))
    .map((entity) => {
    const topicId = 'primary_topic_id' in entity ? entity.primary_topic_id : entity.primary_topic_ids[0];
    const topicName = dataIndex.getTopicContext(topicId)?.topic.name ?? topicId;
    const difficulty = entity.entity_type === 'problem'
      ? entity.difficulty
      : Math.min(5, Math.max(1, Math.round(entity.tracking_profile.estimated_effort_minutes / 10)));

    return {
      entryId: entity.id,
      topic: topicName,
      difficulty,
      concept: getEntityTitle(entity),
      status: entity.status === 'draft' ? 'Modified' : 'Valid',
    };
    });
}

export function getTopTags(items: CatalogItem[], limit = 5) {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const tag of item.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit);
}

export function getSubjectTopicEntities(subjectId: SubjectId) {
  return dataIndex
    .getEntitiesBySubject(subjectId)
    .filter((entity): entity is TopicEntity => entity.entity_type === 'topic');
}

export function getProblemEntity(problemId: string) {
  const entity = dataIndex.getEntity(problemId);
  return entity?.entity_type === 'problem' ? (entity as ProblemEntity) : null;
}

export function getKnowledgeEntity(entityId: string) {
  return dataIndex.getEntity(entityId);
}
