import { CalendarClock, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppTopNav, SidebarNavLink, Surface } from '../components/layout/DesignShell';
import { useProgress } from '../hooks/useProgress';
import { getCatalogItem, getReviewQueueItems } from '../lib/uiData';

function artClass(art: 'lines' | 'chalk' | 'wave') {
  if (art === 'lines') {
    return 'bg-[radial-gradient(circle_at_60%_30%,rgba(180,149,112,0.45),transparent_22%),radial-gradient(circle_at_34%_62%,rgba(164,140,112,0.55),transparent_18%),repeating-radial-gradient(circle_at_center,rgba(185,170,150,0.2)_0_1px,transparent_1px_13px),linear-gradient(135deg,#d5d0ca,#c8c2bc)]';
  }
  if (art === 'chalk') {
    return 'bg-[linear-gradient(135deg,#173b2c,#10251d),radial-gradient(circle_at_35%_40%,rgba(255,255,255,0.12),transparent_32%)]';
  }
  return 'bg-[linear-gradient(135deg,#d08a2b,#f19a32),radial-gradient(circle_at_90%_30%,rgba(186,62,33,0.55),transparent_20%),radial-gradient(circle_at_95%_70%,rgba(186,62,33,0.55),transparent_18%)]';
}

function toneClass(tone: 'rose' | 'amber' | 'emerald') {
  if (tone === 'rose') {
    return 'bg-rose-950/35 text-rose-400';
  }
  if (tone === 'amber') {
    return 'bg-warning-900/30 text-warning-500';
  }
  return 'bg-success-900/25 text-success-400';
}

export function ReviewQueuePage() {
  const { state } = useProgress();
  const queue = getReviewQueueItems(state);
  const [activeTab, setActiveTab] = useState('all');
  const queuedSubjectCount = new Set(
    queue
      .map((item) => getCatalogItem(item.entryId)?.subjectId)
      .filter((subjectId): subjectId is NonNullable<typeof subjectId> => Boolean(subjectId)),
  ).size;
  const reviewEventsToday = state.records.filter(
    (record) => record.occurred_at.slice(0, 10) === new Date().toISOString().slice(0, 10),
  ).length;
  const tabs = [
    { value: 'all', label: `All Items (${queue.length})` },
    ...Array.from(
      new Set(
        queue
          .map((item) => getCatalogItem(item.entryId))
          .filter(Boolean)
          .map((item) => item!.subjectId),
      ),
    ).map((subjectId) => ({
      value: subjectId,
      label: `${subjectId.replace(/-/g, ' ')} (${queue.filter((item) => getCatalogItem(item.entryId)?.subjectId === subjectId).length})`,
    })),
  ];
  const selectedTab = tabs.some((tab) => tab.value === activeTab) ? activeTab : 'all';
  const visibleQueue = selectedTab === 'all'
    ? queue
    : queue.filter((item) => getCatalogItem(item.entryId)?.subjectId === selectedTab);

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search review items..." />
      <div className="flex min-h-[calc(100vh-65px)]">
        <aside className="hidden w-[256px] shrink-0 border-r border-base-600 bg-base-700 lg:flex lg:flex-col">
          <div className="border-b border-base-600 p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">Workspace</div>
            <div className="mt-2 text-lg font-semibold text-text-100">Review Navigation</div>
          </div>
          <div className="flex-1 space-y-1 px-4 py-4">
            <SidebarNavLink to="/" label="Dashboard" icon={CalendarClock} end />
            <SidebarNavLink to="/review-queue" label="Review Queue" icon={Play} />
            <SidebarNavLink to="/study" label="Practice" icon={Sparkles} />
            <SidebarNavLink to="/subjects" label="Resources" icon={CalendarClock} />
            <SidebarNavLink to="/progress" label="Progress" icon={Sparkles} />
          </div>
          <div className="space-y-4 p-4">
            <Surface className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-400">
                Queue Summary
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-base-600/60 p-3">
                  <div className="text-lg font-black text-text-100">{queue.length}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-500">
                    Scheduled
                  </div>
                </div>
                <div className="rounded-[8px] bg-base-600/60 p-3">
                  <div className="text-lg font-black text-text-100">{queuedSubjectCount}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-500">
                    Subjects
                  </div>
                </div>
              </div>
            </Surface>
            <Surface className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">Today</div>
              <div className="mt-3 text-3xl font-black text-text-100">{reviewEventsToday}</div>
              <div className="mt-2 text-sm text-text-500">Review events recorded today</div>
            </Surface>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-base-600 bg-base-700/90 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1024px] flex-col gap-8 px-6 py-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] text-text-100 sm:text-[40px]">
                    Daily Review Queue
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-base text-text-400">
                    <CalendarClock className="h-4 w-4 text-primary-400" />
                    {visibleQueue.length} of {queue.length} items scheduled for spaced repetition
                  </div>
                </div>
                <Link
                  to="/study"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primary-500 px-8 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400"
                >
                  <Play className="h-4 w-4" />
                  Start Review
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 border-b border-base-600">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`border-b-2 pb-4 text-sm font-bold ${
                      selectedTab === tab.value
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-text-500 transition-colors hover:text-text-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1024px] flex-col gap-4 px-6 py-8">
            {visibleQueue.map((item) => {
              const entry = getCatalogItem(item.entryId);
              if (!entry) {
                return null;
              }

              return (
                <Surface key={item.entryId} className="overflow-hidden bg-base-950/80 p-0">
                  <div className="flex flex-col lg:flex-row">
                    <div className={`min-h-[180px] lg:w-[256px] ${artClass(item.art)}`} />
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <div className="flex items-center justify-between gap-4">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${toneClass(item.tone)}`}>
                            {item.ribbon}
                          </span>
                          <span className="text-xs text-text-500">{item.dueLabel}</span>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.03em] text-text-100 sm:text-[32px]">
                          {entry.title}
                        </h2>
                        <p className="mt-2 text-sm text-text-400">{item.collection}</p>
                      </div>
                      <div className="mt-8 flex flex-col gap-6 border-t border-base-600 pt-6 md:flex-row md:items-end md:justify-between">
                        <div className="flex gap-8">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">
                              Last reviewed
                            </div>
                            <div className="mt-2 text-sm font-medium text-text-100">{item.lastReviewed}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">
                              Retention
                            </div>
                            <div className="mt-2 text-sm font-medium text-success-400">{item.retention}%</div>
                          </div>
                        </div>
                        <Link to={entry.route} className="text-sm font-bold text-primary-400">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                </Surface>
              );
            })}

            {visibleQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-70">
                <Sparkles className="h-14 w-14 text-text-400" />
                <h3 className="mt-6 text-3xl font-bold text-text-200">
                  {queue.length === 0 ? 'Queue clear' : 'No items in this filter'}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-text-500">
                  {queue.length === 0
                    ? 'Your local review schedule has no due items right now. Run a study session or solve a problem to generate the next review wave.'
                    : 'Switch tabs or add more reviewed content to populate this subject-specific queue.'}
                </p>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
