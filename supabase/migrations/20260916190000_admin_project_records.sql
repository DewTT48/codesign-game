create table if not exists private.admin_project_access_events (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  accessed_at timestamptz not null default timezone('utc', now())
);

alter table private.admin_project_access_events enable row level security;

create index if not exists admin_project_access_events_admin_idx
  on private.admin_project_access_events (admin_id, accessed_at desc);

create index if not exists admin_project_access_events_project_idx
  on private.admin_project_access_events (project_id, accessed_at desc);

revoke all on table private.admin_project_access_events
from public, anon, authenticated;

create or replace function public.get_admin_projects(
  search_text text default null,
  mode_filter text default null,
  status_filter text default null,
  page_limit integer default 100,
  page_offset integer default 0
)
returns table (
  project_id uuid,
  owner_id uuid,
  owner_email text,
  owner_display_name text,
  mode text,
  title text,
  topic text,
  content_readiness text,
  project_status text,
  current_phase text,
  solidification_stage text,
  phase_entry_count bigint,
  locked_phase_count bigint,
  decision_count bigint,
  ai_status text,
  created_at timestamptz,
  updated_at timestamptz,
  completed_at timestamptz,
  latest_activity_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin((select auth.uid())) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if mode_filter is not null and mode_filter not in ('guided', 'own') then
    raise exception 'Unsupported project mode filter';
  end if;

  if status_filter is not null and status_filter not in ('in_progress', 'completed', 'archived') then
    raise exception 'Unsupported project status filter';
  end if;

  return query
  select
    project.id,
    project.owner_id,
    profile.email,
    profile.display_name,
    project.mode,
    project.title,
    project.topic,
    project.content_readiness,
    project.status,
    project.current_phase,
    project.solidification_stage,
    coalesce(entry_stats.entry_count, 0),
    coalesce(entry_stats.locked_phase_count, 0),
    coalesce(decision_stats.decision_count, 0),
    coalesce(budget.status, 'not_configured'),
    project.created_at,
    project.updated_at,
    project.completed_at,
    greatest(
      project.updated_at,
      coalesce(entry_stats.latest_entry_at, project.updated_at),
      coalesce(decision_stats.latest_decision_at, project.updated_at)
    )
  from public.projects as project
  join public.profiles as profile on profile.id = project.owner_id
  left join lateral (
    select
      count(*) filter (where entry.is_current) as entry_count,
      count(distinct entry.phase) filter (
        where entry.is_current and entry.status = 'locked' and entry.phase <> 'SETUP'
      ) as locked_phase_count,
      max(entry.updated_at) as latest_entry_at
    from public.phase_entries as entry
    where entry.project_id = project.id
  ) as entry_stats on true
  left join lateral (
    select
      count(*) as decision_count,
      max(decision.created_at) as latest_decision_at
    from public.decisions as decision
    where decision.project_id = project.id
  ) as decision_stats on true
  left join public.ai_project_budgets as budget on budget.project_id = project.id
  where (mode_filter is null or project.mode = mode_filter)
    and (status_filter is null or project.status = status_filter)
    and (
      search_text is null
      or btrim(search_text) = ''
      or lower(project.title) like '%' || lower(btrim(search_text)) || '%'
      or lower(project.topic) like '%' || lower(btrim(search_text)) || '%'
      or lower(coalesce(profile.email, '')) like '%' || lower(btrim(search_text)) || '%'
      or lower(coalesce(profile.display_name, '')) like '%' || lower(btrim(search_text)) || '%'
      or project.id::text = lower(btrim(search_text))
    )
  order by greatest(
    project.updated_at,
    coalesce(entry_stats.latest_entry_at, project.updated_at),
    coalesce(decision_stats.latest_decision_at, project.updated_at)
  ) desc
  limit least(greatest(coalesce(page_limit, 100), 1), 200)
  offset greatest(coalesce(page_offset, 0), 0);
end;
$$;

revoke all on function public.get_admin_projects(text, text, text, integer, integer)
from public, anon;
grant execute on function public.get_admin_projects(text, text, text, integer, integer)
to authenticated;

create or replace function public.get_admin_project_record(target_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_payload jsonb;
  access_time timestamptz := timezone('utc', now());
begin
  if not private.is_admin((select auth.uid())) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'project', to_jsonb(project),
    'owner', jsonb_build_object(
      'id', profile.id,
      'email', profile.email,
      'display_name', profile.display_name,
      'created_at', profile.created_at
    ),
    'phase_entries', coalesce((
      select jsonb_agg(to_jsonb(entry) order by entry.phase, entry.field_key, entry.version desc)
      from public.phase_entries as entry
      where entry.project_id = project.id
    ), '[]'::jsonb),
    'decisions', coalesce((
      select jsonb_agg(to_jsonb(decision) order by decision.phase, decision.decision_type, decision.version desc)
      from public.decisions as decision
      where decision.project_id = project.id
    ), '[]'::jsonb),
    'prd_snapshots', coalesce((
      select jsonb_agg(to_jsonb(snapshot) order by snapshot.version desc)
      from public.prd_snapshots as snapshot
      where snapshot.project_id = project.id
    ), '[]'::jsonb),
    'app_builds', coalesce((
      select jsonb_agg(to_jsonb(build) order by build.created_at desc)
      from public.app_builds as build
      where build.project_id = project.id
    ), '[]'::jsonb),
    'feedback_entries', coalesce((
      select jsonb_agg(to_jsonb(feedback) order by feedback.created_at desc)
      from public.feedback_entries as feedback
      where feedback.project_id = project.id
    ), '[]'::jsonb),
    'ai_budget', (
      select to_jsonb(budget)
      from public.ai_project_budgets as budget
      where budget.project_id = project.id
    ),
    'ai_requests', coalesce((
      select jsonb_agg(to_jsonb(request) order by request.created_at desc)
      from public.ai_requests as request
      where request.project_id = project.id
    ), '[]'::jsonb),
    'ai_proposals', coalesce((
      select jsonb_agg(to_jsonb(proposal) order by proposal.created_at desc)
      from public.ai_proposals as proposal
      where proposal.project_id = project.id
    ), '[]'::jsonb),
    'accessed_at', access_time
  )
  into record_payload
  from public.projects as project
  join public.profiles as profile on profile.id = project.owner_id
  where project.id = target_project_id;

  if record_payload is null then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;

  insert into private.admin_project_access_events (admin_id, project_id, accessed_at)
  values ((select auth.uid()), target_project_id, access_time);

  return record_payload;
end;
$$;

revoke all on function public.get_admin_project_record(uuid)
from public, anon;
grant execute on function public.get_admin_project_record(uuid)
to authenticated;
