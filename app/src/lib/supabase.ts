import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { EntityType, KnowledgeEntity } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
const progressTable = import.meta.env.VITE_SUPABASE_PROGRESS_TABLE?.trim() || 'progress_snapshots';
const profileTable = import.meta.env.VITE_SUPABASE_PROFILE_TABLE?.trim() || 'profiles';
const knowledgeTable = import.meta.env.VITE_SUPABASE_KNOWLEDGE_TABLE?.trim() || 'knowledge_entities';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseProgressSyncEnabled = import.meta.env.VITE_SUPABASE_PROGRESS_SYNC === 'true';

export interface AuthProfile {
  id: string;
  email: string;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeEntityRecord {
  id: string;
  entity_type: EntityType;
  payload: KnowledgeEntity;
  source_name: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}

function getEmailRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function signInWithPassword(email: string, password: string) {
  return requireClient().auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string) {
  return requireClient().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
    },
  });
}

export async function signOut() {
  return requireClient().auth.signOut();
}

export async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(profileTable)
    .select('id, email, is_admin, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle<AuthProfile>();

  if (error) {
    throw error;
  }

  return data;
}

export async function loadProgressSnapshot(userId: string): Promise<unknown> {
  if (!supabase || !supabaseProgressSyncEnabled) {
    return null;
  }

  const { data, error } = await supabase
    .from(progressTable)
    .select('snapshot')
    .eq('learner_id', userId)
    .maybeSingle<{ snapshot: unknown }>();

  if (error) {
    throw error;
  }

  return data?.snapshot ?? null;
}

export async function syncProgressSnapshot<T extends { learnerId: string }>(snapshot: T) {
  if (!supabase || !supabaseProgressSyncEnabled) {
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user || user.id !== snapshot.learnerId) {
    return;
  }

  const { error } = await supabase.from(progressTable).upsert({
    learner_id: user.id,
    snapshot,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function listKnowledgeEntities(): Promise<KnowledgeEntityRecord[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from(knowledgeTable)
    .select('id, entity_type, payload, source_name, uploaded_by, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as KnowledgeEntityRecord[];
}

export async function upsertKnowledgeEntities(entries: KnowledgeEntity[], sourceName?: string) {
  if (entries.length === 0) {
    return 0;
  }

  const client = requireClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('You must be signed in as an admin to upload knowledge entities.');
  }

  const timestamp = new Date().toISOString();
  const rows = entries.map((entry) => ({
    id: entry.id,
    entity_type: entry.entity_type,
    payload: entry,
    source_name: sourceName ?? null,
    uploaded_by: user.id,
    updated_at: timestamp,
  }));

  const { error } = await client.from(knowledgeTable).upsert(rows, { onConflict: 'id' });

  if (error) {
    throw error;
  }

  return rows.length;
}
