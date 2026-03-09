import { CheckCircle2, FileJson, Play, UploadCloud, XCircle } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { AppTopNav, SidebarNavLink, Surface } from '../components/layout/DesignShell';
import { validateImportedPayload } from '../lib/loader';
import { getImportPreviewRows } from '../lib/uiData';

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [jsonContent, setJsonContent] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationState, setValidationState] = useState({
    logs: [] as Array<{ level: 'error' | 'warning'; message: string }>,
    previewRows: [] as ReturnType<typeof getImportPreviewRows>,
    validCount: 0,
    warningCount: 0,
    errorCount: 0,
  });

  const runValidation = (rawContent: string) => {
    try {
      const parsed = JSON.parse(rawContent);
      const result = validateImportedPayload(parsed);
      const logs = result.errors.flatMap((entry) =>
        entry.errors.map((error) => ({
          level: 'error' as const,
          message: `${entry.path}: ${error.message}`,
        })),
      );

      return {
        logs,
        previewRows: getImportPreviewRows(result.entries),
        validCount: result.entries.length,
        warningCount: 0,
        errorCount: logs.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON.';
      return {
        logs: [{ level: 'error' as const, message }],
        previewRows: [],
        validCount: 0,
        warningCount: 0,
        errorCount: 1,
      };
    }
  };

  const handleValidate = () => {
    setValidationState(runValidation(jsonContent));
  };

  const handleFile = async (file: File) => {
    const isJsonFile =
      file.name.toLowerCase().endsWith('.json')
      || file.type === 'application/json'
      || file.type === 'text/json'
      || file.type === '';

    if (!isJsonFile) {
      setSelectedFileName(file.name);
      setValidationState({
        logs: [{ level: 'error', message: `Unsupported file type for ${file.name}. Please use a JSON file.` }],
        previewRows: [],
        validCount: 0,
        warningCount: 0,
        errorCount: 1,
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFileName(file.name);
      setValidationState({
        logs: [{ level: 'error', message: `${file.name} exceeds the 10MB upload limit.` }],
        previewRows: [],
        validCount: 0,
        warningCount: 0,
        errorCount: 1,
      });
      return;
    }

    const text = await file.text();
    setSelectedFileName(file.name);
    setJsonContent(text);
    setValidationState(runValidation(text));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search imports..." />
      <div className="flex min-h-[calc(100vh-65px)]">
        <aside className="hidden w-[272px] shrink-0 border-r border-base-600 bg-base-700 lg:flex lg:flex-col">
          <div className="border-b border-base-600 p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-500">Admin Console</div>
            <div className="mt-2 text-lg font-semibold text-text-100">Import Workspace</div>
          </div>
          <div className="flex-1 space-y-1 px-4 py-4">
            <SidebarNavLink to="/" label="Dashboard" icon={UploadCloud} end />
            <SidebarNavLink to="/import" label="Import Entries" icon={FileJson} />
            <SidebarNavLink to="/errors" label="Validation Feed" icon={XCircle} />
            <SidebarNavLink to="/review-queue" label="Processing Queue" icon={Play} />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-base-600 bg-base-700/90">
            <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold text-text-100">Import &amp; Validation</h1>
                <p className="mt-1 text-sm text-text-500">Upload JSON, validate structure, and inspect the parsed preview.</p>
              </div>
              <div className="rounded-full border border-base-500 bg-base-600/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-text-400">
                Local validation only
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 py-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
              <Surface className="p-6">
                <div className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-text-500">
                  File Upload
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    if (event.currentTarget === event.target) {
                      setIsDragging(false);
                    }
                  }}
                  onDrop={handleDrop}
                  className={`flex min-h-[320px] flex-col items-center justify-center rounded-[12px] border-2 border-dashed bg-base-950/70 p-8 text-center transition-colors ${
                    isDragging ? 'border-primary-400 bg-primary-900/10' : 'border-base-500'
                  }`}
                >
                  <UploadCloud className="h-10 w-10 text-primary-400" />
                  <h2 className="mt-5 text-lg font-semibold text-text-100">Drag and drop JSON files here</h2>
                  <p className="mt-2 text-sm text-text-500">Maximum file size: 10MB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 h-11 rounded-[8px] bg-primary-500 px-6 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400"
                  >
                    Browse Files
                  </button>
                  <div className="mt-4 text-xs text-text-500">
                    {selectedFileName ? `Loaded: ${selectedFileName}` : 'No file selected yet.'}
                  </div>
                </div>
              </Surface>

              <Surface className="overflow-hidden">
                <div className="border-b border-base-600 bg-base-900/70 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-500">{selectedFileName ?? 'draft.json'}</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-text-400 transition-colors hover:text-text-200"
                    >
                      <FileJson className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={jsonContent}
                  onChange={(event) => {
                    setJsonContent(event.target.value);
                    setSelectedFileName(null);
                  }}
                  placeholder="Paste JSON here or load a .json file to validate it."
                  className="min-h-[320px] w-full resize-none bg-base-950/70 p-5 font-mono text-sm text-text-300 focus:outline-none"
                  spellCheck={false}
                />
              </Surface>
            </div>

            <div className="flex justify-center border-b border-base-600 pb-8">
              <button
                type="button"
                onClick={handleValidate}
                className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-primary-500 px-8 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,75,184,0.2)] transition-colors hover:bg-primary-400"
              >
                <Play className="h-4 w-4" />
                Validate JSON Data
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-2xl font-bold text-text-100">Validation Results</h2>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-success-500/30 bg-success-900/20 px-3 py-1.5 text-xs font-bold text-success-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {validationState.validCount} Valid
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-warning-500/30 bg-warning-900/20 px-3 py-1.5 text-xs font-bold text-warning-500">
                    {validationState.warningCount} Warnings
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 text-xs font-bold text-rose-400">
                    <XCircle className="h-3.5 w-3.5" />
                    {validationState.errorCount} Errors
                  </span>
                </div>
              </div>

              <Surface className="overflow-hidden p-0">
                <div className="border-b border-base-600 bg-base-900/70 px-4 py-3">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-text-500">
                    Error Logs &amp; Warnings
                  </div>
                </div>
                <div className="space-y-3 p-4 font-mono text-xs">
                  {validationState.logs.length === 0 ? (
                    <div className="rounded-[8px] border border-success-500/20 bg-success-900/10 px-4 py-3 text-success-400">
                      No validation issues found.
                    </div>
                  ) : null}
                  {validationState.logs.map((log, index) => (
                    <div
                      key={`${log.level}-${index}`}
                      className={`rounded-[8px] border px-4 py-3 ${
                        log.level === 'error'
                          ? 'border-rose-500/20 bg-rose-950/15 text-rose-300'
                          : 'border-warning-500/20 bg-warning-900/10 text-warning-400'
                      }`}
                    >
                      {log.message}
                    </div>
                  ))}
                </div>
              </Surface>

              <div>
                <div className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-text-500">
                  Data Preview (Valid Entries)
                </div>
                <Surface className="overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead className="border-b border-base-600 bg-base-900/70">
                        <tr>
                          <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                            Entry ID
                          </th>
                          <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                            Topic
                          </th>
                          <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                            Complexity
                          </th>
                          <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                            Theorem / Concept
                          </th>
                          <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-base-600/60">
                        {validationState.previewRows.length > 0 ? (
                          validationState.previewRows.map((row) => (
                            <tr key={row.entryId} className="bg-base-900/20">
                              <td className="px-6 py-4 font-mono text-primary-400">{row.entryId}</td>
                              <td className="px-6 py-4 text-sm text-text-300">{row.topic}</td>
                              <td className="px-6 py-4">
                                <div className="flex gap-1">
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <span
                                      key={index}
                                      className={`h-2 w-1.5 rounded-sm ${
                                        index < row.difficulty ? 'bg-primary-500' : 'bg-base-500'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-text-300">{row.concept}</td>
                              <td className="px-6 py-4 text-right">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-xs font-bold ${
                                    row.status === 'Valid'
                                      ? 'bg-success-900/20 text-success-400'
                                      : 'bg-warning-900/20 text-warning-500'
                                  }`}
                                >
                                  {row.status === 'Valid' ? <CheckCircle2 className="h-3 w-3" /> : null}
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-base-900/20">
                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-text-500">
                              No valid entries loaded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Surface>
              </div>

              <div className="flex flex-col gap-3 border-t border-base-600 pt-6 text-sm text-text-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  This workspace validates imported JSON locally. Browser actions do not write into
                  `content/`.
                </p>
                <Link to="/errors" className="font-semibold text-primary-400">
                  Open validation feed
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
