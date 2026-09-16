begin;

select plan(38);

insert into auth.users (id, email)
values
  ('50000000-0000-0000-0000-000000000005', 'pass-admin@example.com'),
  ('60000000-0000-0000-0000-000000000006', 'pass-player@example.com'),
  ('70000000-0000-0000-0000-000000000007', 'pass-other@example.com');

insert into private.admin_users (user_id)
values ('50000000-0000-0000-0000-000000000005');

set local role authenticated;
set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000006","role":"authenticated"}';

select lives_ok(
  $$insert into public.projects (owner_id, title, topic, content_readiness)
    values (
      '60000000-0000-0000-0000-000000000006',
      '21 DAYS OF WRITING',
      'WRITING',
      'idea'
    )$$,
  'the existing Guided project insert still works'
);

select throws_ok(
  $$insert into public.projects (owner_id, mode, title, topic, content_readiness)
    values (
      '60000000-0000-0000-0000-000000000006',
      'own',
      'BYPASS',
      'BYPASS',
      'idea'
    )$$,
  '42501',
  null,
  'an authenticated user cannot bypass Pass consumption with a direct own insert'
);

select throws_ok(
  $$select public.create_own_project_with_pass('MY PRODUCT', 'Product idea', 'create:without-pass:001')$$,
  'P0001',
  'An available Project Pass is required',
  'an own project cannot be created without an available Pass'
);

select is(
  (select count(*)::integer from public.get_my_project_passes()),
  0,
  'a user initially has no Project Pass'
);

select throws_ok(
  $$select public.admin_grant_project_pass(
      '60000000-0000-0000-0000-000000000006',
      'course',
      'course:player:001',
      'Course entitlement'
    )$$,
  '42501',
  'Admin access required',
  'a regular user cannot grant a Project Pass'
);

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000005","role":"authenticated"}';

select lives_ok(
  $$select public.admin_grant_project_pass(
      '60000000-0000-0000-0000-000000000006',
      'course',
      'course:player:001',
      'Course entitlement'
    )$$,
  'an admin can grant the included course Project Pass'
);

select is(
  (select count(*)::integer from public.project_passes where grant_key = 'course:player:001'),
  1,
  'the grant creates exactly one Pass'
);

select is(
  (
    select id
    from public.project_passes
    where grant_key = 'course:player:001'
  ),
  (
    select id
    from public.admin_grant_project_pass(
      '60000000-0000-0000-0000-000000000006',
      'course',
      'course:player:001',
      'Retry of the same grant'
    )
  ),
  'reusing the same grant key is idempotent'
);

select is(
  (
    select count(*)::integer
    from public.project_pass_events
    where event_type = 'granted'
      and pass_id = (select id from public.project_passes where grant_key = 'course:player:001')
  ),
  1,
  'an idempotent retry does not duplicate the granted audit event'
);

select throws_ok(
  $$select public.admin_grant_project_pass(
      '60000000-0000-0000-0000-000000000006',
      'stripe',
      'stripe:manual:001',
      'Not allowed'
    )$$,
  'P0001',
  'Unsupported manual Project Pass source',
  'manual RPC cannot manufacture a Stripe grant'
);

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000006","role":"authenticated"}';

select is(
  (select count(*)::integer from public.get_my_project_passes()),
  1,
  'the owner can read their Project Pass through the read RPC'
);

select is(
  (select status from public.get_my_project_passes() limit 1),
  'available',
  'a newly granted Project Pass is available'
);

select lives_ok(
  $$select public.create_own_project_with_pass('MY PRODUCT', 'Product idea', 'create:player:001')$$,
  'creating an own project consumes a Pass atomically'
);

select is(
  (
    select mode
    from public.projects
    where owner_id = '60000000-0000-0000-0000-000000000006'
      and title = 'MY PRODUCT'
  ),
  'own',
  'the atomic RPC creates a project in own mode'
);

select is(
  (select status from public.project_passes where grant_key = 'course:player:001'),
  'consumed',
  'the Project Pass is marked consumed'
);

select is(
  (select project_id from public.project_passes where grant_key = 'course:player:001'),
  (
    select id
    from public.projects
    where owner_id = '60000000-0000-0000-0000-000000000006'
      and title = 'MY PRODUCT'
  ),
  'the consumed Pass is linked to the project it opened'
);

select is(
  (
    select count(*)::integer
    from public.project_pass_events
    where event_type = 'consumed'
      and pass_id = (select id from public.project_passes where grant_key = 'course:player:001')
  ),
  1,
  'consumption is recorded in the audit trail'
);

