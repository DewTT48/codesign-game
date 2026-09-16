create table public.ai_project_budgets (
  project_id uuid primary key references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'disabled'
    check (status in ('disabled', 'enabled', 'exhausted')),
  max_requests integer,
  max_input_tokens bigint,
  max_output_tokens bigint,
  max_total_tokens bigint,
  max_cost_micros bigint,
  reserved_requests integer not null default 0,
  used_requests integer not null default 0,
  reserved_input_tokens bigint not null default 0,
  used_input_tokens bigint not null default 0,
  reserved_output_tokens bigint not null default 0,
  used_output_tokens bigint not null default 0,
  reserved_cost_micros bigint not null default 0,
  used_cost_micros bigint not null default 0,
  limit_version integer not null default 1,
  configured_by uuid references auth.users(id) on delete set null,
  configured_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_project_budgets_project_owner_unique unique (project_id, owner_id),
  constraint ai_project_budgets_configured_limits check (
    status = 'disabled'
    or (
      max_requests > 0
      and max_input_tokens > 0
      and max_output_tokens > 0
      and max_total_tokens > 0
      and max_cost_micros > 0
      and configured_at is not null
    )
  ),
  constraint ai_project_budgets_nonnegative_usage check (
    reserved_requests >= 0
    and used_requests >= 0
    and reserved_input_tokens >= 0
    and used_input_tokens >= 0
    and reserved_output_tokens >= 0
    and used_output_tokens >= 0
    and reserved_cost_micros >= 0
    and used_cost_micros >= 0
    and limit_version > 0
  )
);

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
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
  model text not null default 'gpt-5.6-sol'
    check (model = 'gpt-5.6-sol'),
  reasoning_effort text not null
    check (reasoning_effort in ('low', 'medium', 'high', 'xhigh')),
  status text not null default 'reserved'
    check (status in ('reserved', 'in_progress', 'completed', 'failed', 'cancelled')),
  idempotency_key text not null,
  prompt_template_version text not null,
  output_schema_version text not null,
  estimated_input_tokens bigint not null check (estimated_input_tokens >= 0),
  reserved_output_tokens bigint not null check (reserved_output_tokens > 0),
  reserved_cost_micros bigint not null check (reserved_cost_micros >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  cached_input_tokens bigint not null default 0 check (cached_input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  reasoning_tokens bigint not null default 0 check (reasoning_tokens >= 0),
  total_tokens bigint generated always as (input_tokens + output_tokens) stored,
  actual_cost_micros bigint not null default 0 check (actual_cost_micros >= 0),
  openai_response_id text unique,
  error_code text,
  reservation_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_requests_budget_owner_fk
    foreign key (project_id, owner_id)
    references public.ai_project_budgets(project_id, owner_id)
    on delete cascade,
  constraint ai_requests_idempotency_unique
    unique (project_id, owner_id, idempotency_key),
  constraint ai_requests_versions_not_blank check (
    char_length(btrim(prompt_template_version)) > 0
    and char_length(btrim(output_schema_version)) > 0
    and char_length(btrim(idempotency_key)) >= 8
  ),
  constraint ai_requests_usage_breakdown check (
    cached_input_tokens <= input_tokens
    and reasoning_tokens <= output_tokens
  )
);

create unique index ai_requests_one_active_per_project_idx
  on public.ai_requests(project_id)
  where status in ('reserved', 'in_progress');
create index ai_requests_owner_created_idx
  on public.ai_requests(owner_id, created_at desc);
create index ai_requests_project_created_idx
  on public.ai_requests(project_id, created_at desc);

create trigger ai_project_budgets_set_updated_at
before update on public.ai_project_budgets
for each row execute function public.set_updated_at();

create trigger ai_requests_set_updated_at
before update on public.ai_requests
for each row execute function public.set_updated_at();

create or replace function private.validate_ai_budget_project_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.projects
    where id = new.project_id
      and owner_id = new.owner_id
      and mode = 'own'
  ) then
    raise exception 'AI budget requires an own-mode Project and its owner';
  end if;

  return new;
end;
$$;

create trigger ai_project_budgets_validate_project_owner
before insert or update of project_id, owner_id on public.ai_project_budgets
for each row execute function private.validate_ai_budget_project_owner();

revoke all on function private.validate_ai_budget_project_owner() from public, anon, authenticated;

