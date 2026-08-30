begin;

select plan(8);

insert into auth.users (id, email)
values
  ('30000000-0000-0000-0000-000000000003', 'admin@example.com'),
  ('40000000-0000-0000-0000-000000000004', 'player@example.com');

insert into private.admin_users (user_id)
values ('30000000-0000-0000-0000-000000000003');

insert into public.projects (owner_id, title, topic, content_readiness, status, current_phase)
values
  ('30000000-0000-0000-0000-000000000003', 'ADMIN PROJECT', 'ADMIN', 'idea', 'in_progress', 'C'),
  ('40000000-0000-0000-0000-000000000004', 'PLAYER PROJECT', 'PLAYER', 'some', 'completed', 'COMPLETE');

set local role authenticated;
set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated"}';

select is(public.current_user_is_admin(), false, 'regular user is not an admin');

select throws_ok(
  $$select public.get_admin_overview()$$,
  '42501',
  'Admin access required',
  'regular user cannot read the admin overview'
);

select throws_ok(
  $$select * from public.get_admin_users()$$,
  '42501',
  'Admin access required',
  'regular user cannot list accounts'
);

select throws_ok(
  $$select * from private.admin_users$$,
  '42501',
  null,
  'regular user cannot inspect the admin role table'
);

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}';

select is(public.current_user_is_admin(), true, 'configured user is an admin');

select is(
  (public.get_admin_overview() ->> 'total_users')::integer,
  2,
  'admin overview includes all users'
);

select is(
  (public.get_admin_overview() ->> 'total_missions')::integer,
  2,
  'admin overview includes all missions'
);

select is(
  (select count(*)::integer from public.get_admin_users()),
  2,
  'admin can list account metadata'
);

select * from finish();
rollback;
