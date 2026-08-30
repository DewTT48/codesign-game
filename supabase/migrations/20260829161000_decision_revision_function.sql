create or replace function public.revise_decision(
  target_project_id uuid,
  target_phase text,
  target_decision_type text,
  next_content jsonb,
  change_reason text default null
)
returns public.decisions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_decision public.decisions;
  next_decision public.decisions;
begin
  if not (select private.owns_project(target_project_id)) then
    raise exception 'Project access denied';
  end if;

  select *
    into previous_decision
    from public.decisions
   where project_id = target_project_id
     and phase = target_phase
     and decision_type = target_decision_type
     and is_current
   for update;

  if found then
    update public.decisions
       set is_current = false
     where id = previous_decision.id;

    insert into public.decisions (
      project_id,
      phase,
      decision_type,
      content,
      version,
      is_current,
      supersedes_decision_id,
      reason_for_change
    )
    values (
      target_project_id,
      target_phase,
      target_decision_type,
      next_content,
      previous_decision.version + 1,
      true,
      previous_decision.id,
      change_reason
    )
    returning * into next_decision;
  else
    insert into public.decisions (
      project_id,
      phase,
      decision_type,
      content,
      reason_for_change
    )
    values (
      target_project_id,
      target_phase,
      target_decision_type,
      next_content,
      change_reason
    )
    returning * into next_decision;
  end if;

  return next_decision;
end;
$$;

revoke all on function public.revise_decision(uuid, text, text, jsonb, text) from public;
grant execute on function public.revise_decision(uuid, text, text, jsonb, text) to authenticated;

