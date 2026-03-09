import {
  BookOpen,
  BrainCircuit,
  CalendarClock,
  ChevronRight,
  Compass,
  Flame,
  Gauge,
  LibraryBig,
  Medal,
  Search,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AppTopNav,
  InitialAvatar,
  SidebarNavLink,
  Surface,
} from '../components/layout/DesignShell';
import { useProgress } from '../hooks/useProgress';
import { getCatalogItems, getReviewQueueItems, getSubjects } from '../lib/uiData';

function RingStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-[8px] border border-base-600 bg-base-900/60 p-5">
      <div className="flex flex-col items-center text-center">
        <div
          className="relative flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#144bb8 ${value}%, rgba(51,65,85,0.8) ${value}% 100%)`,
          }}
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-base-700">
            <span className="text-3xl font-black text-text-100">{value}%</span>
          </div>
        </div>
        <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">{label}</div>
        <p className="mt-2 text-xs text-text-400">{detail}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { state } = useProgress();
  const subjects = getSubjects();
  const catalogItems = getCatalogItems();
  const recentEntries = catalogItems.slice(0, 4);
  const reviewQueue = getReviewQueueItems(state);
  const featuredSubject = subjects[0] ?? null;

  const activeDays = new Set(state.records.map((record) => record.occurred_at.slice(0, 10))).size;

  const ringStats = subjects.slice(0, 4).map((subject) => {
    const topicIds = subject.topics.map((topic) => topic.id);
    const progressValues = topicIds
      .map((topicId) => state.topicMastery[topicId])
      .filter((value): value is number => typeof value === 'number');
    const value =
      progressValues.length > 0
        ? Math.round(
            (progressValues.reduce((sum, progress) => sum + progress, 0) / progressValues.length) * 100,
          )
        : 0;

    return {
      label: subject.name,
      value,
      detail: `${progressValues.length} of ${subject.topics.length} topics tracked`,
    };
  });

  const recordCountByDay = new Map<string, number>();
  state.records.forEach((record) => {
    const key = record.occurred_at.slice(0, 10);
    recordCountByDay.set(key, (recordCountByDay.get(key) ?? 0) + 1);
  });

  const heatmapValues = Array.from({ length: 52 * 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (52 * 7 - index));
    const key = date.toISOString().slice(0, 10);
    return Math.min(4, recordCountByDay.get(key) ?? 0);
  });

  const quickActions = [
    {
      title: 'Resume Review',
      description:
        reviewQueue.length > 0
          ? `${reviewQueue.length} items are currently scheduled for review.`
          : 'No review items are scheduled yet.',
      to: '/review-queue',
      icon: CalendarClock,
    },
    {
      title: 'Launch Study Mode',
      description:
        reviewQueue.length > 0
          ? 'Open the current review queue in study mode.'
          : 'Study mode activates when review items exist.',
      to: '/study',
      icon: BrainCircuit,
    },
    {
      title: featuredSubject ? `Open ${featuredSubject.name}` : 'Browse Subjects',
      description: featuredSubject
        ? `${featuredSubject.topics.length} topic tracks are authored in this subject.`
        : 'No authored subjects are available yet.',
      to: featuredSubject ? `/subjects/${featuredSubject.id}` : '/subjects',
      icon: Compass,
    },
    {
      title: 'Import New Content',
      description: 'Validate and preview fresh JSON entries.',
      to: '/import',
      icon: UploadCloud,
    },
  ];

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav />
      <div className="flex min-h-[calc(100vh-65px)]">
        <aside className="hidden w-[288px] shrink-0 border-r border-base-600 bg-base-700 lg:flex lg:flex-col">
          <div className="border-b border-base-600 p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">Workspace</div>
            <div className="mt-2 text-lg font-semibold text-text-100">Learning Dashboard</div>
          </div>

          <div className="p-4">
            <Surface className="p-4">
              <div className="flex items-center gap-3">
                <InitialAvatar initials="OH" />
                <div>
                  <div className="text-sm font-bold text-text-100">Local Workspace</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-text-500">
                    Content-driven dashboard
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-base-600/60 p-3">
                  <div className="flex items-center gap-2 text-warning-500">
                    <Flame className="h-4 w-4" />
                    <span className="text-lg font-black">{activeDays}</span>
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-500">
                    Active days
                  </div>
                </div>
                <div className="rounded-[8px] bg-base-600/60 p-3">
                  <div className="flex items-center gap-2 text-primary-400">
                    <Medal className="h-4 w-4" />
                    <span className="text-lg font-black">{catalogItems.length}</span>
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-500">
                    Authored entries
                  </div>
                </div>
              </div>
            </Surface>
          </div>

          <nav className="space-y-1 px-4">
            <SidebarNavLink to="/" label="Dashboard" icon={Gauge} end />
            <SidebarNavLink to="/subjects" label="Subjects" icon={BookOpen} />
            <SidebarNavLink to="/progress" label="Progress" icon={TrendingUp} />
            <SidebarNavLink to="/review-queue" label="Review Queue" icon={CalendarClock} />
            <SidebarNavLink to="/import" label="Import" icon={UploadCloud} />
          </nav>

          <div className="flex-1 px-4 py-6">
            <div className="mb-4 text-[10px] uppercase tracking-[0.2em] text-text-500">Knowledge Tree</div>
            {subjects.length > 0 ? (
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <Link
                    key={subject.id}
                    to={`/subjects/${subject.id}`}
                    className="flex items-center justify-between rounded-[8px] border border-base-600 bg-base-900/40 px-4 py-3 text-sm text-text-300 transition-colors hover:border-primary-500/30 hover:text-text-100"
                  >
                    <span>{subject.name}</span>
                    <ChevronRight className="h-4 w-4 text-text-500" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-[8px] border border-base-600 bg-base-900/40 px-4 py-3 text-sm text-text-500">
                No authored subjects were found in `content/`.
              </p>
            )}
          </div>

          <div className="border-t border-base-600 p-4">
            <button className="flex w-full items-center justify-between rounded-[8px] border border-base-600 bg-base-900/50 px-4 py-3 text-sm font-medium text-text-300 transition-colors hover:text-text-100">
              <span className="flex items-center gap-3">
                <Settings2 className="h-4 w-4" />
                Settings
              </span>
              <ChevronRight className="h-4 w-4 text-text-500" />
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-900/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Home Dashboard
                </div>
                <div>
                  <h1 className="text-3xl font-black leading-tight tracking-[-0.05em] text-text-100 sm:text-[44px]">
                    Dashboard
                  </h1>
                  <p className="mt-2 max-w-2xl text-base text-text-400">
                    Content, review state, and mastery metrics are rendered directly from the authored
                    JSON in `content/` and your real local interactions.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/study"
                  className="inline-flex h-10 items-center justify-center rounded-[8px] bg-primary-500 px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400"
                >
                  Start Session
                </Link>
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_320px]">
              <div className="space-y-8">
                <Surface className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text-200">Mastery Snapshot</div>
                      <p className="mt-1 text-sm text-text-500">
                        Subject progress computed from tracked topic mastery only.
                      </p>
                    </div>
                    <Link to="/progress" className="text-sm font-semibold text-primary-400">
                      Open progress
                    </Link>
                  </div>
                  {ringStats.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {ringStats.map((stat) => (
                        <RingStat
                          key={stat.label}
                          label={stat.label}
                          value={stat.value}
                          detail={stat.detail}
                        />
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
                      <Target className="h-5 w-5 text-primary-400" />
                      <h2 className="text-xl font-bold text-text-100">Proof Heatmap</h2>
                    </div>
                    <span className="text-xs uppercase tracking-[0.16em] text-text-500">Last year</span>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="inline-flex gap-[4px]">
                      {Array.from({ length: 52 }).map((_, column) => (
                        <div key={column} className="flex flex-col gap-[4px]">
                          {Array.from({ length: 7 }).map((_, row) => {
                            const value = heatmapValues[column * 7 + row];
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
                            return <div key={row} className={`h-[11px] w-[11px] rounded-[2px] ${tone}`} />;
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-[10px] uppercase tracking-[0.18em] text-text-500">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>May</span>
                    <span>Jul</span>
                    <span>Sep</span>
                    <span>Nov</span>
                  </div>
                </Surface>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-text-100">Recent Entry Activity</div>
                    <Link to="/search" className="text-sm font-semibold text-primary-400">
                      Browse library
                    </Link>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {recentEntries.length > 0 ? (
                      recentEntries.map((entry) => (
                        <Link
                          key={entry.id}
                          to={entry.route}
                          className="rounded-[8px] border border-base-600 bg-base-900/60 p-5 transition-colors hover:border-primary-500/40"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-400">
                              {entry.type}
                            </span>
                            <span className="text-xs text-text-500">{entry.updatedLabel}</span>
                          </div>
                          <h3 className="mt-3 text-xl font-bold text-text-100">{entry.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-text-400">{entry.description}</p>
                          {entry.formula ? (
                            <div className="mt-4 rounded-[4px] bg-base-600/70 px-4 py-3 text-center font-serif text-base italic text-text-200">
                              {entry.formula}
                            </div>
                          ) : null}
                          <div className="mt-4 flex items-center gap-2 text-xs text-text-500">
                            <Search className="h-3.5 w-3.5" />
                            {entry.tags.slice(0, 2).join(' • ') || 'No tags'}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-[8px] border border-dashed border-base-500 bg-base-900/40 p-5 text-sm text-text-500 md:col-span-2">
                        No authored entries were found in `content/`.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Surface className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary-400" />
                    <h2 className="text-xl font-bold text-text-100">Quick Actions</h2>
                  </div>
                  <div className="space-y-3">
                    {quickActions.map((action) => (
                      <Link
                        key={action.title}
                        to={action.to}
                        className="flex items-start gap-4 rounded-[8px] border border-base-600 bg-base-900/60 px-4 py-4 transition-colors hover:border-primary-500/40"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary-900/40 text-primary-400">
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-text-100">{action.title}</div>
                          <p className="mt-1 text-xs leading-5 text-text-500">{action.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Surface>

                <Surface className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-warning-500" />
                    <h2 className="text-xl font-bold text-text-100">Due Next</h2>
                  </div>
                  {reviewQueue.length > 0 ? (
                    <div className="space-y-4">
                      {reviewQueue.map((item) => {
                        const entry = recentEntries.find((candidate) => candidate.id === item.entryId)
                          ?? catalogItems.find((candidate) => candidate.id === item.entryId);
                        if (!entry) {
                          return null;
                        }
                        return (
                          <Link
                            key={item.entryId}
                            to={entry.route}
                            className="block rounded-[8px] border border-base-600 bg-base-900/60 px-4 py-4 transition-colors hover:border-primary-500/40"
                          >
                            <div className="flex items-center justify-between text-xs text-text-500">
                              <span>{item.ribbon}</span>
                              <span>{item.dueLabel}</span>
                            </div>
                            <div className="mt-2 text-lg font-bold text-text-100">{entry.title}</div>
                            <div className="mt-1 text-sm text-text-400">{item.collection}</div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[8px] border border-dashed border-base-500 bg-base-900/40 px-4 py-6 text-sm text-text-500">
                      No review items are scheduled yet.
                    </div>
                  )}
                </Surface>

                <Surface className="overflow-hidden p-6">
                  <div className="rounded-[8px] bg-[linear-gradient(135deg,rgba(20,75,184,0.2),rgba(20,75,184,0.04))] p-5">
                    <div className="flex items-center gap-3 text-primary-400">
                      <LibraryBig className="h-5 w-5" />
                      <span className="text-sm font-semibold">Subject Spotlight</span>
                    </div>
                    {featuredSubject ? (
                      <>
                        <h3 className="mt-4 text-2xl font-black text-text-100">{featuredSubject.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-text-300">
                          {featuredSubject.topics.length} topic tracks and {catalogItems.filter((item) => item.subjectId === featuredSubject.id).length} linked entries are currently authored for this subject.
                        </p>
                        <Link
                          to={`/subjects/${featuredSubject.id}`}
                          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-400"
                        >
                          Open overview
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <h3 className="mt-4 text-2xl font-black text-text-100">No subject selected</h3>
                        <p className="mt-2 text-sm leading-6 text-text-300">
                          Add authored JSON to `content/` to populate the subject library.
                        </p>
                      </>
                    )}
                  </div>
                </Surface>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