create or replace function private.ai_reasoning_effort(target_action text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case target_action
    when 'frame_context' then 'medium'
    when 'generate_options' then 'medium'
    when 'challenge_assumptions' then 'high'
    when 'check_alignment' then 'high'
    when 'draft_prd' then 'xhigh'
    else null
  end;
$$;

revoke all on function private.ai_reasoning_effort(text) from public, anon, authenticated;

alter table public.ai_project_budgets enable row level security;
alter table public.ai_requests enable row level security;

create policy "ai_project_budgets_select_own_or_admin"
on public.ai_project_budgets for select to authenticated
using (
  (select auth.uid()) = owner_id
  or (select public.current_user_is_admin())
);

create policy "ai_requests_select_own_or_admin"
on public.ai_requests for select to authenticated
using (
  (select auth.uid()) = owner_id
  or (select public.current_user_is_admin())
);

revoke all on table public.ai_project_budgets, public.ai_requests
from public, anon, authenticated, service_role;
grant select on table public.ai_project_budgets, public.ai_requests
to authenticated;
grant select on table public.ai_project_budgets, public.ai_requests
to service_role;

create or replace function public.get_ai_usage_summary(target_project_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'project_id', budget.project_id,
    'status', budget.status,
    'limit_version', budget.limit_version,
    'max_requests', budget.max_requests,
    'used_requests', budget.used_requests,
    'reserved_requests', budget.reserved_requests,
    'max_input_tokens', budget.max_input_tokens,
    'used_input_tokens', budget.used_input_tokens,
    'reserved_input_tokens', budget.reserved_input_tokens,
    'max_output_tokens', budget.max_output_tokens,
    'used_output_tokens', budget.used_output_tokens,
    'reserved_output_tokens', budget.reserved_output_tokens,
    'max_total_tokens', budget.max_total_tokens,
    'max_cost_micros', budget.max_cost_micros,
    'used_cost_micros', budget.used_cost_micros,
    'reserved_cost_micros', budget.reserved_cost_micros
  )
  from public.ai_project_budgets as budget
  where budget.project_id = target_project_id
    and (
      budget.owner_id = (select auth.uid())
      or (select public.current_user_is_admin())
    );
$$;

create or replace function public.reserve_ai_request(
  target_project_id uuid,
  target_owner_id uuid,
  target_action text,
  target_idempotency_key text,
  target_estimated_input_tokens bigint,
  target_reserved_output_tokens bigint,
  target_reserved_cost_micros bigint,
  target_prompt_template_version text,
  target_output_schema_version text
)
returns public.ai_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_budget public.ai_project_budgets;
  existing_request public.ai_requests;
  stale_reservation public.ai_requests;
  reserved_request public.ai_requests;
  selected_effort text;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  selected_effort := private.ai_reasoning_effort(target_action);
  if selected_effort is null then
    raise exception 'Unsupported AI action';
  end if;

  if char_length(btrim(coalesce(target_idempotency_key, ''))) < 8 then
    raise exception 'A stable AI request key is required';
  end if;

  if target_estimated_input_tokens is null
     or target_reserved_output_tokens is null
     or target_reserved_cost_micros is null
     or target_estimated_input_tokens < 0
     or target_reserved_output_tokens <= 0
     or target_reserved_cost_micros < 0 then
    raise exception 'AI reservation values must be nonnegative';
  end if;

  if char_length(btrim(coalesce(target_prompt_template_version, ''))) = 0
     or char_length(btrim(coalesce(target_output_schema_version, ''))) = 0 then
    raise exception 'AI prompt and output schema versions are required';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = target_project_id
      and owner_id = target_owner_id
      and mode = 'own'
      and status <> 'archived'
  ) then
    raise exception 'Active own-mode Project access required';
  end if;

  select *
    into existing_request
    from public.ai_requests
   where project_id = target_project_id
     and owner_id = target_owner_id
     and idempotency_key = btrim(target_idempotency_key);

  if found then
    if existing_request.action <> target_action
       or existing_request.estimated_input_tokens <> target_estimated_input_tokens
       or existing_request.reserved_output_tokens <> target_reserved_output_tokens
       or existing_request.reserved_cost_micros <> target_reserved_cost_micros
       or existing_request.prompt_template_version <> btrim(target_prompt_template_version)
       or existing_request.output_schema_version <> btrim(target_output_schema_version) then
      raise exception 'AI idempotency key was reused with different request parameters';
    end if;

    return existing_request;
  end if;

  select *
    into current_budget
    from public.ai_project_budgets
   where project_id = target_project_id
     and owner_id = target_owner_id
   for update;

  if not found or current_budget.status = 'disabled' then
    raise exception 'AI allowance is not configured for this Project';
  end if;

  if current_budget.status = 'exhausted' then
    raise exception 'AI allowance is exhausted for this Project';
  end if;

  -- A reservation that never started can be released on the next request. Once
  -- marked in_progress it fails closed and requires explicit reconciliation.
  select *
    into stale_reservation
    from public.ai_requests
   where project_id = target_project_id
     and status = 'reserved'
     and reservation_expires_at <= timezone('utc', now())
   for update;

  if found then
    update public.ai_requests
       set status = 'cancelled',
           error_code = 'reservation_expired',
           completed_at = timezone('utc', now())
     where id = stale_reservation.id;

    update public.ai_project_budgets
       set reserved_requests = greatest(reserved_requests - 1, 0),
           reserved_input_tokens = greatest(
             reserved_input_tokens - stale_reservation.estimated_input_tokens,
             0
           ),
           reserved_output_tokens = greatest(
             reserved_output_tokens - stale_reservation.reserved_output_tokens,
             0
           ),
           reserved_cost_micros = greatest(
             reserved_cost_micros - stale_reservation.reserved_cost_micros,
             0
           )
     where project_id = target_project_id
    returning * into current_budget;
  end if;

  select *
    into existing_request
    from public.ai_requests
   where project_id = target_project_id
     and owner_id = target_owner_id
     and idempotency_key = btrim(target_idempotency_key);

  if found then
    if existing_request.action <> target_action
       or existing_request.estimated_input_tokens <> target_estimated_input_tokens
       or existing_request.reserved_output_tokens <> target_reserved_output_tokens
       or existing_request.reserved_cost_micros <> target_reserved_cost_micros
       or existing_request.prompt_template_version <> btrim(target_prompt_template_version)
       or existing_request.output_schema_version <> btrim(target_output_schema_version) then
      raise exception 'AI idempotency key was reused with different request parameters';
    end if;

    return existing_request;
  end if;

  if exists (
    select 1
    from public.ai_requests
    where project_id = target_project_id
      and status in ('reserved', 'in_progress')
  ) then
    raise exception 'Another AI request is already active for this Project';
  end if;

  if current_budget.used_requests + current_budget.reserved_requests + 1
     > current_budget.max_requests then
    raise exception 'AI request limit reached';
  end if;

  if current_budget.used_input_tokens
       + current_budget.reserved_input_tokens
       + target_estimated_input_tokens
     > current_budget.max_input_tokens then
    raise exception 'AI input token limit reached';
  end if;

  if current_budget.used_output_tokens
       + current_budget.reserved_output_tokens
       + target_reserved_output_tokens
     > current_budget.max_output_tokens then
    raise exception 'AI output token limit reached';
  end if;

  if current_budget.used_input_tokens
       + current_budget.used_output_tokens
       + current_budget.reserved_input_tokens
       + current_budget.reserved_output_tokens
       + target_estimated_input_tokens
       + target_reserved_output_tokens
     > current_budget.max_total_tokens then
    raise exception 'AI total token limit reached';
  end if;

  if current_budget.used_cost_micros
       + current_budget.reserved_cost_micros
       + target_reserved_cost_micros
     > current_budget.max_cost_micros then
    raise exception 'AI cost limit reached';
  end if;

  insert into public.ai_requests (
    project_id,
    owner_id,
    action,
    reasoning_effort,
    idempotency_key,
    prompt_template_version,
    output_schema_version,
    estimated_input_tokens,
    reserved_output_tokens,
    reserved_cost_micros,
    reservation_expires_at
  )
  values (
    target_project_id,
    target_owner_id,
    target_action,
    selected_effort,
    btrim(target_idempotency_key),
    btrim(target_prompt_template_version),
    btrim(target_output_schema_version),
    target_estimated_input_tokens,
    target_reserved_output_tokens,
    target_reserved_cost_micros,
    timezone('utc', now()) + interval '15 minutes'
  )
  returning * into reserved_request;

  update public.ai_project_budgets
     set reserved_requests = reserved_requests + 1,
         reserved_input_tokens = reserved_input_tokens + target_estimated_input_tokens,
         reserved_output_tokens = reserved_output_tokens + target_reserved_output_tokens,
         reserved_cost_micros = reserved_cost_micros + target_reserved_cost_micros
   where project_id = target_project_id;

  return reserved_request;
