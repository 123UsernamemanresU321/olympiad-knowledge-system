/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_PATH?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PROGRESS_TABLE?: string;
  readonly VITE_SUPABASE_PROFILE_TABLE?: string;
  readonly VITE_SUPABASE_PROGRESS_SYNC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
