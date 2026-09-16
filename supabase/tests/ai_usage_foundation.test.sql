begin;

select plan(44);

insert into auth.users (id, email)
values
  ('51000000-0000-0000-0000-000000000005', 'ai-admin@example.com'),
  ('61000000-0000-0000-0000-000000000006', 'ai-player@example.com'),
  ('71000000-0000-0000-0000-000000000007', 'ai-other@example.com');

insert into private.admin_users (user_id)
values ('51000000-0000-0000-0000-000000000005');

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
    '81000000-0000-0000-0000-000000000008',
    '61000000-0000-0000-0000-000000000006',
    'own',
    'AI OWN PROJECT',
    'AI product work',
    'idea'
  ),
  (
    '82000000-0000-0000-0000-000000000009',
    '61000000-0000-0000-0000-000000000006',
    'guided',
    'GUIDED PROJECT',
    '21 Days',
    'idea'
  );

select throws_ok(
  $$insert into public.ai_project_budgets (project_id, owner_id)
    values (
      '82000000-0000-0000-0000-000000000009',
      '61000000-0000-0000-0000-000000000006'
    )$$,
  'P0001',
  'AI budget requires an own-mode Project and its owner',
  'a Guided project cannot receive an Own Project AI budget'
);

select lives_ok(
  $$insert into public.ai_project_budgets (project_id, owner_id)
    values (
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006'
    )$$,
  'an Own Project starts with a disabled AI budget'
);

set local role service_role;
set local request.jwt.claims = '{"sub":"61000000-0000-0000-0000-000000000006","role":"service_role"}';

select throws_ok(
  $$select public.reserve_ai_request(
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'challenge_assumptions',
      'ai-request:001',
      20,
      20,
      200,
      'challenge-assumptions-v1',
      'ai-proposal-v1'
    )$$,
  'P0001',
  'AI allowance is not configured for this Project',
  'a disabled allowance fails closed before reserving usage'
);

reset role;

update public.ai_project_budgets
set status = 'enabled',
    max_requests = 2,
    max_input_tokens = 100,
    max_output_tokens = 100,
    max_total_tokens = 200,
    max_cost_micros = 1000,
    configured_at = timezone('utc', now())
where project_id = '81000000-0000-0000-0000-000000000008';

set local role service_role;
set local request.jwt.claims = '{"sub":"61000000-0000-0000-0000-000000000006","role":"service_role"}';

select lives_ok(
  $$select public.reserve_ai_request(
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'challenge_assumptions',
      'ai-request:001',
      20,
      20,
      200,
      'challenge-assumptions-v1',
      'ai-proposal-v1'
    )$$,
  'the service role can reserve a request within every hard limit'
);

select is(
  (select reasoning_effort from public.ai_requests where idempotency_key = 'ai-request:001'),
  'high',
  'reasoning effort is selected by the server-side action policy'
);

select is(
  (select model from public.ai_requests where idempotency_key = 'ai-request:001'),
  'gpt-5.6-sol',
  'the request is locked to the approved model'
);

select is(
  (select status from public.ai_requests where idempotency_key = 'ai-request:001'),
  'reserved',
  'a new request begins in reserved state'
);

select is(
  (
    select reserved_requests
    from public.ai_project_budgets
    where project_id = '81000000-0000-0000-0000-000000000008'
  ),
  1,
  'reserving a request increments the atomic reservation counter'
);

select is(
  (
    select id
    from public.reserve_ai_request(
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'challenge_assumptions',
      'ai-request:001',
      20,
      20,
      200,
      'challenge-assumptions-v1',
      'ai-proposal-v1'
    )
  ),
  (select id from public.ai_requests where idempotency_key = 'ai-request:001'),
  'an exact idempotent retry returns the existing reservation'
);

select is(
  (select count(*)::integer from public.ai_requests),
  1,
  'an idempotent retry does not duplicate the request ledger'
);

