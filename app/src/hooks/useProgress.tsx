import React, { createContext, useContext, useEffect, useState } from 'react';
import { dataIndex } from '../lib/dataIndex';
import { isSupabaseConfigured, supabaseProgressSyncEnabled, syncProgressSnapshot } from '../lib/supabase';
import type { EntityType, ProblemEntity } from '../types';

const STORAGE_KEY = 'olympiad_progress_v3';
const REMOTE_SYNC_DEBOUNCE_MS = 1000;

export type ProblemState =
  | 'unseen'
  | 'attempted'
  | 'solved_with_hint'
  | 'solved_independently'
  | 'reviewed'
  | 'mastered';

export interface ProgressEvent {
  id: string;
  entry_id: string;
  entry_type: EntityType;
  status: ProblemState;
  occurred_at: string;
  confidence_score: number;
  note?: string;
  rating?: number;
}

export interface ProgressRecord {
  entry_id: string;
  entry_type: EntityType;
  status: ProblemState;
  attempt_count: number;
  success_count: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  confidence_score: number;
  notes: string[];
}

export interface ReviewScheduleState {
  due_at: string;
  interval_days: number;
  ease_factor: number;
  repetition_count: number;
  last_reviewed_at: string | null;
  status: 'pending' | 'due' | 'completed';
  target_type: EntityType;
}

export interface MasteryProfileState {
  target_id: string;
  target_type: EntityType;
  mastery_score: number;
  confidence_score: number;
  evidence_count: number;
  computed_at: string;
  last_interacted_at: string;
  weak_ref_ids: string[];
  strong_ref_ids: string[];
}

export interface ProgressState {
  learnerId: string;
  problemStates: Record<string, ProblemState>;
  topicMastery: Record<string, number>;
  reviewSchedules: Record<string, ReviewScheduleState>;
  records: ProgressEvent[];
  progressRecords: Record<string, ProgressRecord>;
  masteryProfiles: Record<string, MasteryProfileState>;
}

