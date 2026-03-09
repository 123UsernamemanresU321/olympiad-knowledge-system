import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Tag } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppTopNav, Surface } from '../components/layout/DesignShell';
import { getTopTags, searchCatalog } from '../lib/uiData';

const topContributors = [
  { name: 'seed.bot', total: '24 validated entries' },
  { name: 'schema.guard', total: '0 invalid references' },
  { name: 'local.learner', total: 'active review state' },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const filterType = searchParams.get('type') ?? 'all';
  const [draftQuery, setDraftQuery] = useState(query);

  const results = searchCatalog(query, filterType === 'topic' ? 'all' : filterType);
  const tagCloud = getTopTags(results.length > 0 ? results : searchCatalog('', 'all'));

  const setType = (nextType: string) => {
    setSearchParams({ q: query, type: nextType });
  };

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search Number Theory entries..." searchValue={query} />

      <div className="border-b border-base-600 bg-base-700/90">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 overflow-x-auto px-6 py-3">
          {[
            'Subject: Number Theory',
            `Type: ${filterType === 'all' ? 'All' : filterType}`,
            'Difficulty: Any',
            'Status: Published',
          ].map((label) => (
            <button
              key={label}
              className="inline-flex h-8 items-center rounded-[4px] bg-base-600 px-3 text-xs font-medium text-text-200"
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <button className="inline-flex items-center gap-2 text-xs font-semibold text-primary-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            More Filters
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 py-8 xl:flex-row">
        <main className="min-w-0 flex-1 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-text-500">
              <Link to="/" className="hover:text-text-300">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-text-300">Search Results</span>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] text-text-100 sm:text-[40px]">
              {query ? `Results for '${query}'` : 'Search the Knowledge Base'}
            </h1>
            <p className="text-sm text-text-400">
              Found {results.length} results across definitions, theorems, techniques, examples, and problems.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearchParams({ q: draftQuery, type: filterType });
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="flex flex-1 items-center rounded-[8px] border border-base-600 bg-base-900/50 px-4">
              <Search className="mr-3 h-4 w-4 text-text-500" />
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className="h-12 w-full bg-transparent text-sm text-text-100 placeholder:text-text-500 focus:outline-none"
                placeholder="Refine search..."
              />
            </div>
            <button className="h-12 rounded-[8px] bg-primary-500 px-6 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400">
              Search
            </button>
          </form>

          <div className="flex gap-8 border-b border-base-600">
            {[
              { label: 'All', value: 'all' },
              { label: 'Theorems', value: 'theorem' },
              { label: 'Problems', value: 'problem' },
              { label: 'Techniques', value: 'technique' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setType(tab.value)}
                className={`border-b-2 pb-4 text-sm font-medium ${
                  filterType === tab.value
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-text-400 hover:text-text-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Surface className="overflow-hidden p-0">
            {results.map((result) => (
              <Link
                key={result.id}
                to={result.route}
                className="block border-b border-base-600/60 bg-base-900/25 p-5 last:border-b-0 transition-colors hover:bg-base-900/45"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-full bg-primary-900/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-400">
                      {result.type}
                    </span>
                    <h3 className="text-xl font-semibold text-text-100">{result.title}</h3>
                  </div>
                  <span className="text-xs text-text-500">{result.updatedLabel}</span>
                </div>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-text-400">{result.description}</p>
                {result.formula ? (
                  <div className="mt-4 rounded-[4px] bg-base-600/70 px-4 py-3 text-center font-serif text-base italic text-text-200">
                    {result.formula}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-500">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Tags:
                  </span>
                  {result.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-[4px] bg-base-600 px-2 py-1 text-text-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </Surface>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-base-600 bg-base-900/40 text-text-400">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {['1', '2', '3', '…', '5'].map((page) => (
              <button
                key={page}
                className={`flex h-8 w-8 items-center justify-center rounded-[4px] border ${
                  page === '1'
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-base-600 bg-base-900/40 text-text-300'
                }`}
              >
                {page}
              </button>
            ))}
            <button className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-base-600 bg-base-900/40 text-text-400">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </main>

        <aside className="w-full shrink-0 space-y-6 xl:w-[320px]">
          <Surface className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-text-100">
              <Tag className="h-4 w-4 text-primary-400" />
              Related Tags
            </div>
            <div className="space-y-3">
              {tagCloud.map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between text-sm text-text-300">
                  <span>{tag}</span>
                  <span className="text-xs text-text-500">{count}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 text-xs font-semibold text-primary-400">Show more</button>
          </Surface>

          <Surface className="p-5">
            <div className="mb-4 text-sm font-bold text-text-100">Pipeline Status</div>
            <div className="space-y-4">
              {topContributors.map((contributor) => (
                <div key={contributor.name} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-base-500 text-xs font-bold text-text-100">
                    {contributor.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-100">{contributor.name}</div>
                    <div className="text-xs text-text-500">{contributor.total}</div>
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          <div className="rounded-[8px] bg-[linear-gradient(135deg,#144bb8,#1d4ed8)] p-6">
            <h3 className="text-2xl font-bold text-white">Validated Local Library</h3>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Every visible result on this screen comes from schema-checked JSON authored in the local knowledge base.
            </p>
            <Link
              to="/import"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[4px] bg-white text-sm font-bold text-primary-500"
            >
              Open Import Workspace
            </Link>
          </div>
        </aside>
      </div>

      <footer className="border-t border-base-600 px-6 py-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 text-sm text-text-500 md:flex-row md:items-center md:justify-between">
          <div className="text-text-300">Olympiad Hub</div>
          <div className="flex gap-6">
            <button>About</button>
            <button>Guidelines</button>
            <button>Privacy</button>
            <button>Contact</button>
          </div>
          <div>Local-first JSON knowledge system.</div>
        </div>
      </footer>
    </div>
  );
}
