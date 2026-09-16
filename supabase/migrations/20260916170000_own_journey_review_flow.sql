alter table public.ai_proposals
  add column if not exists review_content jsonb;

alter table public.ai_proposals
  drop constraint if exists ai_proposals_review_state;

alter table public.ai_proposals
  add constraint ai_proposals_review_state check (
    (
      review_status = 'proposed'
      and reviewed_at is null
      and review_content is null
    )
    or (
      review_status = 'rejected'
      and reviewed_at is not null
      and review_content is null
    )
    or (
      review_status = 'accepted'
      and reviewed_at is not null
      and jsonb_typeof(review_content) = 'object'
    )
  );

create or replace function public.review_ai_proposal(
  target_proposal_id uuid,
  target_review_action text,
  target_review_content jsonb default null
)
returns public.ai_proposals
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_proposal public.ai_proposals;
  reviewed_proposal public.ai_proposals;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if target_review_action not in ('accepted', 'rejected') then
    raise exception 'Unsupported AI proposal review action';
  end if;

  select *
    into current_proposal
    from public.ai_proposals
   where id = target_proposal_id
   for update;

  if not found or current_proposal.owner_id <> (select auth.uid()) then
    raise exception 'AI proposal access denied' using errcode = '42501';
  end if;

  if current_proposal.review_status <> 'proposed' then
    if current_proposal.review_status = target_review_action
       and current_proposal.review_content is not distinct from target_review_content then
      return current_proposal;
    end if;
    raise exception 'AI proposal has already been reviewed';
  end if;

  if target_review_action = 'accepted'
     and (
       target_review_content is null
       or jsonb_typeof(target_review_content) <> 'object'
     ) then
    raise exception 'Accepted AI proposal requires reviewed content';
  end if;

  if target_review_action = 'rejected' and target_review_content is not null then
    raise exception 'Rejected AI proposal cannot keep reviewed content';
  end if;

  update public.ai_proposals
     set review_status = target_review_action,
         review_content = target_review_content,
         reviewed_at = timezone('utc', now())
   where id = current_proposal.id
  returning * into reviewed_proposal;

  return reviewed_proposal;
end;
$$;

revoke all on function public.review_ai_proposal(uuid, text, jsonb)
from public, anon;
grant execute on function public.review_ai_proposal(uuid, text, jsonb)
to authenticated;

create or replace function public.complete_own_phase(
  target_project_id uuid,
  target_phase text
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_project public.projects;
  next_project public.projects;
  phase_content jsonb;
  next_phase text;
  next_stage text;
begin
  select *
    into current_project
    from public.projects
   where id = target_project_id
   for update;

  if not found or not (select private.owns_project(target_project_id)) then
    raise exception 'Project access denied';
  end if;

  if current_project.mode <> 'own' then
    raise exception 'Own Journey requires an own-mode Project';
  end if;

  if current_project.status = 'archived' then
    raise exception 'Archived Project cannot continue';
  end if;

  if target_phase not in ('C', 'O', 'D', 'E', 'S', 'PRD') then
    raise exception 'Unsupported Own Journey phase %', target_phase;
  end if;

  if current_project.current_phase <> target_phase then
    raise exception 'Phase % is not currently active', target_phase;
  end if;

  select jsonb_object_agg(entry.field_key, entry.content order by entry.field_key)
    into phase_content
    from public.phase_entries as entry
   where entry.project_id = target_project_id
     and entry.phase = target_phase
     and entry.is_current;

  if phase_content is null or phase_content = '{}'::jsonb then
    raise exception 'Phase has no captured entries';
  end if;

  perform public.revise_decision(
    target_project_id,
    target_phase,
    'own_phase_summary',
    phase_content,
    null
  );

  update public.phase_entries
     set status = 'locked'
   where project_id = target_project_id
     and phase = target_phase
     and is_current;

  next_phase := case target_phase
    when 'C' then 'O'
    when 'O' then 'D'
    when 'D' then 'E'
    when 'E' then 'S'
    when 'S' then 'PRD'
    when 'PRD' then 'COMPLETE'
    else null
  end;

  next_stage := case target_phase
    when 'C' then 'UNDERSTOOD'
    when 'D' then 'EXPLORED'
    when 'E' then 'DECIDED'
    when 'S' then 'SOLID'
    when 'PRD' then 'BUILD_READY'
    else current_project.solidification_stage
  end;

  update public.projects
     set current_phase = next_phase,
         solidification_stage = next_stage,
         status = case when next_phase = 'COMPLETE' then 'completed' else 'in_progress' end,
         completed_at = case
           when next_phase = 'COMPLETE' then timezone('utc', now())
           else null
         end
   where id = target_project_id
  returning * into next_project;

  return next_project;
end;
$$;

revoke all on function public.complete_own_phase(uuid, text)
from public, anon;
grant execute on function public.complete_own_phase(uuid, text)
to authenticated;

create or replace function public.get_admin_own_projects()
returns table (
  project_id uuid,
  owner_id uuid,
  owner_email text,
  owner_display_name text,
  title text,
  project_status text,
  current_phase text,
  ai_status text,
  used_requests integer,
  max_requests integer,
  used_cost_micros bigint,
  max_cost_micros bigint,
  updated_at timestamptz
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

  return query
  select
    project.id,
    project.owner_id,
    profile.email,
    profile.display_name,
    project.title,
    project.status,
    project.current_phase,
    coalesce(budget.status, 'not_configured'),
    coalesce(budget.used_requests, 0),
    budget.max_requests,
    coalesce(budget.used_cost_micros, 0),
    budget.max_cost_micros,
    project.updated_at
  from public.projects as project
  join public.profiles as profile on profile.id = project.owner_id
  left join public.ai_project_budgets as budget on budget.project_id = project.id
  where project.mode = 'own'
  order by project.updated_at desc;
end;
$$;

revoke all on function public.get_admin_own_projects()
from public, anon;
grant execute on function public.get_admin_own_projects()
to authenticated;
