begin;

select plan(13);

insert into auth.users (id, email)
values
  ('91000000-0000-0000-0000-000000000001', 'record-admin@example.com'),
  ('91000000-0000-0000-0000-000000000002', 'record-player@example.com');

insert into private.admin_users (user_id)
values ('91000000-0000-0000-0000-000000000001');

insert into public.projects (
  id,
  owner_id,
  mode,
  title,
  topic,
  content_readiness,
  status,
  current_phase
)
values
  (
    '91000000-0000-0000-0000-000000000011',
    '91000000-0000-0000-0000-000000000002',
    'guided',
    '21 DAYS OF TESTING',
    'TESTING',
    'some',
    'in_progress',
    'O'
  ),
  (
    '91000000-0000-0000-0000-000000000012',
    '91000000-0000-0000-0000-000000000002',
    'own',
    'OWN TEST PROJECT',
    'OPERATIONS',
    'idea',
    'in_progress',
    'C'
  );

insert into public.phase_entries (
  project_id,
  phase,
  section,
  field_key,
  content,
  status
)
values (
  '91000000-0000-0000-0000-000000000011',
  'C',
  'context',
  'goal',
  '"Consolidate the build evidence"'::jsonb,
  'locked'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"91000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$select * from public.get_admin_projects()$$,
  '42501',
  'Admin access required',
  'regular user cannot list project records'
);

select throws_ok(
  $$select public.get_admin_project_record('91000000-0000-0000-0000-000000000011')$$,
  '42501',
  'Admin access required',
  'regular user cannot open a project record'
);

select throws_ok(
  $$select * from private.admin_project_access_events$$,
  '42501',
  null,
  'authenticated users cannot inspect the private access log'
);

set local request.jwt.claims = '{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::integer from public.get_admin_projects()),
  2,
  'admin can list projects from both modes'
);

select is(
  (select count(*)::integer from public.get_admin_projects(null, 'guided')),
  1,
  'admin can filter Guided projects'
);

select is(
  (select count(*)::integer from public.get_admin_projects(null, 'own')),
  1,
  'admin can filter Own projects'
);

select is(
  (select count(*)::integer from public.get_admin_projects('record-player@example.com')),
  2,
  'admin can search by owner email'
);

select is(
  (select count(*)::integer from public.get_admin_projects('OWN TEST')),
  1,
  'admin can search by project title'
);

select is(
  (public.get_admin_project_record('91000000-0000-0000-0000-000000000011') #>> '{project,title}'),
  '21 DAYS OF TESTING',
  'record contains project metadata'
);

select is(
  (public.get_admin_project_record('91000000-0000-0000-0000-000000000011') #>> '{owner,email}'),
  'record-player@example.com',
  'record identifies the project owner'
);

select is(
  jsonb_array_length(public.get_admin_project_record('91000000-0000-0000-0000-000000000011') -> 'phase_entries'),
  1,
  'record contains phase content'
);

select ok(
  (select count(*) from private.admin_project_access_events
    where project_id = '91000000-0000-0000-0000-000000000011') >= 3,
  'opening a project record writes a private access audit event'
);

select throws_ok(
  $$select public.get_admin_project_record('91000000-0000-0000-0000-000000000099')$$,
  'P0002',
  'Project not found',
  'unknown project ids fail closed'
);

select * from finish();
rollback;
