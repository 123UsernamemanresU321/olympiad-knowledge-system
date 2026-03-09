import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
  Lightbulb,
  PlayCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LatexBlock, MathContentView, asMathContent } from '../components/content/MathContentView';
import { AppTopNav, Badge, SectionTitle, Surface } from '../components/layout/DesignShell';
import { getKnowledgeEntity, getPrerequisiteCatalogItems, getRelatedCatalogItems, resolveTopic } from '../lib/uiData';
import type { DefinitionEntity, ExampleEntity, MathContent, TechniqueEntity, TheoremEntity } from '../types';

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

function getTypeTone(type: string) {
  if (type === 'theorem') {
    return 'blue' as const;
  }
  if (type === 'technique') {
    return 'green' as const;
  }
  if (type === 'definition') {
    return 'amber' as const;
  }
  return 'slate' as const;
}

export function EntryPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const [proofOpen, setProofOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);

  const entity = entryId ? getKnowledgeEntity(entryId) : null;

  const detail = useMemo(() => {
    if (!entity || !['definition', 'theorem', 'technique', 'example'].includes(entity.entity_type)) {
      return null;
    }

    const entry = entity as DefinitionEntity | TheoremEntity | TechniqueEntity | ExampleEntity;
    const topicId = 'primary_topic_id' in entry ? entry.primary_topic_id : entry.primary_topic_ids[0];
    const resolved = resolveTopic(topicId);
    const relatedEntries = getRelatedCatalogItems(entry.id);
    const prerequisiteEntries = getPrerequisiteCatalogItems(entry.id);

    const statementContent =
      entry.entity_type === 'definition'
        ? entry.statement
        : entry.entity_type === 'theorem'
          ? entry.statement
          : entry.entity_type === 'technique'
            ? entry.summary
            : entry.prompt;

    const formulas = [
      entry.entity_type === 'definition' ? entry.statement.latex : undefined,
      entry.entity_type === 'theorem' ? entry.statement.latex ?? entry.conclusion?.latex : undefined,
      entry.entity_type === 'example' ? entry.final_result?.latex : undefined,
    ].filter(Boolean) as string[];

    const proofSteps: MathContent[] =
      entry.entity_type === 'theorem'
        ? (entry.proof_outline_steps ?? []).map((item) => item)
        : entry.entity_type === 'technique'
          ? entry.method_steps
        : entry.entity_type === 'definition'
          ? [
              ...(entry.assumptions ?? []),
              asMathContent(
                'Pair the definition with the linked theorem or technique before using it in a problem.',
              ),
            ]
          : [
              entry.objective
                ?? asMathContent(
                  'Understand the target pattern in the example before copying the algebra.',
                ),
              entry.final_result ?? asMathContent('Check the final result and the parameterization carefully.'),
            ];

    const coreTechniques =
      entry.entity_type === 'technique'
        ? entry.method_steps.map((item, index) => ({
            title: `Step ${index + 1}`,
            body: item.plain_text,
          }))
        : relatedEntries.slice(0, 3).map((item) => ({
            title: item.title,
            body: item.description,
          }));

    const mistakes: MathContent[] =
      entry.entity_type === 'technique'
        ? (entry.failure_modes ?? [])
        : [
            asMathContent('Using the headline statement without checking the exact hypotheses.'),
            asMathContent(
              'Skipping the linked prerequisite entry before trying to apply the result in a problem.',
            ),
          ];

    const examplePrompt =
      entry.entity_type === 'example'
        ? entry.prompt
        : asMathContent(
            relatedEntries.find((item) => item.type === 'example')?.description
              ?? 'Use the linked example or problem to stress-test this idea in a concrete setting.',
          );

    const exampleSolution: MathContent[] =
      entry.entity_type === 'example'
        ? [entry.final_result ?? asMathContent('Open the example solution for the full worked argument.')]
        : relatedEntries.slice(0, 2).map((item) => asMathContent(item.title));

    return {
      title:
        ('title' in entry && entry.title)
        || ('term' in entry && entry.term)
        || ('name' in entry && entry.name)
        || entry.id,
      typeLabel: titleCase(entry.entity_type),
      typeTone: getTypeTone(entry.entity_type),
      statusLabel: titleCase(entry.status),
      difficultyLabel:
        entry.tracking_profile.estimated_effort_minutes <= 15
          ? 'Easy'
          : entry.tracking_profile.estimated_effort_minutes <= 28
            ? 'Intermediate'
            : 'Hard',
      subjectName: resolved?.subject.name ?? 'Subject',
      subjectRoute: resolved ? `/subjects/${resolved.subject.id}` : '/subjects',
      topicName: resolved?.topic.name ?? 'Topic',
      topicRoute: resolved ? `/topics/${resolved.topic.id}` : '/subjects',
      statementContent,
      formulas,
      proofTitle: entry.entity_type === 'technique' ? 'Method Steps' : entry.entity_type === 'example' ? 'Worked Example Notes' : 'Proof Outline',
      proofSteps,
      coreTechniques,
      mistakes,
      examplePrompt,
      exampleSolution,
      relatedEntries,
      prerequisiteEntries,
      updatedLabel: `Updated ${new Date(entry.audit.updated_at).toLocaleDateString()}`,
    };
  }, [entity]);

  if (!entryId) {
    return <div className="min-h-screen bg-base-700" />;
  }

  if (!detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-700 text-text-300">
        Entry not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search entries..." />

      <div className="mx-auto flex w-full max-w-[1320px] items-start">
        <aside className="sticky top-[65px] hidden min-h-[calc(100vh-65px)] w-[256px] shrink-0 border-r border-base-600 px-6 py-8 lg:block">
          <div className="space-y-8">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">Contents</div>
              <div className="mt-4 space-y-2">
                {[
                  ['Statement', '#statement'],
                  [detail.proofTitle, '#proof-outline'],
                  ['Related Links', '#core-techniques'],
                  ['Common Mistakes', '#common-mistakes'],
                  ['Example Surface', '#example-problem'],
                ].map(([item, href], index) => (
                  <a
                    key={item}
                    href={href}
                    className={`block rounded-[4px] px-3 py-2 text-sm ${
                      index === 0 ? 'bg-primary-900/40 text-primary-400' : 'text-text-400'
                    }`}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">
                Prerequisites
              </div>
              <div className="mt-4 space-y-3">
                {detail.prerequisiteEntries.map((entry) => (
                  <Surface key={entry.id} className="p-4">
                    <div className="text-sm font-semibold text-text-100">{entry.title}</div>
                    <p className="mt-2 text-xs leading-5 text-text-500">{entry.description}</p>
                  </Surface>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">
                Related Entries
              </div>
              <div className="mt-4 space-y-3">
                {detail.relatedEntries.map((entry) => (
                  <Link key={entry.id} to={entry.route} className="flex items-center justify-between text-sm text-text-400">
                    <span>{entry.title}</span>
                    <ChevronRight className="h-4 w-4 text-text-500" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">
          <div className="mx-auto flex max-w-[860px] flex-col gap-10">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-text-500">
              <Link to={detail.subjectRoute} className="hover:text-text-300">
                {detail.subjectName}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={detail.topicRoute} className="hover:text-text-300">
                {detail.topicName}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-text-300">{detail.title}</span>
            </div>

            <div className="flex flex-col gap-6 border-b border-base-600 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-4">
                <h1 className="text-3xl font-black leading-tight tracking-[-0.05em] text-text-100 sm:text-[44px]">
                  {detail.title}
                </h1>
                <div className="flex flex-wrap gap-3">
                  <Badge tone={detail.typeTone}>{detail.typeLabel}</Badge>
                  <Badge tone="green">Difficulty: {detail.difficultyLabel}</Badge>
                  <Badge tone="amber">Status: {detail.statusLabel}</Badge>
                </div>
              </div>
              <div className="hidden h-24 w-24 items-center justify-center rounded-[12px] border border-primary-500/20 bg-[linear-gradient(180deg,rgba(20,75,184,0.2),rgba(17,22,33,0.4))] sm:flex">
                <Info className="h-8 w-8 text-primary-400" />
              </div>
            </div>

            <section id="statement" className="space-y-6 scroll-mt-24">
              <SectionTitle title={`${detail.typeLabel} Statement`} />
              <div className="rounded-[8px] border border-base-600 bg-base-900/40 p-6 text-base text-text-300">
                <MathContentView content={detail.statementContent} />
              </div>
              {detail.formulas.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {detail.formulas.map((formula, index) => (
                    <Surface key={formula} className="p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">
                        Formula {index + 1}
                      </div>
                      <LatexBlock latex={formula} className="mt-3 text-center text-text-200" />
                    </Surface>
                  ))}
                </div>
              ) : null}
            </section>

            <Surface id="proof-outline" className="scroll-mt-24 overflow-hidden">
              <button
                onClick={() => setProofOpen((current) => !current)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-primary-400" />
                  <div className="text-lg font-bold text-text-100">{detail.proofTitle}</div>
                </div>
                <ChevronDown className={`h-5 w-5 text-text-500 transition-transform ${proofOpen ? 'rotate-180' : ''}`} />
              </button>
              {proofOpen ? (
                <div className="border-t border-base-600 px-6 py-5">
                  <ol className="space-y-3 text-sm text-text-300">
                    {detail.proofSteps.map((step) => (
                      <li key={step.plain_text}>
                        <MathContentView content={step} />
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </Surface>

            <section id="core-techniques" className="space-y-6 scroll-mt-24">
              <SectionTitle title="Related Links" />
              <div className="grid gap-4 md:grid-cols-2">
                {detail.coreTechniques.map((technique) => (
                  <Surface key={technique.title} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary-900/30 text-primary-400">
                        <PlayCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-100">{technique.title}</div>
                        <p className="mt-2 text-xs leading-5 text-text-500">{technique.body}</p>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            </section>

            <section id="common-mistakes" className="scroll-mt-24 rounded-[8px] border border-rose-500/30 bg-rose-950/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-950/30 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-rose-300">Common Mistakes</div>
                  <ul className="mt-3 space-y-2 text-sm text-text-300">
                    {detail.mistakes.map((mistake) => (
                      <li key={mistake.plain_text}>
                        <MathContentView content={mistake} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="example-problem" className="space-y-6 scroll-mt-24">
              <SectionTitle title="Example Surface" />
              <Surface className="p-8">
                <MathContentView content={detail.examplePrompt} className="text-base text-text-200" />
                {solutionOpen ? (
                  <div className="mt-6 rounded-[8px] border border-success-500/30 bg-success-900/15 p-5">
                    <div className="text-sm font-bold uppercase tracking-[0.18em] text-success-400">Solution</div>
                    <ol className="mt-4 space-y-3 text-sm text-text-300">
                      {detail.exampleSolution.map((step) => (
                        <li key={step.plain_text}>
                          <MathContentView content={step} />
                        </li>
                      ))}
                    </ol>
                    <button
                      onClick={() => setSolutionOpen(false)}
                      className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-text-500"
                    >
                      Hide solution
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSolutionOpen(true)}
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-[4px] bg-primary-500 px-6 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400"
                  >
                    <Eye className="h-4 w-4" />
                    Reveal Solution
                  </button>
                )}
              </Surface>
            </section>

            <div className="flex flex-col gap-3 border-t border-base-600 pt-6 text-xs text-text-500 sm:flex-row sm:items-center sm:justify-between">
              <div>{detail.updatedLabel}</div>
              <div className="flex gap-4">
                <button className="hover:text-text-300">Cite this page</button>
                <button className="hover:text-text-300">Talk Page</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
