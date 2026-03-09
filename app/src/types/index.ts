export type EntityType =
  | 'topic'
  | 'definition'
  | 'theorem'
  | 'technique'
  | 'example'
  | 'problem'
  | 'solution'
  | 'progress_record'
  | 'review_schedule'
  | 'mastery_profile';

export type SubjectId =
  | 'number-theory'
  | 'algebra'
  | 'combinatorics'
  | 'geometry'
  | 'meta-techniques';

export type ContentStatus = 'draft' | 'reviewed' | 'published' | 'archived';

export interface AuditMeta {
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface MathContent {
  source_format: 'markdown' | 'latex' | 'dual';
  plain_text: string;
  markdown?: string;
  latex?: string;
  html?: string;
  macros_used?: string[];
  display_mode?: 'inline' | 'block' | 'mixed';
}

export interface TrackingProfile {
  is_trackable: boolean;
  mastery_weight: number;
  review_priority: 'low' | 'normal' | 'high' | 'critical';
  completion_criteria: Array<
    'read' | 'understand' | 'recall' | 'restate' | 'apply' | 'prove' | 'solve' | 'review'
  >;
  estimated_effort_minutes: number;
}

export interface EntityRef {
  entity_type: EntityType;
  id: string;
}

export interface RelationRef {
  relation:
    | 'prerequisite'
    | 'depends-on'
    | 'generalizes'
    | 'special-case-of'
    | 'used-in'
    | 'related-to'
    | 'equivalent-to'
    | 'exemplifies'
    | 'solved-by';
  target: EntityRef;
  note?: MathContent;
}

export interface NotationItem {
  symbol: string;
  role:
    | 'variable'
    | 'constant'
    | 'function'
    | 'sequence'
    | 'set'
    | 'operator'
    | 'point'
    | 'line'
    | 'circle'
    | 'angle';
  meaning: MathContent;
}

export interface SourceRef {
  source_kind: 'original' | 'contest' | 'textbook' | 'note' | 'derived' | 'imported';
  name?: string;
  year?: number;
  round?: string;
  problem_code?: string;
  url?: string;
  citation_text?: string;
}

export interface BaseEntity {
  id: string;
  entity_type: EntityType;
  schema_version: string;
  status: ContentStatus;
  audit: AuditMeta;
}

export interface TopicEntity extends BaseEntity {
  entity_type: 'topic';
  subject_id: SubjectId;
  name: string;
  slug: string;
  level: 'core' | 'extension' | 'specialized';
  display_order: number;
  summary: MathContent;
  learning_objectives: string[];
  tracking_profile: TrackingProfile;
  prerequisite_topic_ids?: string[];
  related_topic_ids?: string[];
  definition_ids?: string[];
  theorem_ids?: string[];
  technique_ids?: string[];
  example_ids?: string[];
  problem_ids?: string[];
  notation?: NotationItem[];
  export_notes?: MathContent;
}

export interface DefinitionEntity extends BaseEntity {
  entity_type: 'definition';
  definition_kind: 'definition' | 'notation' | 'convention';
  primary_topic_id: string;
  term: string;
  slug: string;
  statement: MathContent;
  tracking_profile: TrackingProfile;
  secondary_topic_ids?: string[];
  notation?: NotationItem[];
  assumptions?: MathContent[];
  equivalent_definition_ids?: string[];
  related_theorem_ids?: string[];
  related_technique_ids?: string[];
  example_ids?: string[];
  problem_ids?: string[];
  relation_refs?: RelationRef[];
}

export interface TheoremEntity extends BaseEntity {
  entity_type: 'theorem';
  theorem_kind: 'theorem' | 'lemma' | 'corollary' | 'proposition' | 'claim';
  primary_topic_id: string;
  title: string;
  slug: string;
  statement: MathContent;
  proof_status: 'none' | 'outline' | 'sketch' | 'full' | 'external';
  tracking_profile: TrackingProfile;
  secondary_topic_ids?: string[];
  hypotheses?: MathContent[];
  conclusion?: MathContent;
  notation?: NotationItem[];
  proof?: MathContent;
  proof_outline_steps?: MathContent[];
  parent_theorem_id?: string;
  used_definition_ids?: string[];
  used_theorem_ids?: string[];
  used_technique_ids?: string[];
  example_ids?: string[];
  problem_ids?: string[];
  relation_refs?: RelationRef[];
}

export interface TechniqueEntity extends BaseEntity {
  entity_type: 'technique';
  technique_kind: 'algebraic' | 'number-theoretic' | 'combinatorial' | 'geometric' | 'meta' | 'hybrid';
  primary_topic_ids: string[];
  name: string;
  slug: string;
  summary: MathContent;
  trigger_conditions: MathContent[];
  method_steps: MathContent[];
  tracking_profile: TrackingProfile;
  prerequisite_refs?: EntityRef[];
  failure_modes?: MathContent[];
  used_definition_ids?: string[];
  used_theorem_ids?: string[];
  example_ids?: string[];
  problem_ids?: string[];
  relation_refs?: RelationRef[];
}

export interface ExampleEntity extends BaseEntity {
  entity_type: 'example';
  example_kind: 'worked-example' | 'illustrative' | 'counterexample' | 'application' | 'edge-case';
  primary_topic_id: string;
  title: string;
  slug: string;
  prompt: MathContent;
  solution_id: string;
  tracking_profile: TrackingProfile;
  objective?: MathContent;
  used_definition_ids?: string[];
  used_theorem_ids?: string[];
  used_technique_ids?: string[];
  related_problem_ids?: string[];
  counterexample_to?: EntityRef;
  final_result?: MathContent;
}

export interface ProblemEntity extends BaseEntity {
  entity_type: 'problem';
  primary_topic_ids: string[];
  short_label: string;
  statement: MathContent;
  problem_kind: 'proof' | 'short-answer' | 'computation' | 'construction' | 'existence' | 'multiple-choice';
  expected_response_kind:
    | 'proof'
    | 'integer'
    | 'real-number'
    | 'expression'
    | 'tuple'
    | 'set'
    | 'construction'
    | 'multiple-choice'
    | 'algorithm';
  difficulty: number;
  tracking_profile: TrackingProfile;
  title?: string;
  secondary_topic_ids?: string[];
  source?: SourceRef;
  used_definition_ids?: string[];
  used_theorem_ids?: string[];
  expected_technique_ids?: string[];
  hint_blocks?: MathContent[];
  solution_ids?: string[];
  time_estimate_minutes?: number;
  answer_key?: MathContent;
  is_original?: boolean;
  relation_refs?: RelationRef[];
}

export interface StepBlock {
  index: number;
  heading?: string;
  content: MathContent;
  uses_refs?: EntityRef[];
}

export interface SolutionEntity extends BaseEntity {
  entity_type: 'solution';
  target_ref: EntityRef;
  solution_kind: 'full' | 'outline' | 'official' | 'alternative' | 'hint-sequence';
  solution_status: 'complete' | 'partial' | 'sketch';
  body: MathContent;
  tracking_profile: TrackingProfile;
  title?: string;
  step_blocks?: StepBlock[];
  final_answer?: MathContent;
  used_definition_ids?: string[];
  used_theorem_ids?: string[];
  used_technique_ids?: string[];
  source?: SourceRef;
  is_official?: boolean;
  relation_refs?: RelationRef[];
}

export interface ProgressRecordEntity extends BaseEntity {
  entity_type: 'progress_record';
  learner_id: string;
  target_ref: EntityRef;
  interaction_type: 'view' | 'study' | 'attempt' | 'solve' | 'review' | 'recall' | 'prove' | 'annotate';
  outcome: 'seen' | 'incorrect' | 'partial' | 'correct' | 'mastered' | 'forgotten' | 'skipped';
  occurred_at: string;
  time_spent_seconds: number;
  score?: number;
  confidence_before?: number;
  confidence_after?: number;
  mastery_delta?: number;
  note?: MathContent;
  session_id?: string;
  review_schedule_id?: string;
  source_context?: string;
}

export interface ReviewScheduleEntity extends BaseEntity {
  entity_type: 'review_schedule';
  learner_id: string;
  target_ref: EntityRef;
  algorithm: 'manual' | 'fixed-interval' | 'sm2' | 'fsrs' | 'custom-v1';
  due_at: string;
  interval_days: number;
  repetition_count: number;
  ease_factor?: number;
  stability?: number;
  difficulty_score?: number;
  last_reviewed_at?: string;
  suspended_until?: string;
  linked_progress_record_ids?: string[];
}

export interface MasteryProfileEntity extends BaseEntity {
  entity_type: 'mastery_profile';
  learner_id: string;
  target_ref: EntityRef;
  mastery_score: number;
  mastery_level: 'unseen' | 'exposed' | 'developing' | 'functional' | 'proficient' | 'mastered' | 'retained';
  confidence_score: number;
  evidence_count: number;
  computed_at: string;
  last_interacted_at: string;
  supporting_progress_record_ids?: string[];
  review_schedule_id?: string;
  weak_ref_ids?: string[];
  strong_ref_ids?: string[];
  coverage_snapshot?: Record<string, { covered: number; total: number; ratio: number }>;
  recommended_next_actions?: string[];
  notes?: MathContent;
}

export type KnowledgeEntity =
  | TopicEntity
  | DefinitionEntity
  | TheoremEntity
  | TechniqueEntity
  | ExampleEntity
  | ProblemEntity
  | SolutionEntity
  | ProgressRecordEntity
  | ReviewScheduleEntity
  | MasteryProfileEntity;

export type LearnableEntity = DefinitionEntity | TheoremEntity | TechniqueEntity | ExampleEntity | ProblemEntity;

export function isLearnableEntity(entity: KnowledgeEntity): entity is LearnableEntity {
  return (
    entity.entity_type === 'definition'
    || entity.entity_type === 'theorem'
    || entity.entity_type === 'technique'
    || entity.entity_type === 'example'
    || entity.entity_type === 'problem'
  );
}
