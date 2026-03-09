import { loadAllContent, taxonomy, type TaxonomyRoot, type TaxonomySubject, type TaxonomyTopic } from './loader';
import type {
  EntityType,
  KnowledgeEntity,
  LearnableEntity,
  ProblemEntity,
  SolutionEntity,
  SubjectId,
  TopicEntity,
} from '../types';
import { isLearnableEntity } from '../types';

type TopicContext = {
  subject: TaxonomySubject;
  topic: TaxonomyTopic;
  subtopicId?: string;
  subtopicName?: string;
};

const SUBJECT_FROM_PREFIX: Record<string, SubjectId> = {
  nt: 'number-theory',
  alg: 'algebra',
  comb: 'combinatorics',
  geo: 'geometry',
  meta: 'meta-techniques',
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

class DataIndex {
  private readonly entitiesById = new Map<string, KnowledgeEntity>();
  private readonly entitiesByType = new Map<EntityType, KnowledgeEntity[]>();
  private readonly entitiesBySubject = new Map<SubjectId, KnowledgeEntity[]>();
  private readonly entitiesByTopic = new Map<string, KnowledgeEntity[]>();
  private readonly entitiesByTag = new Map<string, KnowledgeEntity[]>();
  private readonly prerequisitesById = new Map<string, string[]>();
  private readonly relatedIdsById = new Map<string, string[]>();
  private readonly topicContextById = new Map<string, TopicContext>();
  private validationErrors: Array<{ path: string; errors: Array<{ message: string }> }> = [];

  constructor() {
    this.buildTopicContext();
    this.initialize();
  }

  private buildTopicContext() {
    for (const subject of taxonomy?.subjects ?? []) {
      for (const topic of subject.topics) {
        this.topicContextById.set(topic.id, { subject, topic });
        for (const subtopic of topic.subtopics) {
          this.topicContextById.set(subtopic.id, {
            subject,
            topic,
            subtopicId: subtopic.id,
            subtopicName: subtopic.name,
          });
        }
      }
    }
  }

  private initialize() {
    const { entries, errors } = loadAllContent();
    this.validationErrors = errors;

    for (const entry of entries) {
      this.entitiesById.set(entry.id, entry);

      const byType = this.entitiesByType.get(entry.entity_type) ?? [];
      byType.push(entry);
      this.entitiesByType.set(entry.entity_type, byType);

      const subjectId = this.getSubjectIdForEntity(entry);
      if (subjectId) {
        const bySubject = this.entitiesBySubject.get(subjectId) ?? [];
        bySubject.push(entry);
        this.entitiesBySubject.set(subjectId, bySubject);
      }

      for (const topicId of this.getTopicIdsForEntity(entry)) {
        const byTopic = this.entitiesByTopic.get(topicId) ?? [];
        byTopic.push(entry);
        this.entitiesByTopic.set(topicId, byTopic);
      }

      for (const tag of this.computeTags(entry)) {
        const key = tag.toLowerCase();
        const byTag = this.entitiesByTag.get(key) ?? [];
        byTag.push(entry);
        this.entitiesByTag.set(key, byTag);
      }

      this.prerequisitesById.set(entry.id, this.extractPrerequisiteIds(entry));
      this.relatedIdsById.set(entry.id, this.extractRelatedIds(entry));
    }

    for (const [subjectId, items] of this.entitiesBySubject) {
      items.sort((left, right) => this.compareEntities(left, right, subjectId));
    }
  }

  private compareEntities(left: KnowledgeEntity, right: KnowledgeEntity, subjectId?: SubjectId) {
    const leftTopicOrder = this.getTopicIdsForEntity(left)
      .map((topicId) => this.getTopicContext(topicId)?.topic.display_order ?? 999)
      .sort((a, b) => a - b)[0] ?? 999;
    const rightTopicOrder = this.getTopicIdsForEntity(right)
      .map((topicId) => this.getTopicContext(topicId)?.topic.display_order ?? 999)
      .sort((a, b) => a - b)[0] ?? 999;

    if (leftTopicOrder !== rightTopicOrder) {
      return leftTopicOrder - rightTopicOrder;
    }

    if (left.entity_type === 'topic' && right.entity_type === 'topic') {
      return left.display_order - right.display_order;
    }

    const leftName = this.getEntityTitle(left, subjectId);
    const rightName = this.getEntityTitle(right, subjectId);
    return leftName.localeCompare(rightName);
  }

  private getSubjectIdForEntity(entity: KnowledgeEntity): SubjectId | null {
    if (entity.entity_type === 'topic') {
      return entity.subject_id;
    }

    const topicId = this.getPrimaryTopicId(entity);
    if (topicId) {
      const context = this.getTopicContext(topicId);
      if (context) {
        return context.subject.id as SubjectId;
      }
    }

    const prefix = entity.id.split('.')[1] ? entity.id.split('.')[1] : entity.id.split('.')[0];
    return SUBJECT_FROM_PREFIX[prefix] ?? null;
  }

  private getPrimaryTopicId(entity: KnowledgeEntity) {
    if ('primary_topic_id' in entity && typeof entity.primary_topic_id === 'string') {
      return entity.primary_topic_id;
    }
    if ('primary_topic_ids' in entity && Array.isArray(entity.primary_topic_ids) && entity.primary_topic_ids.length > 0) {
      return entity.primary_topic_ids[0];
    }
    if (entity.entity_type === 'topic') {
      return entity.id;
    }
    return null;
  }

  private getTopicIdsForEntity(entity: KnowledgeEntity) {
    const topicIds = new Set<string>();

    if (entity.entity_type === 'topic') {
      topicIds.add(entity.id);
    }

    if ('primary_topic_id' in entity && typeof entity.primary_topic_id === 'string') {
      topicIds.add(entity.primary_topic_id);
    }

    if ('primary_topic_ids' in entity && Array.isArray(entity.primary_topic_ids)) {
      for (const topicId of entity.primary_topic_ids) {
        topicIds.add(topicId);
      }
    }

    if ('secondary_topic_ids' in entity && Array.isArray(entity.secondary_topic_ids)) {
      for (const topicId of entity.secondary_topic_ids) {
        topicIds.add(topicId);
      }
    }

    return Array.from(topicIds);
  }

  private computeTags(entity: KnowledgeEntity) {
    const tags = new Set<string>();
    const subjectId = this.getSubjectIdForEntity(entity);
    const subject = subjectId ? this.getSubject(subjectId) : null;

    tags.add(entity.entity_type);
    if (subject) {
      tags.add(subject.name);
    }

    for (const topicId of this.getTopicIdsForEntity(entity)) {
      const context = this.getTopicContext(topicId);
      if (context) {
        tags.add(context.topic.name);
        if (context.subtopicName) {
          tags.add(context.subtopicName);
        }
      }
    }

    if ('theorem_kind' in entity) {
      tags.add(capitalize(entity.theorem_kind));
    }
    if ('definition_kind' in entity) {
      tags.add(capitalize(entity.definition_kind));
    }
    if ('technique_kind' in entity) {
      tags.add(capitalize(entity.technique_kind));
    }
    if ('problem_kind' in entity) {
      tags.add(capitalize(entity.problem_kind));
    }
    if ('short_label' in entity && entity.short_label) {
      tags.add(entity.short_label);
    }

    return Array.from(tags);
  }

  private extractPrerequisiteIds(entity: KnowledgeEntity) {
    const ids = new Set<string>();

    if (entity.entity_type === 'topic') {
      for (const topicId of entity.prerequisite_topic_ids ?? []) {
        ids.add(topicId);
      }
    }

    if ('prerequisite_refs' in entity) {
      for (const ref of entity.prerequisite_refs ?? []) {
        ids.add(ref.id);
      }
    }

    if ('used_definition_ids' in entity) {
      for (const id of entity.used_definition_ids ?? []) {
        ids.add(id);
      }
    }

    if ('used_theorem_ids' in entity) {
      for (const id of entity.used_theorem_ids ?? []) {
        ids.add(id);
      }
    }

    if ('used_technique_ids' in entity) {
      for (const id of entity.used_technique_ids ?? []) {
        ids.add(id);
      }
    }

    if ('expected_technique_ids' in entity) {
      for (const id of entity.expected_technique_ids ?? []) {
        ids.add(id);
      }
    }

    if ('relation_refs' in entity) {
      for (const ref of entity.relation_refs ?? []) {
        if (ref.relation === 'prerequisite' || ref.relation === 'depends-on') {
          ids.add(ref.target.id);
        }
      }
    }

    return Array.from(ids).filter((id) => id !== entity.id);
  }

  private extractRelatedIds(entity: KnowledgeEntity) {
    const ids = new Set<string>();

    if (entity.entity_type === 'topic') {
      for (const topicId of entity.related_topic_ids ?? []) {
        ids.add(topicId);
      }
      for (const id of entity.definition_ids ?? []) {
        ids.add(id);
      }
      for (const id of entity.theorem_ids ?? []) {
        ids.add(id);
      }
      for (const id of entity.technique_ids ?? []) {
        ids.add(id);
      }
      for (const id of entity.example_ids ?? []) {
        ids.add(id);
      }
      for (const id of entity.problem_ids ?? []) {
        ids.add(id);
      }
    }

    if ('example_ids' in entity) {
      for (const id of entity.example_ids ?? []) {
        ids.add(id);
      }
    }

    if ('problem_ids' in entity) {
      for (const id of entity.problem_ids ?? []) {
        ids.add(id);
      }
    }

    if ('solution_ids' in entity) {
      for (const id of entity.solution_ids ?? []) {
        ids.add(id);
      }
    }

    if ('related_problem_ids' in entity) {
      for (const id of entity.related_problem_ids ?? []) {
        ids.add(id);
      }
    }

    if ('related_theorem_ids' in entity) {
      for (const id of entity.related_theorem_ids ?? []) {
        ids.add(id);
      }
    }

    if ('related_technique_ids' in entity) {
      for (const id of entity.related_technique_ids ?? []) {
        ids.add(id);
      }
    }

    if ('equivalent_definition_ids' in entity) {
      for (const id of entity.equivalent_definition_ids ?? []) {
        ids.add(id);
      }
    }

    if ('parent_theorem_id' in entity && entity.parent_theorem_id) {
      ids.add(entity.parent_theorem_id);
    }

    if ('solution_id' in entity && entity.solution_id) {
      ids.add(entity.solution_id);
    }

    if ('target_ref' in entity && entity.target_ref) {
      ids.add(entity.target_ref.id);
    }

    if ('counterexample_to' in entity && entity.counterexample_to) {
      ids.add(entity.counterexample_to.id);
    }

    if ('relation_refs' in entity) {
      for (const ref of entity.relation_refs ?? []) {
        ids.add(ref.target.id);
      }
    }

    return Array.from(ids).filter((id) => id !== entity.id);
  }

  getTaxonomy(): TaxonomyRoot | null {
    return taxonomy;
  }

  getValidationErrors() {
    return this.validationErrors;
  }

  getAllEntities() {
    return Array.from(this.entitiesById.values());
  }

  getEntity<T extends KnowledgeEntity = KnowledgeEntity>(id: string) {
    return this.entitiesById.get(id) as T | undefined;
  }

  getTopicContext(topicId: string) {
    return this.topicContextById.get(topicId);
  }

  getSubject(subjectId: SubjectId) {
    return taxonomy?.subjects.find((subject) => subject.id === subjectId) ?? null;
  }

  getAuthoredSubjects() {
    return (taxonomy?.subjects ?? []).filter((subject) => (this.entitiesBySubject.get(subject.id as SubjectId) ?? []).length > 0);
  }

  getAuthoredTopics(subjectId: SubjectId) {
    const authoredTopicIds = new Set(
      (this.entitiesBySubject.get(subjectId) ?? [])
        .filter((entity): entity is TopicEntity => entity.entity_type === 'topic')
        .map((entity) => entity.id),
    );

    return (this.getSubject(subjectId)?.topics ?? []).filter((topic) => authoredTopicIds.has(topic.id));
  }

  getEntitiesByType<T extends KnowledgeEntity = KnowledgeEntity>(type: EntityType) {
    return (this.entitiesByType.get(type) ?? []) as T[];
  }

  getLearnableEntities() {
    return this.getAllEntities().filter((entity): entity is LearnableEntity => isLearnableEntity(entity));
  }

  getEntitiesBySubject(subjectId: SubjectId) {
    return this.entitiesBySubject.get(subjectId) ?? [];
  }

  getEntitiesByTopic(topicId: string) {
    return this.entitiesByTopic.get(topicId) ?? [];
  }

  getProblemsByTopic(topicId: string) {
    return this.getEntitiesByTopic(topicId).filter((entity): entity is ProblemEntity => entity.entity_type === 'problem');
  }

  getSolutionsForTarget(targetId: string) {
    return this.getEntitiesByType<SolutionEntity>('solution').filter((entity) => entity.target_ref.id === targetId);
  }

  getTagsForEntity(entityId: string) {
    const entity = this.getEntity(entityId);
    return entity ? this.computeTags(entity) : [];
  }

  getEntitiesForTag(tag: string) {
    return this.entitiesByTag.get(tag.toLowerCase()) ?? [];
  }

  getPrerequisiteIds(entityId: string) {
    return this.prerequisitesById.get(entityId) ?? [];
  }

  getRelatedIds(entityId: string) {
    return this.relatedIdsById.get(entityId) ?? [];
  }

  getEntityTitle(entity: KnowledgeEntity, subjectId?: SubjectId) {
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
    const entitySubjectId = subjectId ?? this.getSubjectIdForEntity(entity) ?? 'number-theory';
    return `${capitalize(entity.entity_type)} (${entitySubjectId})`;
  }
}

export const dataIndex = new DataIndex();