select throws_ok(
  $$select public.reserve_ai_request(
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'challenge_assumptions',
      'ai-request:001',
      21,
      20,
      200,
      'challenge-assumptions-v1',
      'ai-proposal-v1'
    )$$,
  'P0001',
  'AI idempotency key was reused with different request parameters',
  'an idempotency key cannot be reused with a different payload'
);

select throws_ok(
  $$select public.reserve_ai_request(
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'frame_context',
      'ai-request:active-002',
      10,
      10,
      100,
      'frame-context-v1',
      'ai-proposal-v1'
    )$$,
  'P0001',
  'Another AI request is already active for this Project',
  'only one AI request can be active for a Project'
);

select lives_ok(
  $$select public.mark_ai_request_started(
      (select id from public.ai_requests where idempotency_key = 'ai-request:001')
    )$$,
  'a reserved request can be marked in progress'
);

select is(
  (select status from public.ai_requests where idempotency_key = 'ai-request:001'),
  'in_progress',
  'the started request is in progress'
);

select is(
  (select reservation_expires_at from public.ai_requests where idempotency_key = 'ai-request:001'),
  null::timestamptz,
  'an in-progress request no longer has an auto-release deadline'
);

select lives_ok(
  $$select public.finalize_ai_request(
      (select id from public.ai_requests where idempotency_key = 'ai-request:001'),
      'completed',
      'resp_ai_001',
      18,
      3,
      12,
      4,
      180,
      null
    )$$,
  'a completed request reconciles reserved and actual usage'
);

select lives_ok(
  $$select public.finalize_ai_request(
      (select id from public.ai_requests where idempotency_key = 'ai-request:001'),
      'completed',
      'resp_ai_001',
      18,
      3,
      12,
      4,
      180,
      null
    )$$,
  'an exact finalization retry is idempotent'
);

select throws_ok(
  $$select public.finalize_ai_request(
      (select id from public.ai_requests where idempotency_key = 'ai-request:001'),
      'completed',
      'resp_ai_001',
      19,
      3,
      12,
      4,
      180,
      null
    )$$,
  'P0001',
  'AI request was already finalized with different usage',
  'a finalization retry cannot silently replace reconciled usage'
);

select is(
  (select status from public.ai_requests where idempotency_key = 'ai-request:001'),
  'completed',
  'the first request is completed'
);

select is(
  (select total_tokens from public.ai_requests where idempotency_key = 'ai-request:001'),
  30::bigint,
  'total tokens equal input plus output without double-counting details'
);

select is(
  (select openai_response_id from public.ai_requests where idempotency_key = 'ai-request:001'),
  'resp_ai_001',
  'the upstream response ID is retained for reconciliation'
);

select is(
  (select used_requests from public.ai_project_budgets where project_id = '81000000-0000-0000-0000-000000000008'),
  1,
  'finalization increments used request count'
);

select is(
  (select used_input_tokens from public.ai_project_budgets where project_id = '81000000-0000-0000-0000-000000000008'),
  18::bigint,
  'actual input usage is recorded'
);

select is(
  (select used_output_tokens from public.ai_project_budgets where project_id = '81000000-0000-0000-0000-000000000008'),
  12::bigint,
  'actual output usage is recorded'
);

select is(
  (select reserved_requests from public.ai_project_budgets where project_id = '81000000-0000-0000-0000-000000000008'),
  0,
  'finalization releases the request reservation'
);

select lives_ok(
  $$select public.reserve_ai_request(
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'draft_prd',
      'ai-request:002',
      20,
      20,
      200,
      'draft-prd-v1',
      'ai-proposal-v1'
    )$$,
  'a second request can reserve the remaining request allowance'
);

select is(
  (select reasoning_effort from public.ai_requests where idempotency_key = 'ai-request:002'),
  'xhigh',
  'PRD drafting uses xhigh reasoning effort'
);

select lives_ok(
  $$select public.mark_ai_request_started(
      (select id from public.ai_requests where idempotency_key = 'ai-request:002')
    )$$,
  'the second request can start'
);

