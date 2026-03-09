# Olympiad Hub App

This frontend renders authored knowledge from `content/`, overlays remotely uploaded knowledge from Supabase, supports LaTeX visualization in the main study surfaces, and can authenticate against Supabase for login, admin routing, and optional progress sync.

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Copy `.env.example` to `.env` and fill in your Supabase values.

3. Start the app:

```bash
npm run dev
```

## Environment Variables

- `VITE_BASE_PATH`: Public base path for the deployed app. Use `/` locally.
- `VITE_SUPABASE_URL`: Your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key. This is the only Supabase key that may be exposed to the browser bundle.
- `VITE_SUPABASE_PROFILE_TABLE`: Profile table used to resolve admin status.
- `VITE_SUPABASE_KNOWLEDGE_TABLE`: Table used for uploaded knowledge entities. Defaults to `knowledge_entities`.
- `VITE_SUPABASE_PROGRESS_TABLE`: Table used for optional progress snapshot sync.
- `VITE_SUPABASE_PROGRESS_SYNC`: Set to `true` only after running `supabase/setup.sql`.

## Supabase Setup

1. In Supabase Authentication, enable the Email provider.
2. Set your Site URL to the deployed GitHub Pages URL.
3. Add your local dev URL and production URL to Redirect URLs.
4. Run the SQL in `/Users/erichuang/Documents/olympiad-knowledge-system/supabase/setup.sql`.
5. Create or sign in with `erichuang.shangjing@outlook.com`.

The SQL bootstrap does three important things:

- Creates `public.profiles` and `public.progress_snapshots` with RLS.
- Creates `public.knowledge_entities` with public read access and admin-only writes.
- Marks `erichuang.shangjing@outlook.com` as admin on signup and backfills admin for an existing user with that email.

## Security Notes

- Never put a `service_role` key into any `VITE_*` variable. GitHub Pages is static, so any `VITE_*` value ends up in the browser bundle.
- Admin status is resolved from Supabase `profiles`, not from a client-side email comparison.
- Uploaded knowledge JSON is stored as validated top-level entity payloads in Supabase and merged with bundled `content/` at runtime.
- Progress sync uses the signed-in user's Supabase session and should remain disabled until the SQL bootstrap is in place.

## GitHub Pages Deployment

The workflow at `/Users/erichuang/Documents/olympiad-knowledge-system/.github/workflows/deploy-pages.yml` builds `app/` and deploys `app/dist` to GitHub Pages.

Configure these GitHub repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Recommended repository variable:

- `VITE_SUPABASE_PROGRESS_SYNC`

The workflow already injects the base path for GitHub Pages project sites.
