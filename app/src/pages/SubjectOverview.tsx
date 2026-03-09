import { BookOpenText, ChevronDown, ChevronRight, FileText, FolderOpen, Target } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppTopNav, Badge, Surface } from '../components/layout/DesignShell';
import { useProgress } from '../hooks/useProgress';
import {
  getCatalogForSubject,
  getSubjectById,
  getSubjectDescription,
  getSubjects,
  type TaxonomyTopic,
} from '../lib/uiData';

export function SubjectOverview() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { state } = useProgress();
  const subjects = getSubjects();
  const subject = getSubjectById(subjectId) ?? subjects[0];
  const subjectEntries = subject ? getCatalogForSubject(subject.id) : [];
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(subject?.topics[0]?.id ?? null);

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-700 text-text-300">
        No subject was found in the taxonomy.
      </div>
    );
  }

  const masteryCards = subject.topics.slice(0, 4).map((topic) => ({
    topic,
    progress: Math.round((state.topicMastery[topic.id] ?? 0) * 100),
  }));

  const foundationalEntries = subjectEntries.slice(0, 3);
  const overallMastery = Math.round(
    masteryCards.reduce((sum, card) => sum + card.progress, 0) / Math.max(masteryCards.length, 1),
  );
  const trackedTopicCount = subject.topics.filter((topic) => typeof state.topicMastery[topic.id] === 'number').length;
  const subtopicCount = subject.topics.reduce((sum, topic) => sum + topic.subtopics.length, 0);
  const solvedSubjectProblems = subjectEntries.filter(
    (entry) =>
      entry.type === 'problem'
      && ['solved_independently', 'solved_with_hint', 'reviewed', 'mastered'].includes(
        state.problemStates[entry.id] ?? 'unseen',
      ),
  ).length;

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav />
      <div className="flex min-h-[calc(100vh-65px)]">
        <aside className="hidden w-[280px] shrink-0 border-r border-base-600 bg-base-700 lg:flex lg:flex-col">
          <div className="border-b border-base-600 p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">Library</div>
            <div className="mt-2 text-lg font-semibold text-text-100">Subject Navigation</div>
          </div>
          <div className="space-y-6 p-4">
            <Surface className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">
                Subject Library
              </div>
              <div className="mt-4 space-y-2">
                {subjects.map((item) => (
                  <Link
                    key={item.id}
                    to={`/subjects/${item.id}`}
                    className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-sm transition-colors ${
                      item.id === subject.id
                        ? 'bg-primary-900/40 text-primary-400'
                        : 'text-text-400 hover:bg-base-600/60 hover:text-text-200'
                    }`}
                  >
                    <span>{item.name}</span>
                    <ChevronRight className="h-4 w-4 text-text-500" />
                  </Link>
                ))}
              </div>
            </Surface>

            <Surface className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">
                Quick Links
              </div>
              <div className="mt-4 space-y-3 text-sm text-text-300">
                <Link to="/study" className="flex items-center gap-3 rounded-[8px] bg-base-900/60 px-4 py-3">
                  <Target className="h-4 w-4 text-primary-400" />
                  Start practice
                </Link>
                <Link to="/review-queue" className="flex items-center gap-3 rounded-[8px] bg-base-900/60 px-4 py-3">
                  <FolderOpen className="h-4 w-4 text-primary-400" />
                  Review queue
                </Link>
                <Link to="/search" className="flex items-center gap-3 rounded-[8px] bg-base-900/60 px-4 py-3">
                  <BookOpenText className="h-4 w-4 text-primary-400" />
                  Search references
                </Link>
              </div>
            </Surface>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-6 py-10 lg:px-10">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-text-500">
              <Link to="/" className="hover:text-text-300">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-text-300">{subject.name}</span>
            </div>

            <div className="flex flex-col gap-8 border-b border-base-600 pb-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-900/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-400">
                  <BookOpenText className="h-3.5 w-3.5" />
                  Subject Overview
                </div>
                <div>
                  <h1 className="text-3xl font-black leading-tight tracking-[-0.05em] text-text-100 sm:text-[44px]">
                    {subject.name}
                  </h1>
                  <p className="mt-3 text-base leading-7 text-text-400">
                    {getSubjectDescription(subject.id)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Badge tone="blue">{subject.topics.length} topic tracks</Badge>
                  <Badge tone="green">{subjectEntries.length} linked entries</Badge>
                  <Badge tone="slate">Learning order #{subject.learning_order}</Badge>
                </div>
              </div>

              <Surface className="w-full max-w-[300px] p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-text-500">Overall Mastery</div>
                    <div className="mt-2 text-4xl font-black text-text-100">{overallMastery}%</div>
                  </div>
                  <div className="text-sm font-semibold text-primary-400">{subjectEntries.length} validated entries</div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-base-600">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${overallMastery}%` }} />
                </div>
              </Surface>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.9fr)_320px]">
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                  {masteryCards.map(({ topic, progress }) => (
                    <Surface key={topic.id} className="p-5">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">
                            {topic.level}
                          </div>
                          <div className="mt-2 text-lg font-bold text-text-100">{topic.name}</div>
                        </div>
                        <div className="text-sm font-bold text-primary-400">{progress}%</div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-base-600">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
                      </div>
                    </Surface>
                  ))}
                </div>

                <Surface className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-text-100">Knowledge Structure</div>
                      <p className="mt-1 text-sm text-text-500">
                        Expand each track to jump into its subtopic stack.
                      </p>
                    </div>
                    <Link to="/search" className="text-sm font-semibold text-primary-400">
                      Search entries
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {subject.topics.map((topic) => (
                      <TopicAccordion
                        key={topic.id}
                        topic={topic}
                        progress={Math.round((state.topicMastery[topic.id] ?? 0) * 100)}
                        expanded={expandedTopicId === topic.id}
                        onToggle={() =>
                          setExpandedTopicId((current) => (current === topic.id ? null : topic.id))
                        }
                      />
                    ))}
                  </div>
                </Surface>
              </div>

              <div className="space-y-6">
                <Surface className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary-400" />
                    <h2 className="text-xl font-bold text-text-100">Foundational Entries</h2>
                  </div>
                  {foundationalEntries.length > 0 ? (
                    <div className="space-y-4">
                      {foundationalEntries.map((entry) => (
                        <Link
                          key={entry.id}
                          to={entry.route}
                          className="block rounded-[8px] border border-base-600 bg-base-900/60 px-4 py-4 transition-colors hover:border-primary-500/40"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-400">
                            {entry.type}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-text-100">{entry.title}</div>
                          <p className="mt-2 text-xs leading-5 text-text-500">{entry.description}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[8px] border border-dashed border-base-500 bg-base-900/40 px-4 py-6 text-sm text-text-500">
                      No authored entries are linked to this subject yet.
                    </div>
                  )}
                </Surface>

                <Surface className="p-6">
                  <div className="mb-4 text-xl font-bold text-text-100">Subject Structure</div>
                  <div className="space-y-3">
                    {[
                      `${subject.topics.length} topic tracks`,
                      `${subtopicCount} linked subtopics`,
                      `${subjectEntries.length} authored entries`,
                    ].map((resource) => (
                      <div
                        key={resource}
                        className="rounded-[8px] border border-base-600 bg-base-900/60 px-4 py-4 text-sm text-text-300"
                      >
                        {resource}
                      </div>
                    ))}
                  </div>
                </Surface>

                <Surface className="p-6">
                  <div className="mb-4 text-xl font-bold text-text-100">Practice Stats</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[8px] bg-base-900/60 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-text-500">Topics tracked</div>
                      <div className="mt-2 text-2xl font-black text-text-100">{trackedTopicCount}</div>
                    </div>
                    <div className="rounded-[8px] bg-base-900/60 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-text-500">Solved</div>
                      <div className="mt-2 text-2xl font-black text-text-100">{solvedSubjectProblems}</div>
                    </div>
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

function TopicAccordion({
  topic,
  progress,
  expanded,
  onToggle,
}: {
  topic: TaxonomyTopic;
  progress: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-base-600 bg-base-900/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-text-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-400" />
          )}
          <div>
            <div className="text-sm font-semibold text-text-100">{topic.name}</div>
            <div className="mt-1 text-xs text-text-500">{topic.subtopics.length} linked subtopics</div>
          </div>
        </div>
        <div className="text-sm font-bold text-primary-400">{progress}%</div>
      </button>
      {expanded ? (
        <div className="border-t border-base-600 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            {topic.subtopics.map((subtopic) => (
              <Link
                key={subtopic.id}
                to={`/topics/${subtopic.id}`}
                className="rounded-[8px] border border-base-600 bg-base-900/60 px-4 py-3 text-sm text-text-300 transition-colors hover:border-primary-500/40 hover:text-text-100"
              >
                {subtopic.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
