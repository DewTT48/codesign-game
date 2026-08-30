begin;

select plan(8);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'alpha@example.com'),
  ('20000000-0000-0000-0000-000000000002', 'beta@example.com');

set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$insert into public.projects (id, owner_id, title, topic, content_readiness)
    values (
      'a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '21 DAYS OF WRITING',
      'WRITING',
      'idea'
    )$$,
  'owner can create a project'
);

select throws_ok(
  $$insert into public.projects (owner_id, title, topic, content_readiness)
    values (
      '20000000-0000-0000-0000-000000000002',
      'NOT MINE',
      'TEST',
      'idea'
    )$$,
  '42501',
  null,
  'user cannot create a project for another owner'
);

select is(
  (select count(*)::integer from public.projects),
  1,
  'owner sees their project'
);

select lives_ok(
  $$insert into public.phase_entries (project_id, phase, section, field_key, content)
    values (
      'a0000000-0000-0000-0000-000000000001',
      'C',
      'context',
      'who',
      '"Writers"'::jsonb
    )$$,
  'owner can create a phase entry'
);

set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (select count(*)::integer from public.projects),
  0,
  'another user cannot see the project'
);

select is(
  (select count(*)::integer from public.phase_entries),
  0,
  'another user cannot see child entries'
);

select throws_ok(
  $$insert into public.phase_entries (project_id, phase, section, field_key, content)
    values (
      'a0000000-0000-0000-0000-000000000001',
      'C',
      'context',
      'goal',
      '"Not allowed"'::jsonb
    )$$,
  '42501',
  null,
  'another user cannot add child entries'
);

select is(
  (select count(*)::integer from public.profiles),
  1,
  'another user sees only their profile'
);

select * from finish();
rollback;

