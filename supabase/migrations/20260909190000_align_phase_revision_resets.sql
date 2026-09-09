create or replace function public.start_phase_revision(
  target_project_id uuid,
  target_phase text,
  change_reason text
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_project public.projects;
  next_project public.projects;
  all_phases text[] := array['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N'];
  affected_phases text[];
  target_order integer;
  current_order integer;
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

  if target_phase not in ('C', 'O', 'D', 'E', 'S', 'PRD') then
    raise exception 'Phase % is not available for revision', target_phase;
  end if;

  target_order := array_position(all_phases, target_phase);
  current_order := case
    when current_project.current_phase = 'COMPLETE' then array_length(all_phases, 1) + 1
    else array_position(all_phases, current_project.current_phase)
  end;

  if target_order is null or current_order is null or target_order >= current_order then
    raise exception 'Only a completed phase can start a revision';
  end if;

  if nullif(trim(change_reason), '') is null then
    raise exception 'A revision reason is required';
  end if;

  affected_phases := all_phases[target_order:least(current_order, array_length(all_phases, 1))];

  if not exists (
    select 1 from public.phase_entries
     where project_id = target_project_id
       and phase = target_phase
       and is_current
  ) then
    raise exception 'The target phase has no current entries';
  end if;

  with previous_entries as (
    update public.phase_entries
       set is_current = false,
           status = 'superseded'
     where project_id = target_project_id
       and phase = any(affected_phases)
       and is_current
    returning project_id, phase, section, field_key, content, version
  )
  insert into public.phase_entries (
    project_id,
    phase,
    section,
    field_key,
    content,
    status,
    version,
    is_current
  )
  select
    project_id,
    phase,
    section,
    field_key,
    case
      when (phase, field_key) in (
        ('O', 'alignmentConfirmed'),
        ('D', 'alignmentConfirmed'),
        ('E', 'scopeAlignmentConfirmed'),
        ('E', 'alignmentConfirmed'),
        ('S', 'contentOwnerConfirmed'),
        ('S', 'experienceOwnerConfirmed'),
        ('S', 'alignmentConfirmed'),
        ('I', 'workingApp'),
        ('I', 'alignmentConfirmed'),
        ('G', 'mobile'),
        ('G', 'start'),
        ('G', 'dailyFlow'),
        ('G', 'saveData'),
        ('G', 'reopen'),
        ('G', 'persistence'),
        ('G', 'navigation'),
        ('G', 'prdRules'),
        ('G', 'alignmentConfirmed'),
        ('N', 'routeConfirmed')
      ) then 'false'::jsonb
      when phase = 'PRD' and field_key in ('confirmedFiles', 'confirmedFilesV2') then '[]'::jsonb
      when (phase, field_key) in (
        ('O', 'alignmentStatus'), ('O', 'alignmentNote'),
        ('D', 'alignmentStatus'), ('D', 'alignmentNote'),
        ('E', 'alignmentStatus'), ('E', 'alignmentNote'),
        ('S', 'alignmentStatus'), ('S', 'alignmentNote'),
        ('PRD', 'reviewOutcomeV2'),
        ('I', 'alignmentStatus'), ('I', 'alignmentNote'),
        ('G', 'alignmentStatus'), ('G', 'alignmentNote'),
        ('N', 'changeRoute')
      ) then '""'::jsonb
      else content
    end,
    'captured',
    version + 1,
    true
  from previous_entries;

  if 'N' = any(affected_phases) then
    update public.decisions
       set is_current = false
     where project_id = target_project_id
       and phase = 'N'
       and decision_type = 'next_iteration'
       and is_current;
  end if;

  perform public.revise_decision(
    target_project_id,
    target_phase,
    'phase_revision',
    jsonb_build_object(
      'targetPhase', target_phase,
      'sourceCurrentPhase', current_project.current_phase,
      'affectedPhases', to_jsonb(affected_phases)
    ),
    trim(change_reason)
  );

  next_stage := case target_phase
    when 'C' then 'IDEA'
    when 'O' then 'UNDERSTOOD'
    when 'D' then 'UNDERSTOOD'
    when 'E' then 'EXPLORED'
    when 'S' then 'DECIDED'
    when 'PRD' then 'SOLID'
  end;

  update public.projects
     set current_phase = target_phase,
         solidification_stage = next_stage,
         status = 'in_progress',
         completed_at = null
   where id = target_project_id
  returning * into next_project;

  return next_project;
end;
$$;

revoke all on function public.start_phase_revision(uuid, text, text) from public;
grant execute on function public.start_phase_revision(uuid, text, text) to authenticated;
