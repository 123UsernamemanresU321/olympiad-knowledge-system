import {
  Bookmark,
  ChevronRight,
  Eye,
  FileText,
  Layers3,
  MessageSquare,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppTopNav, Badge, Surface } from '../components/layout/DesignShell';
import { useProgress } from '../hooks/useProgress';
import { getCatalogItem, getKnowledgeEntity, getProblemEntity, getRelatedCatalogItems, readMathContent } from '../lib/uiData';
import type { SolutionEntity } from '../types';

export function ProblemPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const { state, updateProblemState } = useProgress();
  const [showSolution, setShowSolution] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const problem = problemId ? getProblemEntity(problemId) : null;

  const detail = useMemo(() => {
    if (!problem) {
      return null;
    }

    const relatedEntries = getRelatedCatalogItems(problem.id);
    const solutionEntities = (problem.solution_ids ?? [])
      .map((id) => getKnowledgeEntity(id))
      .filter((entity): entity is SolutionEntity => entity?.entity_type === 'solution');
    const primarySolution = solutionEntities[0];
    const collection = problem.source?.name
      ? `${problem.source.name}${problem.source.year ? ` ${problem.source.year}` : ''}`
      : 'Olympiad Hub';

    return {
      title: problem.title ?? problem.short_label,
      collection,
      breadcrumbLabel: problem.short_label,
      statement: readMathContent(problem.statement)
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      hints: (problem.hint_blocks ?? []).map((item) => item.plain_text),
      solutionSteps: primarySolution?.step_blocks?.map((step) => step.content.plain_text) ?? [],
      solutionBody: primarySolution?.body.plain_text ?? 'Open the related entry pages if you need the full dependency chain.',
      finalAnswer: primarySolution?.final_answer?.plain_text ?? problem.answer_key?.plain_text ?? 'No final answer recorded.',
      relatedEntries,
      topicTags: getCatalogItem(problem.id)?.tags ?? [],
    };
  }, [problem]);

  if (!problemId) {
    return <div className="min-h-screen bg-base-700" />;
  }

  if (!problem || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-700 text-text-300">
        Problem not found.
      </div>
    );
  }

  const storedState = state.problemStates[problem.id];
  const solved =
    storedState === 'solved_independently'
    || storedState === 'solved_with_hint'
    || storedState === 'reviewed'
    || storedState === 'mastered';

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search problems..." />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-8 xl:flex-row xl:px-10">
        <main className="min-w-0 flex-1 space-y-8">
          <div className="flex items-center gap-2 text-sm text-text-500">
            <span>{detail.collection}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-text-300">{detail.breadcrumbLabel}</span>
          </div>

          <div className="flex flex-col gap-6 border-b border-base-600 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-black leading-tight tracking-[-0.05em] text-text-100 sm:text-[44px]">
                {detail.title}
              </h1>
              <div className="flex flex-wrap gap-3">
                <Badge tone={solved ? 'green' : 'rose'}>{solved ? 'Solved' : 'Unsolved'}</Badge>
                <Badge tone="slate">{problem.difficulty <= 2 ? 'Easy' : problem.difficulty <= 4 ? 'Intermediate' : 'Hard'}</Badge>
                <Badge tone="slate">{problem.problem_kind}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  updateProblemState(
                    problem.id,
                    solved ? 'attempted' : hintIndex > 0 ? 'solved_with_hint' : 'solved_independently',
                    problem.primary_topic_ids[0],
                  )
                }
                className="inline-flex h-11 items-center justify-center rounded-[8px] bg-primary-500 px-6 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400"
              >
                {solved ? 'Mark as Unsolved' : 'Mark as Solved'}
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-base-500 bg-base-900/50 text-text-300">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Surface id="problem-statement" className="scroll-mt-24 p-8">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-400" />
              <h2 className="text-xl font-bold text-primary-400">Problem Statement</h2>
            </div>
            <div className="space-y-5 text-lg leading-8 text-text-200">
              {detail.statement.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 rounded-[8px] border-2 border-dashed border-base-500 bg-base-600/50 px-6 py-10 text-left">
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-text-500">Expected Response</div>
              <div className="mt-3 text-base text-text-300">{problem.expected_response_kind}</div>
            </div>
          </Surface>

          <div className="space-y-5 border-t border-base-600 pt-8">
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-text-100">Hints and Solution</div>
              <button
                type="button"
                onClick={() => setHintIndex((current) => Math.min(current + 1, detail.hints.length))}
                className="text-sm font-semibold text-primary-400"
              >
                Show Hint
              </button>
            </div>

            {hintIndex > 0 ? (
              <Surface className="p-6">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-warning-500">
                  Hint {Math.min(hintIndex, detail.hints.length)}
                </div>
                <p className="mt-3 text-sm leading-7 text-text-300">{detail.hints[Math.min(hintIndex, detail.hints.length) - 1]}</p>
              </Surface>
            ) : null}

            <Surface className="relative min-h-[260px] overflow-hidden">
              {showSolution ? (
                <div className="space-y-5 p-8 text-sm leading-7 text-text-300">
                  {detail.solutionSteps.length > 0 ? (
                    detail.solutionSteps.map((step, index) => (
                      <div key={step}>
                        <div className="font-semibold text-primary-400">Step {index + 1}</div>
                        <p className="mt-1">{step}</p>
                      </div>
                    ))
                  ) : (
                    <p>{detail.solutionBody}</p>
                  )}
                  <div className="rounded-[8px] border border-success-500/30 bg-success-900/15 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-success-400">Final Answer</div>
                    <p className="mt-2">{detail.finalAnswer}</p>
                  </div>
                  <button
                    onClick={() => setShowSolution(false)}
                    className="text-xs font-bold uppercase tracking-[0.18em] text-text-500"
                  >
                    Hide Solution
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 p-8 opacity-15 blur-[2px]">
                    <div className="h-4 w-2/3 rounded bg-primary-500" />
                    <div className="h-4 w-3/4 rounded bg-base-500" />
                    <div className="h-4 w-1/2 rounded bg-base-500" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-base-700/35 backdrop-blur-sm">
                    <button
                      onClick={() => setShowSolution(true)}
                      className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-primary-500 px-6 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400"
                    >
                      <Eye className="h-4 w-4" />
                      Reveal Solution
                    </button>
                  </div>
                </>
              )}
            </Surface>
          </div>
        </main>

        <aside className="w-full shrink-0 xl:w-[320px]">
          <div className="space-y-6 border-l-0 border-base-600 xl:border-l xl:pl-8">
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                Problem Context
              </div>
              <a href="#problem-statement" className="block rounded-[8px] bg-primary-900/40 px-4 py-3 text-sm font-semibold text-primary-400">
                <span className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  Problem Statement
                </span>
              </a>
              <button type="button" className="w-full rounded-[8px] px-4 py-3 text-left text-sm text-text-300 transition-colors hover:bg-base-900/30">
                <span className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4" />
                  Hints ({detail.hints.length})
                </span>
              </button>
              <a href="#related-theorems" className="block rounded-[8px] px-4 py-3 text-sm text-text-300 transition-colors hover:bg-base-900/30">
                <span className="flex items-center gap-3">
                  <Layers3 className="h-4 w-4" />
                  Related Entries
                </span>
              </a>
            </div>

            <div id="related-theorems" className="space-y-4 scroll-mt-24">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                Related Entries
              </div>
              {detail.relatedEntries.map((entry) => (
                <Link
                  key={entry.id}
                  to={entry.route}
                  className="block rounded-[8px] border border-base-600 bg-base-900/60 p-4 transition-colors hover:border-primary-500/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-text-100">{entry.title}</div>
                      <p className="mt-2 text-xs leading-5 text-text-500">{entry.description}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 text-text-500" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                Topic Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.topicTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-base-600 bg-base-900/60 px-3 py-1.5 text-xs font-semibold text-text-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="border-t border-base-600 bg-base-900/30 px-6 py-6 xl:px-10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 text-sm text-text-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-6">
            <span>{problem.time_estimate_minutes ?? 10} min target</span>
            <span>{problem.tracking_profile.review_priority} priority</span>
            <span>Updated {new Date(problem.audit.updated_at).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-4">
            <button>Terms</button>
            <button>Privacy</button>
            <button>Help Center</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
