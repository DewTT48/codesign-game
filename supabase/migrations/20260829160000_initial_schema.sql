create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  theme_preference text not null default 'classic'
    check (theme_preference in ('classic', 'forest', 'sunset')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null default 'guided' check (mode in ('guided', 'own')),
  title text not null,
  topic text not null,
  content_readiness text not null
    check (content_readiness in ('ready', 'some', 'idea')),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'archived')),
  current_phase text not null default 'C'
    check (current_phase in ('C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N', 'COMPLETE')),
  solidification_stage text not null default 'IDEA'
    check (solidification_stage in ('IDEA', 'UNDERSTOOD', 'EXPLORED', 'DECIDED', 'SOLID', 'BUILD_READY')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create index projects_owner_id_idx on public.projects(owner_id);
create index projects_owner_status_idx on public.projects(owner_id, status);

create table public.phase_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase text not null check (phase in ('SETUP', 'C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N')),
  section text not null,
  field_key text not null,
  content jsonb not null default 'null'::jsonb,
  status text not null default 'captured'
    check (status in ('captured', 'locked', 'superseded')),
  version integer not null default 1 check (version > 0),
  is_current boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index phase_entries_current_field_idx
  on public.phase_entries(project_id, phase, section, field_key)
  where is_current;
create index phase_entries_project_phase_idx
  on public.phase_entries(project_id, phase);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase text not null check (phase in ('C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N')),
  decision_type text not null,
  content jsonb not null,
  version integer not null default 1 check (version > 0),
  is_current boolean not null default true,
  supersedes_decision_id uuid references public.decisions(id) on delete set null,
  reason_for_change text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index decisions_current_type_idx
  on public.decisions(project_id, phase, decision_type)
  where is_current;
create index decisions_project_phase_idx on public.decisions(project_id, phase);

create table public.prd_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null check (version > 0),
  markdown_content text not null,
  status text not null default 'draft' check (status in ('draft', 'locked')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, version)
);

create index prd_snapshots_project_idx on public.prd_snapshots(project_id);

create table public.app_builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_label text not null,
  app_url text not null,
  repository_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create index app_builds_project_idx on public.app_builds(project_id);

create table public.feedback_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('creator_test', 'user_test', 'observation', 'next_iteration')),
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index feedback_entries_project_idx on public.feedback_entries(project_id);

create table public.journal_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null check (version > 0),
  markdown_content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, version)
);

create index journal_snapshots_project_idx on public.journal_snapshots(project_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger phase_entries_set_updated_at
before update on public.phase_entries
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function private.owns_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and owner_id = (select auth.uid())
  );
$$;

revoke all on function private.owns_project(uuid) from public;
grant execute on function private.owns_project(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.phase_entries enable row level security;
alter table public.decisions enable row level security;
alter table public.prd_snapshots enable row level security;
alter table public.app_builds enable row level security;
alter table public.feedback_entries enable row level security;
alter table public.journal_snapshots enable row level security;

create policy "profiles_select_own"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "projects_select_own"
on public.projects for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "projects_insert_own"
on public.projects for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "projects_update_own"
on public.projects for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "projects_delete_own"
on public.projects for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "phase_entries_select_own_project"
on public.phase_entries for select to authenticated
using ((select private.owns_project(project_id)));

create policy "phase_entries_insert_own_project"
on public.phase_entries for insert to authenticated
with check ((select private.owns_project(project_id)));

create policy "phase_entries_update_own_project"
on public.phase_entries for update to authenticated
using ((select private.owns_project(project_id)))
with check ((select private.owns_project(project_id)));

create policy "phase_entries_delete_own_project"
on public.phase_entries for delete to authenticated
using ((select private.owns_project(project_id)));

create policy "decisions_select_own_project"
on public.decisions for select to authenticated
using ((select private.owns_project(project_id)));

create policy "decisions_insert_own_project"
on public.decisions for insert to authenticated
with check ((select private.owns_project(project_id)));

create policy "decisions_update_own_project"
on public.decisions for update to authenticated
using ((select private.owns_project(project_id)))
with check ((select private.owns_project(project_id)));

create policy "decisions_delete_own_project"
on public.decisions for delete to authenticated
using ((select private.owns_project(project_id)));

create policy "prd_snapshots_select_own_project"
on public.prd_snapshots for select to authenticated
using ((select private.owns_project(project_id)));

create policy "prd_snapshots_insert_own_project"
on public.prd_snapshots for insert to authenticated
with check ((select private.owns_project(project_id)));

create policy "prd_snapshots_update_own_project"
on public.prd_snapshots for update to authenticated
using ((select private.owns_project(project_id)))
with check ((select private.owns_project(project_id)));

create policy "prd_snapshots_delete_own_project"
on public.prd_snapshots for delete to authenticated
using ((select private.owns_project(project_id)));

create policy "app_builds_select_own_project"
on public.app_builds for select to authenticated
using ((select private.owns_project(project_id)));

create policy "app_builds_insert_own_project"
on public.app_builds for insert to authenticated
with check ((select private.owns_project(project_id)));

create policy "app_builds_update_own_project"
on public.app_builds for update to authenticated
using ((select private.owns_project(project_id)))
with check ((select private.owns_project(project_id)));

create policy "app_builds_delete_own_project"
on public.app_builds for delete to authenticated
using ((select private.owns_project(project_id)));

create policy "feedback_entries_select_own_project"
on public.feedback_entries for select to authenticated
using ((select private.owns_project(project_id)));

create policy "feedback_entries_insert_own_project"
on public.feedback_entries for insert to authenticated
with check ((select private.owns_project(project_id)));

create policy "feedback_entries_update_own_project"
on public.feedback_entries for update to authenticated
using ((select private.owns_project(project_id)))
with check ((select private.owns_project(project_id)));

create policy "feedback_entries_delete_own_project"
on public.feedback_entries for delete to authenticated
using ((select private.owns_project(project_id)));

create policy "journal_snapshots_select_own_project"
on public.journal_snapshots for select to authenticated
using ((select private.owns_project(project_id)));

create policy "journal_snapshots_insert_own_project"
on public.journal_snapshots for insert to authenticated
with check ((select private.owns_project(project_id)));

create policy "journal_snapshots_update_own_project"
on public.journal_snapshots for update to authenticated
using ((select private.owns_project(project_id)))
with check ((select private.owns_project(project_id)));

create policy "journal_snapshots_delete_own_project"
on public.journal_snapshots for delete to authenticated
using ((select private.owns_project(project_id)));

