import { Activity, ArrowRight, Award, BarChart3, CalendarClock, Flame, Target, TrendingDown, Trophy } from 'lucide-react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { AppTopNav, Badge, Surface } from '../components/layout/DesignShell';
import { useProgress } from '../hooks/useProgress';
import { getCatalogItem, getCatalogItems, getReviewQueueItems, getSubjects } from '../lib/uiData';

function renderHeatCell(index: number): JSX.Element {
  const value = index;
  const tone =
    value === 0
      ? 'bg-base-600'
      : value === 1
        ? 'bg-primary-900/80'
        : value === 2
          ? 'bg-primary-500/45'
          : value === 3
            ? 'bg-primary-500/70'
            : 'bg-primary-500';

  return <div key={index} className={`h-[10px] w-[10px] rounded-[2px] ${tone}`} />;
}

export function ProgressPage() {
  const { state } = useProgress();
  const subjects = getSubjects();
  const reviewQueue = getReviewQueueItems(state);
  const solvedCount = Object.values(state.problemStates).filter((value) =>
    ['solved_independently', 'solved_with_hint', 'mastered', 'reviewed'].includes(value),
  ).length;
  const masteredTopics = Object.values(state.topicMastery).filter((value) => value >= 0.75).length;
  const catalogCount = getCatalogItems().length;
  const activeDays = new Set(state.records.map((record) => record.occurred_at.slice(0, 10))).size;
  const studyEventCount = state.records.length;

  const masteryRows = subjects.slice(0, 4).map((subject) => {
    const subjectTopicIds = subject.topics.map((topic) => topic.id);
    const explicitScores = subjectTopicIds
      .map((topicId) => state.topicMastery[topicId])
      .filter((value): value is number => typeof value === 'number');
    const progress =
      explicitScores.length > 0
        ? explicitScores.reduce((sum, value) => sum + value, 0) / explicitScores.length
        : 0;

    return {
      subjectId: subject.id,
      name: subject.name,
      progress: Math.round(progress * 100),
      subtitle: `${explicitScores.length}/${subject.topics.length} topics tracked`,
    };
  });

  const activityByDay = new Map<string, number>();
  state.records.forEach((record) => {
    const key = record.occurred_at.slice(0, 10);
    activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1);
  });

  const heatValues = Array.from({ length: 52 * 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (52 * 7 - index));
    const key = date.toISOString().slice(0, 10);
    return Math.min(4, activityByDay.get(key) ?? 0);
  });

  const trainingCounts = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    return activityByDay.get(key) ?? 0;
  });
  const maxTrainingCount = Math.max(...trainingCounts, 0);
  const trainingHeights = trainingCounts.map((count) =>
    maxTrainingCount === 0 ? 0 : Math.round((count / maxTrainingCount) * 100),
  );

  const weakTopics = masteryRows
    .slice()
    .sort((left, right) => left.progress - right.progress)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search progress..." />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] text-text-100 sm:text-[40px]">
              Progress Dashboard
            </h1>
            <p className="text-base text-text-400">
              Study history, queue state, and topic mastery computed from actual progress data only.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Surface className="min-w-[164px] p-5">
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-warning-500" />
                <div>
                  <div className="text-3xl font-black text-text-100">{activeDays}</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-text-500">Study days</div>
                </div>
              </div>
            </Surface>
            <Surface className="min-w-[164px] p-5">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-primary-400" />
                <div>
                  <div className="text-3xl font-black text-text-100">{studyEventCount}</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-text-500">Study events</div>
                </div>
              </div>
            </Surface>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_340px]">
          <div className="space-y-8">
            <Surface className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <Target className="h-5 w-5 text-text-300" />
                <h2 className="text-xl font-bold text-text-100">Mastery Breakdown</h2>
              </div>
              {masteryRows.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {masteryRows.map((row) => (
                    <div key={row.name} className="space-y-3">
                      <div className="flex items-end justify-between">
                        <span className="text-sm font-semibold text-text-100">{row.name}</span>
                        <span className="text-sm font-bold text-primary-400">{row.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-base-600">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${row.progress}%` }} />
                      </div>
                      <p className="text-xs text-text-500">{row.subtitle}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[8px] border border-dashed border-base-500 bg-base-900/40 px-4 py-6 text-sm text-text-500">
                  No authored subjects are available yet.
                </div>
              )}
            </Surface>

            <Surface className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-text-300" />
                  <h2 className="text-xl font-bold text-text-100">Proof Progress</h2>
                </div>
                <span className="text-xs uppercase tracking-[0.16em] text-text-500">Last 365 days</span>
              </div>
              <div className="overflow-x-auto">
                <div className="inline-flex gap-[4px]">
                      {Array.from({ length: 52 }).map((_, column) => (
                        <div key={column} className="flex flex-col gap-[4px]">
                      {Array.from({ length: 7 }).map((_, row) => renderHeatCell(heatValues[column * 7 + row]))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.16em] text-text-500">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-text-300" />
                <h2 className="text-xl font-bold text-text-100">Training Consistency</h2>
              </div>
              <div className="flex h-52 items-end gap-2 border-b border-base-600 pb-3">
                {trainingHeights.map((height, index) => (
                  <div key={index} className="flex h-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-[2px] bg-primary-500/85"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-text-500">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary-400" />
                  <h2 className="text-xl font-bold text-text-100">Review Queue</h2>
                </div>
                <Badge tone="blue">{reviewQueue.length} scheduled</Badge>
              </div>
              {reviewQueue.length > 0 ? (
                <div className="space-y-3">
                  {reviewQueue.slice(0, 3).map((item) => {
                    const entry = getCatalogItem(item.entryId);
                    if (!entry) {
                      return null;
                    }

                    return (
                      <Link
                        key={item.entryId}
                        to={entry.route}
                        className="flex items-center justify-between rounded-[8px] border border-base-600 bg-base-900/60 px-4 py-3 text-sm text-text-300 transition-colors hover:border-primary-500/40 hover:text-text-100"
                      >
                        <span>{item.collection}</span>
                        <span className="text-xs text-text-500">{item.dueLabel}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[8px] border border-dashed border-base-500 bg-base-900/40 px-4 py-6 text-sm text-text-500">
                  No review items are scheduled.
                </div>
              )}
            </Surface>
          </div>

          <div className="space-y-8">
            <Surface className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Trophy className="h-5 w-5 text-warning-500" />
                <h2 className="text-xl font-bold text-text-100">Workspace Snapshot</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  `${catalogCount} JSON records`,
                  `${reviewQueue.length} Active reviews`,
                  `${solvedCount} Solved items`,
                  `${masteredTopics} Mastered Topics`,
                ].map((label) => (
                  <div
                    key={label}
                    className="rounded-[8px] border border-base-600 bg-base-900/70 p-4 text-center text-sm font-semibold text-text-200"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-rose-400" />
                <h2 className="text-xl font-bold text-text-100">Areas for Improvement</h2>
              </div>
              {weakTopics.length > 0 ? (
                <div className="space-y-3">
                  {weakTopics.map((row) => (
                    <Link
                      key={row.name}
                      to={`/subjects/${row.subjectId}`}
                      className="flex items-center justify-between rounded-[8px] border border-base-600 bg-base-900/60 px-4 py-3 text-sm font-medium text-text-300 transition-colors hover:border-primary-500/40 hover:text-text-100"
                    >
                      <span>{row.name}</span>
                      <ArrowRight className="h-4 w-4 text-text-500" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-[8px] border border-dashed border-base-500 bg-base-900/40 px-4 py-6 text-sm text-text-500">
                  No subject-level mastery gaps have been recorded yet.
                </div>
              )}
            </Surface>

            <Surface className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary-400" />
                  <h2 className="text-xl font-bold text-text-100">Global Snapshot</h2>
                </div>
                <Badge tone="slate">{catalogCount} authored entries</Badge>
              </div>
              <div className="space-y-5">
                <div className="rounded-[8px] border border-base-600 bg-base-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-text-500">Solved archive</div>
                  <div className="mt-2 text-3xl font-black text-text-100">{solvedCount}</div>
                  <p className="mt-2 text-sm text-text-400">
                    {masteredTopics} topics are currently at or above 75% mastery.
                  </p>
                </div>
                <div className="rounded-[8px] border border-base-600 bg-base-900/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-200">Next due review</span>
                    <span className="text-sm font-bold text-success-400">
                      {reviewQueue[0]?.dueLabel ?? 'Nothing scheduled'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-400">
                    Progress stays in-browser by default and can optionally sync to Supabase when public env vars are configured.
                  </p>
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}
