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

  if target_phase not in ('C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N') then
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
    when 'PRD' then 'I'
    when 'I' then 'G'
    when 'G' then 'N'
    when 'N' then 'COMPLETE'
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
