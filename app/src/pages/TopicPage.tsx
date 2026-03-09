import { ArrowUpDown, ChevronRight, Download, MoreVertical, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppTopNav, Badge, Surface } from '../components/layout/DesignShell';
import { getCatalogForTopic, getTopicDescription, resolveTopic } from '../lib/uiData';

interface TopicRow {
  id: string;
  title: string;
  route: string;
  type: string;
  description: string;
  difficulty: string;
  status: string;
}

function buildGeneratedRows(topicId: string) {
  const resolved = resolveTopic(topicId);
  if (!resolved) {
    return [];
  }

  return resolved.topic.subtopics.slice(0, 6).map((subtopic, index) => ({
    id: subtopic.id,
    title: subtopic.name,
    route: `/entries/${subtopic.id}`,
    type: index % 2 === 0 ? 'Definition' : 'Technique',
    description:
      'This route is being generated directly from the taxonomy because there is no source JSON entry for the subtopic yet.',
    difficulty: ['Easy', 'Intermediate', 'Hard'][index % 3],
    status: ['Draft', 'Reviewed', 'Polished'][index % 3],
  }));
}

export function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const resolved = topicId ? resolveTopic(topicId) : null;

  if (!resolved || !topicId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-700 text-text-300">
        Topic not found in the taxonomy.
      </div>
    );
  }

  const topicEntries = getCatalogForTopic(topicId);
  const rows: TopicRow[] =
    topicEntries.length > 0
      ? topicEntries.map((entry) => ({
          id: entry.id,
          title: entry.title,
          route: entry.route,
          type: entry.type[0].toUpperCase() + entry.type.slice(1),
          description: entry.description,
          difficulty: entry.difficulty,
          status: entry.status,
        }))
      : buildGeneratedRows(topicId);

  const title = resolved.activeSubtopic?.name ?? resolved.topic.name;

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search topic entries..." />
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-6 py-10">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-text-500">
          <Link to="/" className="hover:text-text-300">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/subjects/${resolved.subject.id}`} className="hover:text-text-300">
            {resolved.subject.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-text-300">{title}</span>
        </div>

        <div className="flex flex-col gap-8 border-b border-base-600 pb-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-900/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-400">
              Topic Page
            </div>
            <div>
              <h1 className="text-3xl font-black leading-tight tracking-[-0.05em] text-text-100 sm:text-[48px]">
                {title}
              </h1>
              <p className="mt-3 text-base leading-7 text-text-400">
                {getTopicDescription(resolved.topic.id)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge tone="blue">{rows.length} associated entries</Badge>
              <Badge tone="green">{resolved.topic.subtopics.length} subtopics</Badge>
              <Badge tone="slate">{resolved.topic.level}</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-primary-500 px-6 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400">
              <Plus className="h-4 w-4" />
              Add Entry
            </button>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-base-500 bg-transparent px-6 text-sm font-bold text-text-300 transition-colors hover:text-text-100">
              <Download className="h-4 w-4" />
              Export Topic PDF
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {['All Types', 'Any Status', 'Updated Recently'].map((label) => (
              <button
                key={label}
                className="inline-flex h-10 items-center gap-2 rounded-[4px] border border-base-600 bg-base-900/60 px-4 text-sm font-medium text-text-300"
              >
                {label}
                <ChevronRight className="h-3.5 w-3.5 rotate-90 text-text-500" />
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-text-300">
            Sort by relevance
            <ArrowUpDown className="h-4 w-4 text-text-500" />
          </button>
        </div>

        <Surface className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="border-b border-base-600 bg-base-900/70 text-left">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                    Title & description
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                    Type
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                    Difficulty
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-600/60">
                {rows.map((row) => (
                  <tr key={row.id} className="bg-base-900/20 transition-colors hover:bg-base-900/40">
                    <td className="px-6 py-5 align-top">
                      <Link to={row.route} className="text-base font-semibold text-text-100 hover:text-primary-400">
                        {row.title}
                      </Link>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-text-400">{row.description}</p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <Badge tone="blue" className="text-[10px]">
                        {row.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 align-top text-sm text-text-300">{row.difficulty}</td>
                    <td className="px-6 py-5 align-top text-sm text-text-300">{row.status}</td>
                    <td className="px-6 py-5 align-top text-right">
                      <button className="rounded-[4px] p-2 text-text-500 transition-colors hover:bg-base-600/60 hover:text-text-200">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        <div className="grid gap-4 md:grid-cols-3">
          <Surface className="p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-text-500">Reference density</div>
            <div className="mt-3 text-3xl font-black text-text-100">{rows.length}</div>
            <p className="mt-2 text-sm text-text-400">Live table entries mapped to this topic or subtopic.</p>
          </Surface>
          <Surface className="p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-text-500">Contributors</div>
            <div className="mt-3 text-3xl font-black text-text-100">18</div>
            <p className="mt-2 text-sm text-text-400">Editors and solvers touched this learning lane recently.</p>
          </Surface>
          <Surface className="p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-text-500">Related tracks</div>
            <div className="mt-3 text-sm font-semibold text-text-200">
              {resolved.subject.topics.slice(0, 2).map((topic) => topic.name).join(' • ')}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
