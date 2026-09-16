begin;

select plan(18);

insert into auth.users (id, email)
values
  ('52000000-0000-0000-0000-000000000005', 'proposal-admin@example.com'),
  ('62000000-0000-0000-0000-000000000006', 'proposal-owner@example.com'),
  ('72000000-0000-0000-0000-000000000007', 'proposal-other@example.com');

insert into private.admin_users (user_id)
values ('52000000-0000-0000-0000-000000000005');

insert into public.projects (
  id,
  owner_id,
  mode,
  title,
  topic,
  content_readiness
)
values (
  '83000000-0000-0000-0000-000000000008',
  '62000000-0000-0000-0000-000000000006',
  'own',
  'AI PROPOSAL PROJECT',
  'Safe structured AI proposals',
  'idea'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"62000000-0000-0000-0000-000000000006","role":"authenticated"}';

select throws_ok(
  $$select public.admin_enable_ai_test_allowance(
      '83000000-0000-0000-0000-000000000008'
    )$$,
  '42501',
  'Admin access required',
  'a non-admin cannot enable an AI test allowance'
);

set local request.jwt.claims = '{"sub":"52000000-0000-0000-0000-000000000005","role":"authenticated"}';

select lives_ok(
  $$select public.admin_enable_ai_test_allowance(
      '83000000-0000-0000-0000-000000000008'
    )$$,
  'an admin can enable the internal AI test allowance'
);

reset role;

select is(
  (select status from public.ai_project_budgets where project_id = '83000000-0000-0000-0000-000000000008'),
  'enabled',
  'the internal allowance is enabled'
);

select is(
  (select max_requests from public.ai_project_budgets where project_id = '83000000-0000-0000-0000-000000000008'),
  5,
  'the internal allowance permits exactly five requests'
);

select is(
  (select max_cost_micros from public.ai_project_budgets where project_id = '83000000-0000-0000-0000-000000000008'),
  1000000::bigint,
  'the internal allowance has a one dollar hard cap'
);

select is(
  (select owner_id from public.ai_project_budgets where project_id = '83000000-0000-0000-0000-000000000008'),
  '62000000-0000-0000-0000-000000000006'::uuid,
  'the allowance remains attached to the Project owner'
);

set local role service_role;
set local request.jwt.claims = '{"sub":"62000000-0000-0000-0000-000000000006","role":"service_role"}';

select lives_ok(
  $$select public.reserve_ai_request(
      '83000000-0000-0000-0000-000000000008',
      '62000000-0000-0000-0000-000000000006',
      'frame_context',
      'proposal-request:001',
      100,
      4000,
      80400,
      'frame-context-v1',
      'ai-proposal-v1'
    )$$,
  'the Edge Function can reserve usage within the test allowance'
);

select lives_ok(
  $$select public.mark_ai_request_started(
      (select id from public.ai_requests where idempotency_key = 'proposal-request:001')
    )$$,
  'the reserved proposal request can start'
);

select lives_ok(
  $$select public.store_ai_proposal(
      (select id from public.ai_requests where idempotency_key = 'proposal-request:001'),
      'resp_proposal_001',
      '{
        "action":"frame_context",
        "decision_status":"proposed",
        "proposal":{"framing":"Focused problem","evidenceGaps":[]},
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
  'the service role can persist a structured proposal without raw prompts'
);

select is(
  (select count(*)::integer from public.ai_proposals),
  1,
  'one proposal is stored for the request'
);

select is(
  (select review_status from public.ai_proposals where openai_response_id = 'resp_proposal_001'),
  'proposed',
  'AI output remains proposed until an owner review action'
);

select is(
  (
    select envelope -> 'proposal' ->> 'framing'
    from public.ai_proposals
    where openai_response_id = 'resp_proposal_001'
  ),
  'Focused problem',
  'the structured proposal envelope is retained'
);

select lives_ok(
  $$select public.store_ai_proposal(
      (select id from public.ai_requests where idempotency_key = 'proposal-request:001'),
      'resp_proposal_001',
      '{
        "action":"frame_context",
        "decision_status":"proposed",
        "proposal":{"framing":"Focused problem","evidenceGaps":[]},
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
  'an exact proposal persistence retry is idempotent'
);

select throws_ok(
  $$select public.store_ai_proposal(
      (select id from public.ai_requests where idempotency_key = 'proposal-request:001'),
      'resp_proposal_001',
      '{
        "action":"frame_context",
        "decision_status":"proposed",
        "proposal":{"framing":"Different output","evidenceGaps":[]},
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
  'P0001',
  'AI request already has a different proposal',
  'an idempotent retry cannot replace a stored proposal'
);

select lives_ok(
  $$select public.finalize_ai_request(
      (select id from public.ai_requests where idempotency_key = 'proposal-request:001'),
      'completed',
      'resp_proposal_001',
      90,
      10,
      40,
      8,
      1120,
      null
    )$$,
  'the stored proposal usage can be reconciled as completed'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"62000000-0000-0000-0000-000000000006","role":"authenticated"}';

select is(
  (select count(*)::integer from public.ai_proposals),
  1,
  'the Project owner can read the proposal'
);

select ok(
  not has_table_privilege('authenticated', 'public.ai_proposals', 'UPDATE'),
  'authenticated users cannot update proposal review state directly'
);

set local request.jwt.claims = '{"sub":"72000000-0000-0000-0000-000000000007","role":"authenticated"}';

select is(
  (select count(*)::integer from public.ai_proposals),
  0,
  'another user cannot read the proposal'
);

select * from finish();
rollback;
