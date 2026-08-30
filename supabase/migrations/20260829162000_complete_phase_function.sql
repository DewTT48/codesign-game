create or replace function public.complete_phase(
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

  if current_project.current_phase <> target_phase then
    raise exception 'Phase % is not currently active', target_phase;
  end if;

  if not exists (
    select 1 from public.phase_entries
     where project_id = target_project_id
       and phase = target_phase
       and is_current
  ) then
    raise exception 'Phase has no captured entries';
  end if;

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
    when 'PRD' then 'I'
    when 'I' then 'G'
    when 'G' then 'N'
    when 'N' then 'COMPLETE'
    else null
  end;

  if next_phase is null then
    raise exception 'Unsupported phase %', target_phase;
  end if;

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
         status = case when next_phase = 'COMPLETE' then 'completed' else status end,
         completed_at = case when next_phase = 'COMPLETE' then timezone('utc', now()) else completed_at end
   where id = target_project_id
  returning * into next_project;

  return next_project;
end;
$$;

revoke all on function public.complete_phase(uuid, text) from public;
grant execute on function public.complete_phase(uuid, text) to authenticated;

