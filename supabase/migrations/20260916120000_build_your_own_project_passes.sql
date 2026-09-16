create table public.project_passes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('course', 'stripe', 'admin')),
  status text not null default 'available'
    check (status in ('available', 'consumed', 'revoked')),
  grant_key text not null unique,
  granted_by uuid references auth.users(id) on delete set null,
  project_id uuid unique references public.projects(id) on delete set null,
  consume_key text,
  note text,
  granted_at timestamptz not null default timezone('utc', now()),
  consumed_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_passes_owner_consume_key_unique
    unique (owner_id, consume_key),
  constraint project_passes_grant_key_not_blank
    check (char_length(btrim(grant_key)) >= 8),
  constraint project_passes_state_is_consistent check (
    (
      status = 'available'
      and project_id is null
      and consume_key is null
      and consumed_at is null
      and revoked_at is null
    )
    or (
      status = 'consumed'
      and consume_key is not null
      and consumed_at is not null
      and revoked_at is null
    )
    or (
      status = 'revoked'
      and project_id is null
      and consume_key is null
      and consumed_at is null
      and revoked_at is not null
    )
  )
);

create index project_passes_owner_status_idx
  on public.project_passes(owner_id, status, granted_at);

create table public.project_pass_events (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid not null references public.project_passes(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('granted', 'consumed', 'revoked', 'restored')),
  project_id uuid references public.projects(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index project_pass_events_pass_created_idx
  on public.project_pass_events(pass_id, created_at);
create index project_pass_events_owner_created_idx
  on public.project_pass_events(owner_id, created_at desc);

create trigger project_passes_set_updated_at
before update on public.project_passes
for each row execute function public.set_updated_at();

alter table public.project_passes enable row level security;
alter table public.project_pass_events enable row level security;

create policy "project_passes_select_own_or_admin"
on public.project_passes for select to authenticated
using (
  (select auth.uid()) = owner_id
  or (select public.current_user_is_admin())
);

create policy "project_pass_events_select_own_or_admin"
on public.project_pass_events for select to authenticated
using (
  (select auth.uid()) = owner_id
  or (select public.current_user_is_admin())
);

-- The earlier default privilege grants are intentionally narrowed for Pass data.
-- Authenticated users can read rows allowed by RLS, but every state transition must
-- go through a reviewed RPC. Service-role access remains available to future Edge
-- Functions and is never exposed to the browser.
revoke all on table public.project_passes, public.project_pass_events
from public, anon, authenticated;
grant select on table public.project_passes, public.project_pass_events
to authenticated;

create or replace function public.get_my_project_passes()
returns setof public.project_passes
language sql
stable
security invoker
set search_path = ''
as $$
  select project_pass.*
  from public.project_passes as project_pass
  where project_pass.owner_id = (select auth.uid())
  order by project_pass.granted_at, project_pass.id;
$$;

create or replace function public.admin_grant_project_pass(
  target_user_id uuid,
  target_source text,
  target_grant_key text,
  target_note text default null
)
returns public.project_passes
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_pass public.project_passes;
  granted_pass public.project_passes;
begin
  if not private.is_admin((select auth.uid())) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  -- Stripe grants belong to the webhook path so a browser or admin form cannot
  -- manufacture a paid entitlement. Phase 1 supports course and admin grants.
  if target_source is null or target_source not in ('course', 'admin') then
    raise exception 'Unsupported manual Project Pass source';
  end if;

  if char_length(btrim(coalesce(target_grant_key, ''))) < 8 then
    raise exception 'A stable grant key is required';
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'Project Pass owner does not exist';
  end if;

  insert into public.project_passes (
    owner_id,
    source,
    grant_key,
    granted_by,
    note
  )
  values (
    target_user_id,
    target_source,
    btrim(target_grant_key),
    (select auth.uid()),
    nullif(btrim(target_note), '')
  )
  on conflict (grant_key) do nothing
  returning * into granted_pass;

  if not found then
    select *
      into existing_pass
      from public.project_passes
     where grant_key = btrim(target_grant_key);

    if existing_pass.owner_id <> target_user_id
       or existing_pass.source <> target_source then
      raise exception 'Grant key is already used by another Project Pass';
    end if;

    return existing_pass;
  end if;

  insert into public.project_pass_events (
    pass_id,
    owner_id,
    event_type,
    actor_id,
    reason,
    metadata
  )
  values (
    granted_pass.id,
    granted_pass.owner_id,
    'granted',
    (select auth.uid()),
    granted_pass.note,
    jsonb_build_object('source', granted_pass.source, 'grant_key', granted_pass.grant_key)
  );

  return granted_pass;
end;
$$;

create or replace function public.admin_revoke_project_pass(
  target_pass_id uuid,
  target_reason text
)
returns public.project_passes
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_pass public.project_passes;
  revoked_pass public.project_passes;
begin
  if not private.is_admin((select auth.uid())) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(target_reason, ''))) < 3 then
    raise exception 'A revoke reason is required';
  end if;

  select *
    into current_pass
    from public.project_passes
   where id = target_pass_id
   for update;

  if not found then
    raise exception 'Project Pass not found';
  end if;

  if current_pass.status <> 'available' then
    raise exception 'Only an available Project Pass can be revoked';
  end if;

  update public.project_passes
     set status = 'revoked',
         revoked_at = timezone('utc', now())
   where id = current_pass.id
  returning * into revoked_pass;

  insert into public.project_pass_events (
    pass_id,
    owner_id,
    event_type,
    actor_id,
    reason
  )
  values (
    revoked_pass.id,
    revoked_pass.owner_id,
    'revoked',
    (select auth.uid()),
    btrim(target_reason)
  );

  return revoked_pass;
