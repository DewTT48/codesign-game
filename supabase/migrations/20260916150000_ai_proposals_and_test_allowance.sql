create table public.ai_proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.ai_requests(id) on delete cascade,
  project_id uuid not null,
  owner_id uuid not null,
  action text not null check (
    action in (
      'frame_context',
      'generate_options',
      'challenge_assumptions',
      'check_alignment',
      'draft_prd'
    )
  ),
  envelope jsonb not null,
  openai_response_id text not null unique,
  usage jsonb not null,
  actual_cost_micros bigint not null check (actual_cost_micros >= 0),
  pricing_version text not null,
  review_status text not null default 'proposed'
    check (review_status in ('proposed', 'accepted', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_proposals_budget_owner_fk
    foreign key (project_id, owner_id)
    references public.ai_project_budgets(project_id, owner_id)
    on delete cascade,
  constraint ai_proposals_envelope_contract check (
    envelope ->> 'action' = action
    and envelope ->> 'decision_status' = 'proposed'
    and jsonb_typeof(envelope -> 'proposal') = 'object'
    and jsonb_typeof(envelope -> 'questions') = 'array'
    and jsonb_typeof(envelope -> 'warnings') = 'array'
    and jsonb_typeof(envelope -> 'consistency') = 'object'
  ),
  constraint ai_proposals_review_state check (
    (review_status = 'proposed' and reviewed_at is null)
    or (review_status in ('accepted', 'rejected') and reviewed_at is not null)
  )
);

create index ai_proposals_project_created_idx
  on public.ai_proposals(project_id, created_at desc);
create index ai_proposals_owner_created_idx
  on public.ai_proposals(owner_id, created_at desc);

create trigger ai_proposals_set_updated_at
before update on public.ai_proposals
for each row execute function public.set_updated_at();

alter table public.ai_proposals enable row level security;

create policy "ai_proposals_select_own_or_admin"
on public.ai_proposals for select to authenticated
using (
  (select auth.uid()) = owner_id
  or (select public.current_user_is_admin())
);

revoke all on table public.ai_proposals
from public, anon, authenticated, service_role;
grant select on table public.ai_proposals to authenticated, service_role;

create or replace function public.store_ai_proposal(
  target_request_id uuid,
  target_openai_response_id text,
  target_envelope jsonb,
  target_usage jsonb,
  target_actual_cost_micros bigint,
  target_pricing_version text
)
returns public.ai_proposals
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_request public.ai_requests;
  existing_proposal public.ai_proposals;
  stored_proposal public.ai_proposals;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  select *
    into source_request
    from public.ai_requests
   where id = target_request_id
   for update;

  if not found then
    raise exception 'AI request not found';
  end if;

  if source_request.status not in ('in_progress', 'completed') then
    raise exception 'AI proposal requires an active or completed request';
  end if;

  if char_length(btrim(coalesce(target_openai_response_id, ''))) = 0
     or char_length(btrim(coalesce(target_pricing_version, ''))) = 0
     or target_actual_cost_micros is null
     or target_actual_cost_micros < 0 then
    raise exception 'AI proposal metadata is invalid';
  end if;

  if target_envelope ->> 'action' <> source_request.action
     or target_envelope ->> 'decision_status' <> 'proposed'
     or jsonb_typeof(target_envelope -> 'proposal') <> 'object'
     or jsonb_typeof(target_envelope -> 'questions') <> 'array'
     or jsonb_typeof(target_envelope -> 'warnings') <> 'array'
     or jsonb_typeof(target_envelope -> 'consistency') <> 'object'
     or jsonb_typeof(target_usage) <> 'object' then
    raise exception 'AI proposal payload is invalid';
  end if;

  select *
    into existing_proposal
    from public.ai_proposals
   where request_id = source_request.id;

  if found then
    if existing_proposal.openai_response_id <> btrim(target_openai_response_id)
       or existing_proposal.envelope <> target_envelope
       or existing_proposal.usage <> target_usage
       or existing_proposal.actual_cost_micros <> target_actual_cost_micros
       or existing_proposal.pricing_version <> btrim(target_pricing_version) then
      raise exception 'AI request already has a different proposal';
    end if;

    return existing_proposal;
  end if;

  insert into public.ai_proposals (
    request_id,
    project_id,
    owner_id,
    action,
    envelope,
    openai_response_id,
    usage,
    actual_cost_micros,
    pricing_version
  )
  values (
    source_request.id,
    source_request.project_id,
    source_request.owner_id,
    source_request.action,
    target_envelope,
    btrim(target_openai_response_id),
    target_usage,
    target_actual_cost_micros,
    btrim(target_pricing_version)
  )
  returning * into stored_proposal;

  return stored_proposal;
end;
$$;

create or replace function public.admin_enable_ai_test_allowance(
  target_project_id uuid
)
returns public.ai_project_budgets
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project public.projects;
  current_budget public.ai_project_budgets;
  configured_budget public.ai_project_budgets;
begin
  if not private.is_admin((select auth.uid())) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select *
    into target_project
    from public.projects
   where id = target_project_id;

  if not found
     or target_project.mode <> 'own'
     or target_project.status = 'archived' then
    raise exception 'Active own-mode Project required';
  end if;

  select *
    into current_budget
    from public.ai_project_budgets
   where project_id = target_project.id
   for update;

  if found and (
    current_budget.used_requests + current_budget.reserved_requests > 5
    or current_budget.used_input_tokens + current_budget.reserved_input_tokens > 100000
    or current_budget.used_output_tokens + current_budget.reserved_output_tokens > 40000
    or current_budget.used_input_tokens + current_budget.used_output_tokens
       + current_budget.reserved_input_tokens + current_budget.reserved_output_tokens > 140000
    or current_budget.used_cost_micros + current_budget.reserved_cost_micros > 1000000
  ) then
    raise exception 'Existing AI usage exceeds the internal test allowance';
  end if;

  insert into public.ai_project_budgets (
    project_id,
    owner_id,
    status,
    max_requests,
    max_input_tokens,
    max_output_tokens,
    max_total_tokens,
    max_cost_micros,
    configured_by,
    configured_at
  )
  values (
    target_project.id,
    target_project.owner_id,
    'enabled',
    5,
    100000,
    40000,
    140000,
    1000000,
    (select auth.uid()),
    timezone('utc', now())
  )
  on conflict (project_id) do update
  set owner_id = excluded.owner_id,
      status = 'enabled',
      max_requests = excluded.max_requests,
      max_input_tokens = excluded.max_input_tokens,
      max_output_tokens = excluded.max_output_tokens,
      max_total_tokens = excluded.max_total_tokens,
      max_cost_micros = excluded.max_cost_micros,
      limit_version = public.ai_project_budgets.limit_version + 1,
      configured_by = excluded.configured_by,
      configured_at = excluded.configured_at
  returning * into configured_budget;

  return configured_budget;
end;
$$;

revoke all on function public.store_ai_proposal(uuid, text, jsonb, jsonb, bigint, text)
from public, anon, authenticated;
grant execute on function public.store_ai_proposal(uuid, text, jsonb, jsonb, bigint, text)
to service_role;

revoke all on function public.admin_enable_ai_test_allowance(uuid)
from public, anon;
grant execute on function public.admin_enable_ai_test_allowance(uuid)
to authenticated;