select lives_ok(
  $$select public.finalize_ai_request(
      (select id from public.ai_requests where idempotency_key = 'ai-request:002'),
      'failed',
      null,
      5,
      0,
      0,
      0,
      20,
      'upstream_timeout'
    )$$,
  'a failed upstream request still reconciles known usage'
);

select is(
  (select error_code from public.ai_requests where idempotency_key = 'ai-request:002'),
  'upstream_timeout',
  'a failed request records a normalized error code'
);

select is(
  (select status from public.ai_project_budgets where project_id = '81000000-0000-0000-0000-000000000008'),
  'exhausted',
  'reaching a hard request boundary exhausts the allowance'
);

select throws_ok(
  $$select public.reserve_ai_request(
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'frame_context',
      'ai-request:003',
      1,
      1,
      1,
      'frame-context-v1',
      'ai-proposal-v1'
    )$$,
  'P0001',
  'AI allowance is exhausted for this Project',
  'an exhausted budget fails closed before another request'
);

select is(
  (select used_requests from public.ai_project_budgets where project_id = '81000000-0000-0000-0000-000000000008'),
  2,
  'both started requests count against the request allowance'
);

select is(
  (select used_cost_micros from public.ai_project_budgets where project_id = '81000000-0000-0000-0000-000000000008'),
  200::bigint,
  'actual cost is accumulated across completed and failed requests'
);

select is(
  (select reserved_requests from public.ai_project_budgets where project_id = '81000000-0000-0000-0000-000000000008'),
  0,
  'no reservation remains after both requests are finalized'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"61000000-0000-0000-0000-000000000006","role":"authenticated"}';

select is(
  (select count(*)::integer from public.ai_requests),
  2,
  'the owner can read their AI request ledger'
);

select is(
  (
    select (public.get_ai_usage_summary('81000000-0000-0000-0000-000000000008') ->> 'used_requests')::integer
  ),
  2,
  'the owner can read the Project usage summary'
);

select throws_ok(
  $$insert into public.ai_requests (
      project_id,
      owner_id,
      action,
      reasoning_effort,
      idempotency_key,
      prompt_template_version,
      output_schema_version,
      estimated_input_tokens,
      reserved_output_tokens,
      reserved_cost_micros
    ) values (
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'frame_context',
      'medium',
      'browser-bypass:001',
      'frame-context-v1',
      'ai-proposal-v1',
      1,
      1,
      1
    )$$,
  '42501',
  null,
  'a browser session cannot write directly to the AI ledger'
);

select throws_ok(
  $$select public.reserve_ai_request(
      '81000000-0000-0000-0000-000000000008',
      '61000000-0000-0000-0000-000000000006',
      'frame_context',
      'browser-call:001',
      1,
      1,
      1,
      'frame-context-v1',
      'ai-proposal-v1'
    )$$,
  '42501',
  null,
  'an authenticated browser session cannot execute the reservation RPC'
);

set local request.jwt.claims = '{"sub":"71000000-0000-0000-0000-000000000007","role":"authenticated"}';

select is(
  (select count(*)::integer from public.ai_requests),
  0,
  'another user cannot read the owner AI request ledger'
);

select is(
  public.get_ai_usage_summary('81000000-0000-0000-0000-000000000008'),
  null::jsonb,
  'another user cannot read the owner usage summary'
);

set local request.jwt.claims = '{"sub":"51000000-0000-0000-0000-000000000005","role":"authenticated"}';

select is(
  (select count(*)::integer from public.ai_requests),
  2,
  'an admin can read the AI request ledger for support'
);

select is(
  (
    select (public.get_ai_usage_summary('81000000-0000-0000-0000-000000000008') ->> 'used_requests')::integer
  ),
  2,
  'an admin can read the Project usage summary for support'
);

select throws_ok(
  $$update public.ai_project_budgets
    set used_requests = 0
    where project_id = '81000000-0000-0000-0000-000000000008'$$,
  '42501',
  null,
  'admin support access is read-only at the table boundary'
);

select * from finish();
rollback;
