begin;

select plan(18);

insert into auth.users (id, email)
values
  ('54000000-0000-0000-0000-000000000005', 'own-admin@example.com'),
  ('64000000-0000-0000-0000-000000000006', 'own-owner@example.com'),
  ('74000000-0000-0000-0000-000000000007', 'own-other@example.com');

insert into private.admin_users (user_id)
values ('54000000-0000-0000-0000-000000000005');

insert into public.projects (
  id,
  owner_id,
  mode,
  title,
  topic,
  content_readiness
)
values
  (
    '84000000-0000-0000-0000-000000000008',
    '64000000-0000-0000-0000-000000000006',
    'own',
    'OWN JOURNEY PROJECT',
    'Structured product definition',
    'idea'
  ),
  (
    '94000000-0000-0000-0000-000000000009',
    '64000000-0000-0000-0000-000000000006',
    'guided',
    'GUIDED PROJECT',
    '21 Days',
    'idea'
  );

insert into public.phase_entries (
  project_id,
  phase,
  section,
  field_key,
  content
)
values (
  '84000000-0000-0000-0000-000000000008',
  'C',
  'form',
  'problemStatement',
  '"A clear observable problem"'::jsonb
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"74000000-0000-0000-0000-000000000007","role":"authenticated"}';

select throws_ok(
  $$select public.complete_own_phase(
      '84000000-0000-0000-0000-000000000008',
      'C'
    )$$,
  'P0001',
  'Project access denied',
  'another user cannot complete an Own Journey phase'
);

set local request.jwt.claims = '{"sub":"64000000-0000-0000-0000-000000000006","role":"authenticated"}';

select lives_ok(
  $$select public.complete_own_phase(
      '84000000-0000-0000-0000-000000000008',
      'C'
    )$$,
  'the owner can complete the active Own Journey phase'
);

reset role;

select is(
  (select current_phase from public.projects where id = '84000000-0000-0000-0000-000000000008'),
  'O',
  'Own Journey advances from C to O'
);

select is(
  (select status from public.phase_entries where project_id = '84000000-0000-0000-0000-000000000008' and phase = 'C'),
  'locked',
  'completed Own Journey entries are locked'
);

select is(
  (select count(*)::integer from public.decisions where project_id = '84000000-0000-0000-0000-000000000008' and decision_type = 'own_phase_summary'),
  1,
  'completing a phase creates one authoritative decision snapshot'
);

select is(
  (
    select content ->> 'problemStatement'
    from public.decisions
    where project_id = '84000000-0000-0000-0000-000000000008'
      and decision_type = 'own_phase_summary'
  ),
  'A clear observable problem',
  'the decision snapshot contains the saved page fields'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"64000000-0000-0000-0000-000000000006","role":"authenticated"}';

select throws_ok(
  $$select public.complete_own_phase(
      '84000000-0000-0000-0000-000000000008',
      'C'
    )$$,
  'P0001',
  'Phase C is not currently active',
  'a completed phase cannot be completed twice'
);

select throws_ok(
  $$select public.complete_own_phase(
      '94000000-0000-0000-0000-000000000009',
      'C'
    )$$,
  'P0001',
  'Own Journey requires an own-mode Project',
  'the Own completion RPC cannot alter a Guided project'
);

set local request.jwt.claims = '{"sub":"54000000-0000-0000-0000-000000000005","role":"authenticated"}';

select lives_ok(
  $$select public.admin_enable_ai_test_allowance(
      '84000000-0000-0000-0000-000000000008'
    )$$,
  'an admin can enable the bounded allowance for the Own Project'
);

set local role service_role;
set local request.jwt.claims = '{"sub":"64000000-0000-0000-0000-000000000006","role":"service_role"}';

select lives_ok(
  $$select public.reserve_ai_request(
      '84000000-0000-0000-0000-000000000008',
      '64000000-0000-0000-0000-000000000006',
      'frame_context',
      'own-review:001',
      100,
      4000,
      80400,
      'frame-context-v1',
      'ai-proposal-v1'
    )$$,
  'the Edge Function can reserve the review test request'
);

select lives_ok(
  $$select public.mark_ai_request_started(
      (select id from public.ai_requests where idempotency_key = 'own-review:001')
    )$$,
  'the review test request can start'
);

select lives_ok(
  $$select public.store_ai_proposal(
      (select id from public.ai_requests where idempotency_key = 'own-review:001'),
      'resp_own_review_001',
      '{
        "action":"frame_context",
        "decision_status":"proposed",
        "proposal":{"framing":"Focused owner-reviewed problem","evidenceGaps":[]},
        "questions":[],
        "warnings":[],
        "consistency":{"status":"aligned","conflicts":[]}
      }'::jsonb,
      '{
        "inputTokens":90,
        "cachedInputTokens":10,
        "cacheWriteTokens":0,
        "outputTokens":40,
        "reasoningTokens":8
      }'::jsonb,
      1120,
      'gpt-5.6-sol-2026-09-16'
    )$$,
  'the Edge Function can store the proposal awaiting review'
);

select lives_ok(
  $$select public.finalize_ai_request(
      (select id from public.ai_requests where idempotency_key = 'own-review:001'),
      'completed',
      'resp_own_review_001',
      90,
      10,
      40,
      8,
      1120,
      null
    )$$,
  'proposal usage is reconciled before owner review'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"64000000-0000-0000-0000-000000000006","role":"authenticated"}';

select lives_ok(
  $$select public.review_ai_proposal(
      (select id from public.ai_proposals where openai_response_id = 'resp_own_review_001'),
      'accepted',
      '{"framing":"Owner edited framing","evidenceGaps":[]}'::jsonb
    )$$,
  'the owner can accept an edited proposal'
);

reset role;

select is(
  (select review_status from public.ai_proposals where openai_response_id = 'resp_own_review_001'),
  'accepted',
  'the accepted review status is persisted'
);

select is(
  (select review_content ->> 'framing' from public.ai_proposals where openai_response_id = 'resp_own_review_001'),
  'Owner edited framing',
  'the owner-reviewed content is stored separately from provider output'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"74000000-0000-0000-0000-000000000007","role":"authenticated"}';

select throws_ok(
  $$select public.review_ai_proposal(
      (select id from public.ai_proposals where openai_response_id = 'resp_own_review_001'),
      'accepted',
      '{"framing":"Unauthorized edit"}'::jsonb
    )$$,
  '42501',
  'AI proposal access denied',
  'another user cannot review the proposal'
);

set local request.jwt.claims = '{"sub":"64000000-0000-0000-0000-000000000006","role":"authenticated"}';

select throws_ok(
  $$select public.review_ai_proposal(
      (select id from public.ai_proposals where openai_response_id = 'resp_own_review_001'),
      'rejected',
      null
    )$$,
  'P0001',
  'AI proposal has already been reviewed',
  'a reviewed proposal cannot be changed to another outcome'
);

select * from finish();
rollback;
