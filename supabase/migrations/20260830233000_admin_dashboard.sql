create table if not exists private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table private.admin_users enable row level security;

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_current_phase_idx on public.projects (current_phase);
create index if not exists projects_created_at_idx on public.projects (created_at desc);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

revoke all on table private.admin_users from public, anon, authenticated;

create or replace function private.is_admin(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.admin_users
    where user_id = target_user_id
  );
$$;

revoke all on function private.is_admin(uuid) from public, anon, authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin((select auth.uid()));
$$;

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.get_admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  overview jsonb;
begin
  if not private.is_admin((select auth.uid())) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'total_missions', (select count(*) from public.projects),
    'active_missions', (select count(*) from public.projects where status = 'in_progress'),
    'completed_missions', (select count(*) from public.projects where status = 'completed'),
    'archived_missions', (select count(*) from public.projects where status = 'archived'),
    'users_7d', (select count(*) from public.profiles where created_at >= timezone('utc', now()) - interval '7 days'),
    'users_30d', (select count(*) from public.profiles where created_at >= timezone('utc', now()) - interval '30 days'),
    'missions_7d', (select count(*) from public.projects where created_at >= timezone('utc', now()) - interval '7 days'),
    'missions_30d', (select count(*) from public.projects where created_at >= timezone('utc', now()) - interval '30 days'),
    'phase_counts', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('phase', phase_order.phase, 'count', coalesce(counts.total, 0))
          order by phase_order.position
        ),
        '[]'::jsonb
      )
      from unnest(array['C','O','D','E','S','PRD','I','G','N','COMPLETE'])
        with ordinality as phase_order(phase, position)
      left join (
        select current_phase as phase, count(*) as total
        from public.projects
        where status <> 'archived'
        group by current_phase
      ) as counts using (phase)
    ),
    'generated_at', timezone('utc', now())
  ) into overview;

  return overview;
end;
$$;

revoke all on function public.get_admin_overview() from public, anon;
grant execute on function public.get_admin_overview() to authenticated;

create or replace function public.get_admin_users(
  search_text text default null,
  page_limit integer default 50,
  page_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  joined_at timestamptz,
  total_missions bigint,
  active_missions bigint,
  completed_missions bigint,
  archived_missions bigint,
  last_activity_at timestamptz
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
    profile.id,
    profile.email,
    profile.display_name,
    profile.created_at,
    count(project.id),
    count(project.id) filter (where project.status = 'in_progress'),
    count(project.id) filter (where project.status = 'completed'),
    count(project.id) filter (where project.status = 'archived'),
    coalesce(max(project.updated_at), profile.created_at)
  from public.profiles as profile
  left join public.projects as project on project.owner_id = profile.id
  where search_text is null
     or btrim(search_text) = ''
     or lower(coalesce(profile.email, '')) like '%' || lower(btrim(search_text)) || '%'
     or lower(coalesce(profile.display_name, '')) like '%' || lower(btrim(search_text)) || '%'
  group by profile.id, profile.email, profile.display_name, profile.created_at
  order by profile.created_at desc
  limit least(greatest(coalesce(page_limit, 50), 1), 100)
  offset greatest(coalesce(page_offset, 0), 0);
end;
$$;

revoke all on function public.get_admin_users(text, integer, integer) from public, anon;
grant execute on function public.get_admin_users(text, integer, integer) to authenticated;

insert into private.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('dewteerapap@seederschool.com')
on conflict (user_id) do nothing;
