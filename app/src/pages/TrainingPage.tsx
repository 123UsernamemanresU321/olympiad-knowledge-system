import { BarChart3, Brain, ChevronLeft, Eye, Info, Library, Repeat2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MathContentView, asMathContent } from '../components/content/MathContentView';
import { AppTopNav } from '../components/layout/DesignShell';
import { useProgress } from '../hooks/useProgress';
import { getKnowledgeEntity, getReviewQueueItems } from '../lib/uiData';

const ratingButtons = [
  { label: 'Again', hint: '< 1 day', border: 'hover:border-rose-500/50', text: 'text-rose-400', rating: 1 },
  { label: 'Hard', hint: '1 day', border: 'hover:border-warning-500/50', text: 'text-warning-500', rating: 2 },
  { label: 'Good', hint: '3 days', border: 'hover:border-primary-500/50', text: 'text-primary-400', rating: 4 },
  { label: 'Easy', hint: '1 week', border: 'hover:border-success-500/50', text: 'text-success-400', rating: 5 },
];

export function TrainingPage() {
  const [revealed, setRevealed] = useState(false);
  const { state, scheduleReview } = useProgress();
  const queue = getReviewQueueItems(state);
  const activeItem = queue[0] ?? null;
  const activeEntity = useMemo(
    () => (activeItem ? getKnowledgeEntity(activeItem.entryId) : null),
    [activeItem],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setRevealed(true);
      }

      if (revealed && ['1', '2', '3', '4'].includes(event.key) && activeEntity) {
        const selected = ratingButtons[Number(event.key) - 1];
        if (selected) {
          scheduleReview(activeEntity.id, selected.rating, activeEntity.entity_type);
          setRevealed(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeEntity, revealed, scheduleReview]);

  if (!activeEntity) {
    return (
      <div className="min-h-screen bg-base-700 text-text-100">
        <AppTopNav searchPlaceholder="Search decks..." />
        <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-[960px] items-center justify-center px-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-100">No study cards available</div>
            <p className="mt-3 text-sm text-text-500">
              Solve a problem or open the review queue to generate your next spaced-repetition card.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const promptContent = activeEntity.entity_type === 'problem'
    ? activeEntity.statement
    : activeEntity.entity_type === 'definition'
      ? activeEntity.statement
      : activeEntity.entity_type === 'theorem'
        ? activeEntity.statement
        : activeEntity.entity_type === 'technique'
          ? activeEntity.summary
          : activeEntity.entity_type === 'example'
            ? activeEntity.prompt
            : asMathContent(activeEntity.id);

  const revealContent = activeEntity.entity_type === 'problem'
    ? activeEntity.answer_key ?? asMathContent('Open the full problem page for the worked solution.')
    : activeEntity.entity_type === 'definition'
      ? activeEntity.statement
      : activeEntity.entity_type === 'theorem'
        ? activeEntity.conclusion ?? activeEntity.statement
        : activeEntity.entity_type === 'technique'
          ? asMathContent(activeEntity.method_steps.map((step) => step.markdown ?? step.plain_text).join('\n\n'))
          : activeEntity.entity_type === 'example'
            ? activeEntity.final_result ?? asMathContent('Open the example entry for the final result.')
            : asMathContent(activeEntity.id);

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search decks..." />
      <header className="border-b border-base-600 bg-base-700/90 px-6 py-4">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-text-400 transition-colors hover:text-text-200">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="text-lg font-bold text-text-100">Study Mode</div>
              <div className="text-xs uppercase tracking-[0.16em] text-text-500">Training Session</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-400">
            <button className="inline-flex items-center gap-2 transition-colors hover:text-text-200">
              <BarChart3 className="h-4 w-4" />
              Stats
            </button>
            <button className="inline-flex items-center gap-2 transition-colors hover:text-text-200">
              <Library className="h-4 w-4" />
              Decks
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-base-500 bg-base-600 text-xs font-bold text-text-200">
              OH
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-201px)] w-full max-w-[1200px] flex-col justify-center gap-8 px-6 py-10">
        <div className="mx-auto w-full max-w-[768px] space-y-8">
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-text-100">Active Session</div>
                <p className="text-sm text-text-400">{activeItem?.collection ?? 'Review queue'}</p>
              </div>
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-primary-400">
                {queue.length} cards pending
              </div>
            </div>
            <div className="flex justify-between text-xs text-text-500">
              <span>{activeItem?.dueLabel ?? 'Nothing scheduled'}</span>
              <span>{state.records.length} recorded study events</span>
            </div>
          </section>

          <section className="rounded-[12px] border border-base-600 bg-base-950 px-10 py-10 shadow-[0_24px_48px_rgba(0,0,0,0.25)]">
            <div className="mb-8 flex items-start justify-between">
              <span className="rounded-full border border-primary-500/30 bg-primary-900/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-400">
                {activeEntity.entity_type}
              </span>
              <button className="text-text-500 transition-colors hover:text-text-300">
                <Info className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-8 text-center">
              <div>
                <h1 className="text-[36px] font-bold tracking-[-0.04em] text-text-100">
                  {('title' in activeEntity && activeEntity.title) || ('term' in activeEntity && activeEntity.term) || ('name' in activeEntity && activeEntity.name) || activeEntity.id}
                </h1>
                <MathContentView content={promptContent} className="mt-3 text-sm text-text-500" />
              </div>

              <div className="rounded-[8px] border border-dashed border-base-500 bg-base-900/60 p-8">
                {revealed ? (
                  <div className="space-y-5">
                    <MathContentView
                      content={revealContent}
                      className="font-serif text-2xl leading-relaxed italic text-primary-400"
                    />
                    <p className="text-sm leading-7 text-text-300">
                      Rate how well you recalled or reconstructed the key fact before revealing it.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="font-serif text-2xl italic text-text-200">Recall or solve the prompt before revealing the answer.</div>
                    <p className="text-sm leading-7 text-text-500">
                      The revealed state will update the same local review schedule that drives the queue and dashboard.
                    </p>
                  </div>
                )}
              </div>

              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-primary-500 px-8 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400"
                >
                  <Eye className="h-4 w-4" />
                  Reveal Card
                </button>
              ) : (
                <div className="space-y-5">
                  <div className="text-sm font-bold uppercase tracking-[0.18em] text-text-500">
                    How well did you recall this?
                  </div>
                  <div className="grid gap-4 sm:grid-cols-4">
                    {ratingButtons.map((button) => (
                      <button
                        key={button.label}
                        onClick={() => {
                          scheduleReview(activeEntity.id, button.rating, activeEntity.entity_type);
                          setRevealed(false);
                        }}
                        className={`rounded-[12px] border-2 border-base-600 bg-base-950 px-4 py-4 transition-colors ${button.border}`}
                      >
                        <div className={`text-lg font-bold ${button.text}`}>{button.label}</div>
                        <div className="mt-1 text-xs text-text-500">{button.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="flex items-center justify-center gap-8 py-2 text-sm text-text-400">
            <div className="inline-flex items-center gap-2">
              <Repeat2 className="h-4 w-4" />
              Session: {state.records.length} events
            </div>
            <div className="inline-flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Queue: {queue.length} active cards
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-base-600 px-6 py-5 text-center text-xs text-text-500">
        Press <kbd className="rounded border border-base-500 bg-base-600 px-2 py-0.5 font-mono">Space</kbd> to
        reveal and <kbd className="rounded border border-base-500 bg-base-600 px-2 py-0.5 font-mono">1-4</kbd> to
        rate recall quality.
      </footer>
    </div>
  );
}