interface ProgressContextValue {
  state: ProgressState;
  updateProblemState: (problemId: string, newState: ProblemState, topicId?: string) => void;
  recordEvent: (event: Omit<ProgressEvent, 'id' | 'occurred_at'> & { occurred_at?: string }) => void;
  scheduleReview: (targetId: string, performanceRating: number, targetType?: EntityType) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isoFromNow(daysOffset = 0, hoursOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
}

function createEventId(entryId: string) {
  return `prog.${entryId.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}-${Date.now().toString(36)}`;
}

function createEmptyState(): ProgressState {
  return {
    learnerId: 'local-learner',
    problemStates: {},
    topicMastery: {},
    reviewSchedules: {},
    records: [],
    progressRecords: {},
    masteryProfiles: {},
  };
}

function mergeState(raw: unknown): ProgressState {
  const empty = createEmptyState();

  if (!isPlainObject(raw)) {
    return empty;
  }

  const candidate = raw as Partial<ProgressState>;

  return {
    learnerId: typeof candidate.learnerId === 'string' ? candidate.learnerId : empty.learnerId,
    problemStates: isPlainObject(candidate.problemStates)
      ? (candidate.problemStates as Record<string, ProblemState>)
      : empty.problemStates,
    topicMastery: isPlainObject(candidate.topicMastery)
      ? (candidate.topicMastery as Record<string, number>)
      : empty.topicMastery,
    reviewSchedules: isPlainObject(candidate.reviewSchedules)
      ? (candidate.reviewSchedules as Record<string, ReviewScheduleState>)
      : empty.reviewSchedules,
    records: Array.isArray(candidate.records) ? candidate.records : empty.records,
    progressRecords: isPlainObject(candidate.progressRecords)
      ? (candidate.progressRecords as Record<string, ProgressRecord>)
      : empty.progressRecords,
    masteryProfiles: isPlainObject(candidate.masteryProfiles)
      ? (candidate.masteryProfiles as Record<string, MasteryProfileState>)
      : empty.masteryProfiles,
  };
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ProgressState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? mergeState(JSON.parse(stored)) : createEmptyState();
    } catch (error) {
      console.error('Failed to parse local progress state.', error);
      return createEmptyState();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabaseProgressSyncEnabled) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void syncProgressSnapshot(state).catch((error) => {
        console.error('Failed to sync progress snapshot to Supabase.', error);
      });
    }, REMOTE_SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  const recordEvent: ProgressContextValue['recordEvent'] = (event) => {
    setState((previous) => ({
      ...previous,
      records: [
        ...previous.records,
        {
          ...event,
          id: createEventId(event.entry_id),
          occurred_at: event.occurred_at ?? new Date().toISOString(),
        },
      ],
    }));
  };

  const updateProblemState: ProgressContextValue['updateProblemState'] = (problemId, newState, topicId) => {
    setState((previous) => {
      const nextTopicId = topicId
        ?? dataIndex.getEntity<ProblemEntity>(problemId)?.primary_topic_ids[0]
        ?? null;
      const currentTopicScore = nextTopicId ? previous.topicMastery[nextTopicId] ?? 0.2 : 0.2;
      const scoreDelta =
        newState === 'mastered'
          ? 0.18
          : newState === 'solved_independently'
            ? 0.12
            : newState === 'reviewed'
              ? 0.08
              : newState === 'solved_with_hint'
                ? 0.06
                : newState === 'attempted'
                  ? 0.02
                  : -0.04;
      const masteryScore = clamp(currentTopicScore + scoreDelta, 0, 1);

      const existingRecord = previous.progressRecords[problemId];
      const nextProgressRecord: ProgressRecord = {
        entry_id: problemId,
        entry_type: 'problem',
        status: newState,
        attempt_count: (existingRecord?.attempt_count ?? 0) + (newState === 'unseen' ? 0 : 1),
        success_count:
          (existingRecord?.success_count ?? 0)
          + (newState === 'solved_independently' || newState === 'mastered' ? 1 : 0),
        last_reviewed_at: new Date().toISOString(),
        next_review_at: previous.reviewSchedules[problemId]?.due_at ?? isoFromNow(1),
        confidence_score:
          newState === 'mastered'
            ? 0.94
            : newState === 'solved_independently'
              ? 0.82
              : newState === 'solved_with_hint'
                ? 0.66
                : newState === 'attempted'
                  ? 0.4
                  : 0.22,
        notes: existingRecord?.notes ?? [],
      };

      const nextMasteryProfiles = { ...previous.masteryProfiles };
      if (nextTopicId) {
        const currentProfile = previous.masteryProfiles[nextTopicId];
        nextMasteryProfiles[nextTopicId] = {
          target_id: nextTopicId,
          target_type: 'topic',
          mastery_score: masteryScore,
          confidence_score: clamp(nextProgressRecord.confidence_score - 0.08, 0.1, 0.95),
          evidence_count: (currentProfile?.evidence_count ?? 0) + 1,
          computed_at: new Date().toISOString(),
          last_interacted_at: new Date().toISOString(),
          weak_ref_ids: newState === 'attempted' ? [problemId] : currentProfile?.weak_ref_ids ?? [],
          strong_ref_ids:
            newState === 'solved_independently' || newState === 'mastered'
              ? Array.from(new Set([...(currentProfile?.strong_ref_ids ?? []), problemId]))
              : currentProfile?.strong_ref_ids ?? [],
        };
      }

      return {
        ...previous,
        problemStates: {
          ...previous.problemStates,
          [problemId]: newState,
        },
        topicMastery: nextTopicId
          ? {
              ...previous.topicMastery,
              [nextTopicId]: masteryScore,
            }
          : previous.topicMastery,
        progressRecords: {
          ...previous.progressRecords,
          [problemId]: nextProgressRecord,
        },
        masteryProfiles: nextMasteryProfiles,
        records: [
          ...previous.records,
          {
            id: createEventId(problemId),
            entry_id: problemId,
            entry_type: 'problem',
            status: newState,
            occurred_at: new Date().toISOString(),
            confidence_score: nextProgressRecord.confidence_score,
          },
        ],
      };
    });
  };

  const scheduleReview: ProgressContextValue['scheduleReview'] = (targetId, performanceRating, targetType = 'problem') => {
    setState((previous) => {
      const existing = previous.reviewSchedules[targetId] ?? {
        due_at: isoFromNow(1),
        interval_days: 1,
        ease_factor: 2.5,
        repetition_count: 0,
        last_reviewed_at: null,
        status: 'pending' as const,
        target_type: targetType,
      };

      let intervalDays = existing.interval_days;
      if (performanceRating >= 4) {
        intervalDays = existing.repetition_count === 0 ? 1 : Math.max(2, Math.round(intervalDays * existing.ease_factor));
      } else if (performanceRating === 3) {
        intervalDays = Math.max(1, Math.round(intervalDays * 1.4));
      } else {
        intervalDays = 1;
      }

      const easeFactor = clamp(
        existing.ease_factor + (0.1 - (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02)),
        1.3,
        3.5,
      );
      const dueAt = isoFromNow(intervalDays);

      const nextSchedule: ReviewScheduleState = {
        due_at: dueAt,
        interval_days: intervalDays,
        ease_factor: easeFactor,
        repetition_count: existing.repetition_count + 1,
        last_reviewed_at: new Date().toISOString(),
        status: 'pending',
        target_type: targetType,
      };

      const currentRecord = previous.progressRecords[targetId];
      const nextStatus: ProblemState =
        performanceRating >= 5
          ? 'mastered'
          : performanceRating >= 4
            ? 'reviewed'
            : performanceRating >= 3
              ? 'solved_with_hint'
              : 'attempted';
      const nextProgressRecords = currentRecord
        ? {
            ...previous.progressRecords,
            [targetId]: {
              ...currentRecord,
              last_reviewed_at: new Date().toISOString(),
              next_review_at: dueAt,
              confidence_score: clamp(currentRecord.confidence_score + performanceRating / 20, 0.15, 0.98),
              status: nextStatus,
            },
          }
        : previous.progressRecords;

      return {
        ...previous,
        reviewSchedules: {
          ...previous.reviewSchedules,
          [targetId]: nextSchedule,
        },
        progressRecords: nextProgressRecords,
        records: [
          ...previous.records,
          {
            id: createEventId(targetId),
            entry_id: targetId,
            entry_type: targetType,
            status: nextStatus,
            occurred_at: new Date().toISOString(),
            confidence_score: clamp(0.35 + performanceRating / 6, 0.1, 0.98),
            rating: performanceRating,
          },
        ],
      };
    });
  };

  return (
    <ProgressContext.Provider value={{ state, updateProblemState, recordEvent, scheduleReview }}>
      {children}
    </ProgressContext.Provider>
  );
};

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return context;
}
