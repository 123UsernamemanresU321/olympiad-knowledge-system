import { AlertTriangle, CheckCircle2, FileWarning } from 'lucide-react';
import { AppTopNav, Surface } from '../components/layout/DesignShell';
import { getValidationLogs } from '../lib/uiData';

export function ValidationErrorsPage() {
  const logs = getValidationLogs();

  const errorCount = logs.filter((log) => log.level === 'error').length;
  const warningCount = 0;

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search validation logs..." />
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-6 py-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-warning-500/30 bg-warning-900/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-warning-500">
            <FileWarning className="h-3.5 w-3.5" />
            Validation Feed
          </div>
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] text-text-100 sm:text-[36px]">
              Import and Schema Diagnostics
            </h1>
            <p className="mt-2 max-w-3xl text-base text-text-400">
              When the repo has no real validation failures, this screen holds the same visual treatment as the import design and shows representative warnings instead of an empty shell.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Surface className="p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-text-500">Errors</div>
            <div className="mt-3 text-3xl font-black text-rose-400">{errorCount}</div>
          </Surface>
          <Surface className="p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-text-500">Warnings</div>
            <div className="mt-3 text-3xl font-black text-warning-500">{warningCount}</div>
          </Surface>
          <Surface className="p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-text-500">Checked files</div>
            <div className="mt-3 text-3xl font-black text-text-100">
              {logs.length}
            </div>
          </Surface>
        </div>

        {logs.length === 0 ? (
          <Surface className="p-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-900/30 text-success-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-100">No issues detected</h2>
                <p className="mt-1 text-sm text-text-400">
                  Every imported document passed the schema checks in this local snapshot.
                </p>
              </div>
            </div>
          </Surface>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <Surface key={`${log.level}-${index}`} className="p-0">
                <div className="flex items-start gap-4 p-5">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      log.level === 'error'
                        ? 'bg-rose-950/40 text-rose-400'
                        : 'bg-warning-900/20 text-warning-500'
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-500">
                      {log.level}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-text-300">{log.message}</p>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
