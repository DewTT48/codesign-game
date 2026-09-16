import { describe, expect, it, vi } from 'vitest'
import {
  createCodesignAiHandler,
  type AiProposalRecord,
  type CodesignAiDependencies,
} from '../../../../supabase/functions/_shared/codesign-ai/handler'

const projectId = '10000000-0000-4000-8000-000000000001'
const requestId = '20000000-0000-4000-8000-000000000002'

const proposalEnvelope = {
  action: 'frame_context',
  decision_status: 'proposed',
  proposal: { framing: 'A focused context', evidenceGaps: ['Observed frequency'] },
  questions: ['How often does this happen?'],
  warnings: [],
  consistency: { status: 'aligned', conflicts: [] },
}

const usage = {
  inputTokens: 100,
  cachedInputTokens: 20,
  cacheWriteTokens: 0,
  outputTokens: 50,
  reasoningTokens: 10,
}

const storedProposal: AiProposalRecord = {
  id: '30000000-0000-4000-8000-000000000003',
  request_id: requestId,
  action: 'frame_context',
  envelope: proposalEnvelope,
  openai_response_id: 'resp_123',
  usage,
  actual_cost_micros: 1_320,
  pricing_version: 'gpt-5.6-sol-2026-09-16',
  review_status: 'proposed',
  created_at: '2026-09-16T00:00:00.000Z',
}

function request(extra: Record<string, unknown> = {}) {
  return new Request('https://example.test/codesign-ai', {
    method: 'POST',
    headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
    body: JSON.stringify({
      projectId,
      action: 'frame_context',
      userDraft: { problem: 'Slow product alignment' },
      locale: 'en',
      idempotencyKey: 'ai-request:001',
      ...extra,
    }),
  })
}

function dependencies(overrides: Partial<CodesignAiDependencies> = {}): CodesignAiDependencies {
  return {
    isConfigured: true,
    authenticate: vi.fn().mockResolvedValue({ userId: 'user-1' }),
    loadProjectContext: vi.fn().mockResolvedValue({
      project: {
        id: projectId,
        mode: 'own',
        title: 'Hiring Workspace',
        topic: 'Structured hiring decisions',
        currentPhase: 'C',
      },
      decisions: [],
      phaseEntries: [],
    }),
    countInputTokens: vi.fn().mockResolvedValue(100),
    reserveRequest: vi.fn().mockResolvedValue({ id: requestId, status: 'reserved' }),
    findProposal: vi.fn().mockResolvedValue(null),
    markRequestStarted: vi.fn().mockResolvedValue({ id: requestId, status: 'in_progress' }),
    createResponse: vi.fn().mockResolvedValue({
      responseId: 'resp_123',
      envelope: proposalEnvelope,
      usage,
      actualCostMicros: 1_320,
    }),
    storeProposal: vi.fn().mockResolvedValue(storedProposal),
    finalizeRequest: vi.fn().mockResolvedValue({ id: requestId, status: 'completed' }),
    getUsageSummary: vi.fn().mockResolvedValue({
      status: 'enabled',
      used_requests: 1,
      max_requests: 5,
    }),
    ...overrides,
  }
}

describe('codesign-ai handler', () => {
  it('fails closed before authentication when the server secret is missing', async () => {
    const deps = dependencies({ isConfigured: false })
    const response = await createCodesignAiHandler(deps)(request())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'AI_NOT_CONFIGURED' },
    })
    expect(deps.authenticate).not.toHaveBeenCalled()
  })

  it('rejects browser attempts to select the model before any provider call', async () => {
    const deps = dependencies()
    const response = await createCodesignAiHandler(deps)(request({ model: 'gpt-client-choice' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    expect(deps.countInputTokens).not.toHaveBeenCalled()
    expect(deps.createResponse).not.toHaveBeenCalled()
  })

  it('reserves, stores, and reconciles a structured proposal', async () => {
    const deps = dependencies()
    const response = await createCodesignAiHandler(deps)(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      proposal: {
        requestId,
        envelope: proposalEnvelope,
        reviewStatus: 'proposed',
      },
      usageSummary: { used_requests: 1, max_requests: 5 },
      idempotent: false,
    })
    expect(deps.reserveRequest).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'user-1',
      estimatedInputTokens: 100,
      reservedOutputTokens: 4_000,
    }))
    expect(deps.storeProposal).toHaveBeenCalledTimes(1)
    expect(deps.finalizeRequest).toHaveBeenCalledWith(expect.objectContaining({
      requestId,
      status: 'completed',
      responseId: 'resp_123',
      actualCostMicros: 1_320,
    }))
  })

  it('returns the saved proposal for an idempotent retry without generating again', async () => {
    const deps = dependencies({
      reserveRequest: vi.fn().mockResolvedValue({ id: requestId, status: 'completed' }),
      findProposal: vi.fn().mockResolvedValue(storedProposal),
    })
    const response = await createCodesignAiHandler(deps)(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ idempotent: true })
    expect(deps.markRequestStarted).not.toHaveBeenCalled()
    expect(deps.createResponse).not.toHaveBeenCalled()
  })

  it('does not retry or release an in-progress reservation after an uncertain network failure', async () => {
    const deps = dependencies({
      createResponse: vi.fn().mockRejectedValue(new TypeError('network connection lost')),
    })
    const response = await createCodesignAiHandler(deps)(request())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'AI_RECONCILIATION_REQUIRED' },
    })
    expect(deps.finalizeRequest).not.toHaveBeenCalled()
    expect(deps.storeProposal).not.toHaveBeenCalled()
  })
})
