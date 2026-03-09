create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.progress_snapshots (
  learner_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_entities (
  id text primary key,
  entity_type text not null,
  payload jsonb not null,
  source_name text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint knowledge_entities_payload_is_object check (jsonb_typeof(payload) = 'object'),
  constraint knowledge_entities_id_matches_payload check (coalesce(payload->>'id', '') = id),
  constraint knowledge_entities_type_matches_payload check (coalesce(payload->>'entity_type', '') = entity_type)
);

create index if not exists knowledge_entities_entity_type_idx
on public.knowledge_entities (entity_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_progress_snapshots_updated_at on public.progress_snapshots;
create trigger set_progress_snapshots_updated_at
before update on public.progress_snapshots
for each row
execute function public.set_updated_at();

drop trigger if exists set_knowledge_entities_updated_at on public.knowledge_entities;
create trigger set_knowledge_entities_updated_at
before update on public.knowledge_entities
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (
    new.id,
    coalesce(new.email, ''),
    lower(coalesce(new.email, '')) = lower('erichuang.shangjing@outlook.com')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    is_admin = excluded.is_admin,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (id, email, is_admin)
select
  id,
  coalesce(email, ''),
  lower(coalesce(email, '')) = lower('erichuang.shangjing@outlook.com')
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  is_admin = excluded.is_admin,
  updated_at = timezone('utc', now());

alter table public.profiles enable row level security;
alter table public.progress_snapshots enable row level security;
alter table public.knowledge_entities enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "progress_manage_own" on public.progress_snapshots;
create policy "progress_manage_own"
on public.progress_snapshots
for all
to authenticated
using (auth.uid() = learner_id)
with check (auth.uid() = learner_id);

drop policy if exists "knowledge_entities_public_read" on public.knowledge_entities;
create policy "knowledge_entities_public_read"
on public.knowledge_entities
for select
to anon, authenticated
using (true);

drop policy if exists "knowledge_entities_admin_insert" on public.knowledge_entities;
create policy "knowledge_entities_admin_insert"
on public.knowledge_entities
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "knowledge_entities_admin_update" on public.knowledge_entities;
create policy "knowledge_entities_admin_update"
on public.knowledge_entities
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "knowledge_entities_admin_delete" on public.knowledge_entities;
create policy "knowledge_entities_admin_delete"
on public.knowledge_entities
for delete
to authenticated
using (public.is_admin());
