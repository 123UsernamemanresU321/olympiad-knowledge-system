import { ArrowRight, BookOpenText, Layers3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppTopNav, Badge, Surface } from '../components/layout/DesignShell';
import { getCatalogForSubject, getSubjectDescription, getSubjects } from '../lib/uiData';

export function SubjectBrowser() {
  const subjects = getSubjects();

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search subjects..." />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 py-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-900/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-400">
            <Sparkles className="h-3.5 w-3.5" />
            Subject Browser
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[40px] font-black tracking-[-0.04em] text-text-100">
                Canonical Olympiad Tracks
              </h1>
              <p className="mt-2 max-w-3xl text-base text-text-400">
                This workspace is currently scoped to the first playbook milestone: a validated Number Theory track with authored topic, entry, problem, and solution JSON.
              </p>
            </div>
            <Badge tone="blue">{subjects.length} subjects</Badge>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {subjects.map((subject) => {
            const entryCount = getCatalogForSubject(subject.id).length;
            return (
              <Surface key={subject.id} className="overflow-hidden">
                <div className="border-b border-base-600 bg-base-900/70 px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                        Subject overview
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-text-100">{subject.name}</h2>
                    </div>
                    <Link
                      to={`/subjects/${subject.id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-400"
                    >
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                <div className="space-y-6 p-6">
                  <p className="text-sm leading-6 text-text-400">{getSubjectDescription(subject.id)}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[8px] border border-base-600 bg-base-900/60 p-4">
                      <div className="flex items-center gap-2 text-text-400">
                        <Layers3 className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-[0.16em]">Topic tracks</span>
                      </div>
                      <div className="mt-3 text-3xl font-black text-text-100">{subject.topics.length}</div>
                    </div>
                    <div className="rounded-[8px] border border-base-600 bg-base-900/60 p-4">
                      <div className="flex items-center gap-2 text-text-400">
                        <BookOpenText className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-[0.16em]">Curated entries</span>
                      </div>
                      <div className="mt-3 text-3xl font-black text-text-100">{entryCount}</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-text-500">
                      Topic map
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {subject.topics.slice(0, 6).map((topic) => (
                        <Link
                          key={topic.id}
                          to={`/topics/${topic.id}`}
                          className="rounded-[8px] border border-base-600 bg-base-900/60 px-4 py-4 text-sm transition-colors hover:border-primary-500/40"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-400">
                            {topic.level}
                          </div>
                          <div className="mt-2 font-semibold text-text-100">{topic.name}</div>
                          <div className="mt-2 text-xs text-text-500">
                            {topic.subtopics.slice(0, 2).map((subtopic) => subtopic.name).join(' • ')}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      </div>
    </div>
  );
}
