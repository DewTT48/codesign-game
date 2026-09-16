begin;

select plan(16);

insert into auth.users (id, email)
values ('65000000-0000-0000-0000-000000000006', 'own-ign-owner@example.com');

insert into public.projects (
  id,
  owner_id,
  mode,
  title,
  topic,
  content_readiness,
  current_phase,
  solidification_stage
)
values (
  '85000000-0000-0000-0000-000000000008',
  '65000000-0000-0000-0000-000000000006',
  'own',
  'OWN I G N PROJECT',
  'Complete the first product cycle',
  'ready',
  'PRD',
  'SOLID'
);

insert into public.phase_entries (
  project_id,
  phase,
  section,
  field_key,
  content
)
values
  ('85000000-0000-0000-0000-000000000008', 'PRD', 'form', 'prdMarkdown', '"# Locked PRD"'::jsonb),
  ('85000000-0000-0000-0000-000000000008', 'I', 'form', 'appUrl', '"https://example.com/product"'::jsonb),
  ('85000000-0000-0000-0000-000000000008', 'G', 'form', 'mostImportantLearning', '"Users need a clearer first action"'::jsonb),
  ('85000000-0000-0000-0000-000000000008', 'N', 'form', 'selectedChange', '"Clarify the first action"'::jsonb);

set local role authenticated;
set local request.jwt.claims = '{"sub":"65000000-0000-0000-0000-000000000006","role":"authenticated"}';

select lives_ok(
  $$select public.complete_own_phase(
      '85000000-0000-0000-0000-000000000008',
      'PRD'
    )$$,
  'Own PRD can advance into implementation'
);

reset role;

select is(
  (select current_phase from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  'I',
  'Own Journey advances from PRD to I'
);

select is(
  (select status from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  'in_progress',
  'locking Own PRD no longer completes the Project'
);

select is(
  (select completed_at is null from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  true,
  'the Project remains incomplete after PRD'
);

select is(
  (select solidification_stage from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  'BUILD_READY',
  'locking PRD marks the definition as build ready'
);

select is(
  (select status from public.phase_entries where project_id = '85000000-0000-0000-0000-000000000008' and phase = 'PRD'),
  'locked',
  'Own PRD entries are locked before implementation'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"65000000-0000-0000-0000-000000000006","role":"authenticated"}';

select lives_ok(
  $$select public.complete_own_phase(
      '85000000-0000-0000-0000-000000000008',
      'I'
    )$$,
  'the owner can lock Own implementation evidence'
);

reset role;

select is(
  (select current_phase from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  'G',
  'Own Journey advances from I to G'
);

select is(
  (select status from public.phase_entries where project_id = '85000000-0000-0000-0000-000000000008' and phase = 'I'),
  'locked',
  'Own implementation evidence is locked'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"65000000-0000-0000-0000-000000000006","role":"authenticated"}';

select lives_ok(
  $$select public.complete_own_phase(
      '85000000-0000-0000-0000-000000000008',
      'G'
    )$$,
  'the owner can lock Own feedback evidence'
);

reset role;

select is(
  (select current_phase from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  'N',
  'Own Journey advances from G to N'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"65000000-0000-0000-0000-000000000006","role":"authenticated"}';

select lives_ok(
  $$select public.complete_own_phase(
      '85000000-0000-0000-0000-000000000008',
      'N'
    )$$,
  'the owner can lock the Own next iteration'
);

reset role;

select is(
  (select current_phase from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  'COMPLETE',
  'Own Journey completes only after N'
);

select is(
  (select status from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  'completed',
  'the Project is marked completed after N'
);

select ok(
  (select completed_at is not null from public.projects where id = '85000000-0000-0000-0000-000000000008'),
  'the Project records its completion time after N'
);

select is(
  (
    select count(*)::integer
    from public.decisions
    where project_id = '85000000-0000-0000-0000-000000000008'
      and decision_type = 'own_phase_summary'
  ),
  4,
  'PRD, I, G, and N each preserve an authoritative snapshot'
);

select * from finish();
rollback;
