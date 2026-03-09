const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
const progressTable = import.meta.env.VITE_SUPABASE_PROGRESS_TABLE?.trim() || 'progress_snapshots';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseProgressSyncEnabled = import.meta.env.VITE_SUPABASE_PROGRESS_SYNC === 'true';

function buildProgressEndpoint() {
  const baseUrl = supabaseUrl.replace(/\/+$/, '');
  return `${baseUrl}/rest/v1/${progressTable}?on_conflict=learner_id`;
}

export async function syncProgressSnapshot<T extends { learnerId: string }>(snapshot: T) {
  if (!isSupabaseConfigured) {
    return;
  }

  const response = await fetch(buildProgressEndpoint(), {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      learner_id: snapshot.learnerId,
      snapshot,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase sync failed (${response.status}): ${errorText || response.statusText}`);
  }
}
