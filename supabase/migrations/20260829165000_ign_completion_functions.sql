create or replace function public.complete_implementation(
  target_project_id uuid,
  target_app_url text,
  target_repository_url text default null
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_version integer;
  next_project public.projects;
begin
  if not (select private.owns_project(target_project_id)) then
    raise exception 'Project access denied';
  end if;

  if not exists (
    select 1 from public.projects
     where id = target_project_id and current_phase = 'I'
  ) then
    raise exception 'Implementation is not currently active';
  end if;

  if nullif(trim(target_app_url), '') is null then
    raise exception 'Working app URL is required';
  end if;

  select coalesce(count(*), 0) + 1
    into next_version
    from public.app_builds
   where project_id = target_project_id;

  insert into public.app_builds (
    project_id,
    version_label,
    app_url,
    repository_url
  ) values (
    target_project_id,
    'v' || next_version,
    trim(target_app_url),
    nullif(trim(target_repository_url), '')
  );

  next_project := public.complete_phase(target_project_id, 'I');
  return next_project;
end;
$$;

create or replace function public.complete_feedback(
  target_project_id uuid,
  target_creator_test jsonb,
  target_user_test jsonb
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_project public.projects;
begin
  if not (select private.owns_project(target_project_id)) then
    raise exception 'Project access denied';
  end if;

  if not exists (
    select 1 from public.projects
     where id = target_project_id and current_phase = 'G'
  ) then
    raise exception 'Feedback is not currently active';
  end if;

  insert into public.feedback_entries (project_id, feedback_type, content)
  values
    (target_project_id, 'creator_test', target_creator_test),
    (target_project_id, 'user_test', target_user_test);

  next_project := public.complete_phase(target_project_id, 'G');
  return next_project;
end;
$$;

create or replace function public.complete_next_iteration(
  target_project_id uuid,
  target_decision jsonb
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_version integer;
  next_project public.projects;
begin
  if not (select private.owns_project(target_project_id)) then
    raise exception 'Project access denied';
  end if;

  if not exists (
    select 1 from public.projects
     where id = target_project_id and current_phase = 'N'
  ) then
    raise exception 'Next iteration is not currently active';
  end if;

  select coalesce(max(version), 0) + 1
    into next_version
    from public.decisions
   where project_id = target_project_id
     and phase = 'N'
     and decision_type = 'next_iteration';

  insert into public.decisions (
    project_id,
    phase,
    decision_type,
    content,
    version,
    is_current
  ) values (
    target_project_id,
    'N',
    'next_iteration',
    target_decision,
    next_version,
    true
  );

  next_project := public.complete_phase(target_project_id, 'N');
  return next_project;
end;
$$;

revoke all on function public.complete_implementation(uuid, text, text) from public;
revoke all on function public.complete_feedback(uuid, jsonb, jsonb) from public;
revoke all on function public.complete_next_iteration(uuid, jsonb) from public;

grant execute on function public.complete_implementation(uuid, text, text) to authenticated;
grant execute on function public.complete_feedback(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.complete_next_iteration(uuid, jsonb) to authenticated;