select is(
  (
    select id
    from public.create_own_project_with_pass(
      'MY PRODUCT',
      'Product idea',
      'create:player:001'
    )
  ),
  (
    select id
    from public.projects
    where owner_id = '60000000-0000-0000-0000-000000000006'
      and title = 'MY PRODUCT'
  ),
  'retrying the same creation key returns the original Project'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where owner_id = '60000000-0000-0000-0000-000000000006'
      and mode = 'own'
  ),
  1,
  'an idempotent retry does not create a duplicate Project'
);

select throws_ok(
  $$select public.create_own_project_with_pass('SECOND PRODUCT', 'Another idea', 'create:player:002')$$,
  'P0001',
  'An available Project Pass is required',
  'one Project Pass cannot open a second project'
);

select throws_ok(
  $$update public.project_passes set status = 'available'
    where grant_key = 'course:player:001'$$,
  '42501',
  null,
  'the owner cannot mutate Pass state directly'
);

select lives_ok(
  $$delete from public.projects
    where owner_id = '60000000-0000-0000-0000-000000000006'
      and title = 'MY PRODUCT'$$,
  'the owner can delete their own-mode project'
);

select is(
  (select status from public.project_passes where grant_key = 'course:player:001'),
  'consumed',
  'deleting a project does not refund its Pass'
);

select is(
  (select project_id from public.project_passes where grant_key = 'course:player:001'),
  null,
  'the deleted project link clears while the Pass remains consumed'
);

set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000007","role":"authenticated"}';

select is(
  (select count(*)::integer from public.project_passes),
  0,
  'another user cannot read the owner Project Pass'
);

select is(
  (select count(*)::integer from public.project_pass_events),
  0,
  'another user cannot read the owner Pass audit events'
);

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000005","role":"authenticated"}';

select lives_ok(
  $$select public.admin_grant_project_pass(
      '60000000-0000-0000-0000-000000000006',
      'admin',
      'admin:player:002',
      'Support replacement'
    )$$,
  'an admin can grant a support Pass'
);

select lives_ok(
  $$select public.admin_revoke_project_pass(
      (select id from public.project_passes where grant_key = 'admin:player:002'),
      'Granted to the wrong account'
    )$$,
  'an admin can revoke an available Pass with a reason'
);

select is(
  (select status from public.project_passes where grant_key = 'admin:player:002'),
  'revoked',
  'the revoked Pass is not available'
);

select lives_ok(
  $$select public.admin_restore_project_pass(
      (select id from public.project_passes where grant_key = 'admin:player:002'),
      'Account ownership verified'
    )$$,
  'an admin can restore a revoked Pass with a reason'
);

select is(
  (select status from public.project_passes where grant_key = 'admin:player:002'),
  'available',
  'a restored Pass becomes available again'
);

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000006","role":"authenticated"}';

select throws_ok(
  $$select public.create_own_project_with_pass('MY PRODUCT', 'Product idea', 'create:player:001')$$,
  'P0001',
  'This project creation was already completed and its Project was deleted',
  'retrying a deleted Project creation never consumes a replacement Pass'
);

select is(
  (select status from public.project_passes where grant_key = 'admin:player:002'),
  'available',
  'the replacement Pass remains available after the stale retry'
);

select throws_ok(
  $$select public.create_own_project_with_pass('X', 'Valid topic', 'create:player:003')$$,
  'P0001',
  'Project title must contain 2 to 120 characters',
  'invalid project input is rejected before consuming a Pass'
);

select is(
  (select status from public.project_passes where grant_key = 'admin:player:002'),
  'available',
  'a failed project creation leaves the Pass available'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where owner_id = '60000000-0000-0000-0000-000000000006'
      and mode = 'own'
  ),
  0,
  'a failed atomic creation does not leave a partial own project'
);

select lives_ok(
  $$select public.create_own_project_with_pass('SECOND PRODUCT', 'Valid topic', 'create:player:003')$$,
  'the same Pass remains usable after the failed transaction'
);

select is(
  (
    select count(*)::integer
    from public.project_pass_events
    where pass_id = (select id from public.project_passes where grant_key = 'admin:player:002')
      and event_type in ('granted', 'revoked', 'restored', 'consumed')
  ),
  4,
  'grant, revoke, restore, and consume transitions are all audited'
);

select * from finish();
rollback;
