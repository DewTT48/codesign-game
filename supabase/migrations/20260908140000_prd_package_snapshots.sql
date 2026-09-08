alter table public.prd_snapshots
  add column if not exists content_pack text,
  add column if not exists experience_direction text;

create or replace function public.lock_prd_package(
  target_project_id uuid,
  target_markdown text,
  target_content_pack text,
  target_experience_direction text
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_project public.projects;
  next_version integer;
  next_project public.projects;
begin
  if nullif(trim(target_markdown), '') is null
    or nullif(trim(target_content_pack), '') is null
    or nullif(trim(target_experience_direction), '') is null then
    raise exception 'All three PRD source files are required';
  end if;

  select *
    into current_project
    from public.projects
   where id = target_project_id
   for update;

  if not found or not (select private.owns_project(target_project_id)) then
    raise exception 'Project access denied';
  end if;

  if current_project.current_phase <> 'PRD' then
    raise exception 'PRD is not currently active';
  end if;

  select coalesce(max(version), 0) + 1
    into next_version
    from public.prd_snapshots
   where project_id = target_project_id;

  insert into public.prd_snapshots (
    project_id,
    version,
    markdown_content,
    content_pack,
    experience_direction,
    status
  ) values (
    target_project_id,
    next_version,
    target_markdown,
    target_content_pack,
    target_experience_direction,
    'locked'
  );

  next_project := public.complete_phase(target_project_id, 'PRD');
  return next_project;
end;
$$;

revoke all on function public.lock_prd_package(uuid, text, text, text) from public;
grant execute on function public.lock_prd_package(uuid, text, text, text) to authenticated;