end;
$$;

create or replace function public.mark_ai_request_started(target_request_id uuid)
returns public.ai_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_request public.ai_requests;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  select *
    into current_request
    from public.ai_requests
   where id = target_request_id
   for update;

  if not found then
    raise exception 'AI request not found';
  end if;

  if current_request.status = 'in_progress' then
    return current_request;
  end if;

  if current_request.status <> 'reserved' then
    raise exception 'Only a reserved AI request can start';
  end if;

  if current_request.reservation_expires_at <= timezone('utc', now()) then
    raise exception 'AI request reservation expired';
  end if;

  update public.ai_requests
     set status = 'in_progress',
         started_at = timezone('utc', now()),
         reservation_expires_at = null
   where id = current_request.id
  returning * into current_request;

  return current_request;
end;
$$;

create or replace function public.finalize_ai_request(
  target_request_id uuid,
  target_status text,
  target_openai_response_id text,
  target_input_tokens bigint,
  target_cached_input_tokens bigint,
  target_output_tokens bigint,
  target_reasoning_tokens bigint,
  target_actual_cost_micros bigint,
  target_error_code text default null
)
returns public.ai_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_request public.ai_requests;
  current_budget public.ai_project_budgets;
  finalized_request public.ai_requests;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  if target_status is null
     or target_status not in ('completed', 'failed', 'cancelled') then
    raise exception 'Unsupported AI request final status';
  end if;

  if target_input_tokens is null
     or target_cached_input_tokens is null
     or target_output_tokens is null
     or target_reasoning_tokens is null
     or target_actual_cost_micros is null
     or target_input_tokens < 0
     or target_cached_input_tokens < 0
     or target_output_tokens < 0
     or target_reasoning_tokens < 0
     or target_actual_cost_micros < 0
     or target_cached_input_tokens > target_input_tokens
     or target_reasoning_tokens > target_output_tokens then
    raise exception 'Invalid AI usage values';
  end if;

  if target_status = 'completed'
     and char_length(btrim(coalesce(target_openai_response_id, ''))) = 0 then
    raise exception 'A completed AI request requires an OpenAI response ID';
  end if;

  select *
    into current_request
    from public.ai_requests
   where id = target_request_id
   for update;

  if not found then
    raise exception 'AI request not found';
  end if;

  if current_request.status in ('completed', 'failed', 'cancelled') then
    if current_request.status <> target_status
       or current_request.openai_response_id is distinct from nullif(btrim(target_openai_response_id), '')
       or current_request.input_tokens <> target_input_tokens
       or current_request.cached_input_tokens <> target_cached_input_tokens
       or current_request.output_tokens <> target_output_tokens
       or current_request.reasoning_tokens <> target_reasoning_tokens
       or current_request.actual_cost_micros <> target_actual_cost_micros
       or current_request.error_code is distinct from (case
         when target_status = 'completed' then null
         else coalesce(nullif(btrim(target_error_code), ''), 'unknown_error')
       end) then
      raise exception 'AI request was already finalized with different usage';
    end if;

    return current_request;
  end if;

  select *
    into current_budget
    from public.ai_project_budgets
   where project_id = current_request.project_id
   for update;

  update public.ai_requests
     set status = target_status,
         openai_response_id = nullif(btrim(target_openai_response_id), ''),
         input_tokens = target_input_tokens,
         cached_input_tokens = target_cached_input_tokens,
         output_tokens = target_output_tokens,
         reasoning_tokens = target_reasoning_tokens,
         actual_cost_micros = target_actual_cost_micros,
         error_code = case
           when target_status = 'completed' then null
           else coalesce(nullif(btrim(target_error_code), ''), 'unknown_error')
         end,
         started_at = coalesce(started_at, timezone('utc', now())),
         reservation_expires_at = null,
         completed_at = timezone('utc', now())
   where id = current_request.id
  returning * into finalized_request;

  update public.ai_project_budgets
     set reserved_requests = greatest(reserved_requests - 1, 0),
         used_requests = used_requests + 1,
         reserved_input_tokens = greatest(
           reserved_input_tokens - current_request.estimated_input_tokens,
           0
         ),
         used_input_tokens = used_input_tokens + target_input_tokens,
         reserved_output_tokens = greatest(
           reserved_output_tokens - current_request.reserved_output_tokens,
           0
         ),
         used_output_tokens = used_output_tokens + target_output_tokens,
         reserved_cost_micros = greatest(
           reserved_cost_micros - current_request.reserved_cost_micros,
           0
         ),
         used_cost_micros = used_cost_micros + target_actual_cost_micros,
         status = case
           when status = 'enabled' and (
             used_requests + 1 >= max_requests
             or used_input_tokens + target_input_tokens >= max_input_tokens
             or used_output_tokens + target_output_tokens >= max_output_tokens
             or used_input_tokens + used_output_tokens
                  + target_input_tokens + target_output_tokens >= max_total_tokens
             or used_cost_micros + target_actual_cost_micros >= max_cost_micros
           ) then 'exhausted'
           else status
         end
   where project_id = current_request.project_id;

  return finalized_request;
end;
$$;

revoke all on function public.get_ai_usage_summary(uuid) from public, anon;
grant execute on function public.get_ai_usage_summary(uuid) to authenticated;

revoke all on function public.reserve_ai_request(uuid, uuid, text, text, bigint, bigint, bigint, text, text)
from public, anon, authenticated;
revoke all on function public.mark_ai_request_started(uuid)
from public, anon, authenticated;
revoke all on function public.finalize_ai_request(uuid, text, text, bigint, bigint, bigint, bigint, bigint, text)
from public, anon, authenticated;

grant execute on function public.reserve_ai_request(uuid, uuid, text, text, bigint, bigint, bigint, text, text)
to service_role;
grant execute on function public.mark_ai_request_started(uuid)
to service_role;
grant execute on function public.finalize_ai_request(uuid, text, text, bigint, bigint, bigint, bigint, bigint, text)
to service_role;