end;
$$;

create or replace function public.admin_restore_project_pass(
  target_pass_id uuid,
  target_reason text
)
returns public.project_passes
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_pass public.project_passes;
  restored_pass public.project_passes;
begin
  if not private.is_admin((select auth.uid())) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(target_reason, ''))) < 3 then
    raise exception 'A restore reason is required';
  end if;

  select *
    into current_pass
    from public.project_passes
   where id = target_pass_id
   for update;

  if not found then
    raise exception 'Project Pass not found';
  end if;

  if current_pass.status <> 'revoked' then
    raise exception 'Only a revoked Project Pass can be restored';
  end if;

  update public.project_passes
     set status = 'available',
         revoked_at = null
   where id = current_pass.id
  returning * into restored_pass;

  insert into public.project_pass_events (
    pass_id,
    owner_id,
    event_type,
    actor_id,
    reason
  )
  values (
    restored_pass.id,
    restored_pass.owner_id,
    'restored',
    (select auth.uid()),
    btrim(target_reason)
  );

  return restored_pass;
end;
$$;

create or replace function public.create_own_project_with_pass(
  target_title text,
  target_topic text,
  target_creation_key text
)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  available_pass public.project_passes;
  consumed_pass public.project_passes;
  created_project public.projects;
begin
  if current_user_id is null then
    raise exception 'Sign in is required' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(target_title, ''))) < 2
     or char_length(btrim(target_title)) > 120 then
    raise exception 'Project title must contain 2 to 120 characters';
  end if;

  if char_length(btrim(coalesce(target_topic, ''))) < 2
     or char_length(btrim(target_topic)) > 80 then
    raise exception 'Project topic must contain 2 to 80 characters';
  end if;

  if char_length(btrim(coalesce(target_creation_key, ''))) < 8
     or char_length(btrim(target_creation_key)) > 200 then
    raise exception 'A valid project creation key is required';
  end if;

  -- A client retry with the same key returns the original project without using
  -- another Pass. The key remains on a consumed Pass even if its Project is later
  -- deleted, so a retry can never turn deletion into an automatic refund.
  select *
    into consumed_pass
    from public.project_passes
   where owner_id = current_user_id
     and consume_key = btrim(target_creation_key)
   for update;

  if found then
    if consumed_pass.project_id is null then
      raise exception 'This project creation was already completed and its Project was deleted';
    end if;

    select *
      into created_project
      from public.projects
     where id = consumed_pass.project_id
       and owner_id = current_user_id;

    if not found then
      raise exception 'The Project created by this request is unavailable';
    end if;

    return created_project;
  end if;

  select *
    into available_pass
    from public.project_passes
   where owner_id = current_user_id
     and status = 'available'
   order by granted_at, id
   for update skip locked
   limit 1;

  if not found then
    raise exception 'An available Project Pass is required';
  end if;

  insert into public.projects (
    owner_id,
    mode,
    title,
    topic,
    content_readiness
  )
  values (
    current_user_id,
    'own',
    btrim(target_title),
    btrim(target_topic),
    'idea'
  )
  returning * into created_project;

  update public.project_passes
     set status = 'consumed',
         project_id = created_project.id,
         consume_key = btrim(target_creation_key),
         consumed_at = timezone('utc', now())
   where id = available_pass.id;

  insert into public.project_pass_events (
    pass_id,
    owner_id,
    event_type,
    project_id,
    actor_id
  )
  values (
    available_pass.id,
    current_user_id,
    'consumed',
    created_project.id,
    current_user_id
  );

  return created_project;
end;
$$;

-- Keep the existing Guided creation flow unchanged, while preventing a browser
-- insert from selecting mode = 'own' and bypassing Project Pass consumption.
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_guided_own"
on public.projects for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and mode = 'guided'
);

revoke all on function public.get_my_project_passes() from public, anon;
revoke all on function public.admin_grant_project_pass(uuid, text, text, text) from public, anon;
revoke all on function public.admin_revoke_project_pass(uuid, text) from public, anon;
revoke all on function public.admin_restore_project_pass(uuid, text) from public, anon;
revoke all on function public.create_own_project_with_pass(text, text, text) from public, anon;

grant execute on function public.get_my_project_passes() to authenticated;
grant execute on function public.admin_grant_project_pass(uuid, text, text, text) to authenticated;
grant execute on function public.admin_revoke_project_pass(uuid, text) to authenticated;
grant execute on function public.admin_restore_project_pass(uuid, text) to authenticated;
grant execute on function public.create_own_project_with_pass(text, text, text) to authenticated;
