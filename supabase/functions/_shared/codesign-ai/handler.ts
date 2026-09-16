import {
  OpenAiCompletedResponseError,
  OpenAiHttpError,
  estimateReservedCostMicros,
  type OpenAiStructuredResponse,
  type OpenAiUsage,
} from './openaiClient.ts'
import {
  assembleCodesignAiPrompt,
  getCodesignAiServerPolicy,
  type DecisionSnapshot,
  type JsonValue,
  type PhaseEntrySnapshot,
} from './promptAssembly.ts'
import { validateCodesignAiRequest } from './requestValidation.ts'

const MAX_INPUT_TOKENS_PER_REQUEST = 40_000

export type AiProjectContext = {
  project: {
    id: string
    mode: 'own'
    title: string
    topic: string
    currentPhase: string
  }
  decisions: DecisionSnapshot[]
  phaseEntries: PhaseEntrySnapshot[]
}

export type AiRequestRecord = {
  id: string
  status: 'reserved' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
}

export type AiProposalRecord = {
  id: string
  request_id: string
  action: string
  envelope: JsonValue
  openai_response_id: string
  usage: JsonValue
  actual_cost_micros: number
  pricing_version: string
  review_status: 'proposed' | 'accepted' | 'rejected'
  created_at: string
}

export type CodesignAiDependencies = {
  isConfigured: boolean
  authenticate(request: Request): Promise<{ userId: string } | null>
  loadProjectContext(projectId: string, userId: string): Promise<AiProjectContext | null>
  countInputTokens(input: { instructions: string; userInput: string }): Promise<number>
  reserveRequest(input: {
    projectId: string
    ownerId: string
    action: string
    idempotencyKey: string
    estimatedInputTokens: number
    reservedOutputTokens: number
    reservedCostMicros: number
    promptTemplateVersion: string
    outputSchemaVersion: string
  }): Promise<AiRequestRecord>
  findProposal(requestId: string): Promise<AiProposalRecord | null>
  markRequestStarted(requestId: string): Promise<AiRequestRecord>
  createResponse(input: {
    action: Parameters<typeof getCodesignAiServerPolicy>[0]
    reasoningEffort: ReturnType<typeof getCodesignAiServerPolicy>['reasoningEffort']
    instructions: string
    userInput: string
    maxOutputTokens: number
    userId: string
  }): Promise<OpenAiStructuredResponse>
  storeProposal(input: {
    requestId: string
    response: OpenAiStructuredResponse
  }): Promise<AiProposalRecord>
  finalizeRequest(input: {
    requestId: string
    status: 'completed' | 'failed' | 'cancelled'
    responseId: string | null
    usage: OpenAiUsage
    actualCostMicros: number
    errorCode: string | null
  }): Promise<AiRequestRecord>
  getUsageSummary(projectId: string): Promise<JsonValue | null>
}

type ApiErrorCode =
  | 'AI_NOT_CONFIGURED'
  | 'AUTH_REQUIRED'
  | 'INVALID_REQUEST'
  | 'PROJECT_ACCESS_DENIED'
  | 'AI_INPUT_TOO_LARGE'
  | 'AI_ALLOWANCE_REQUIRED'
  | 'AI_ALLOWANCE_EXHAUSTED'
  | 'AI_LIMIT_REACHED'
  | 'AI_REQUEST_IN_PROGRESS'
  | 'AI_IDEMPOTENCY_CONFLICT'
  | 'AI_UPSTREAM_REJECTED'
  | 'AI_OUTPUT_INVALID'
  | 'AI_RECONCILIATION_REQUIRED'
  | 'AI_INTERNAL_ERROR'

const emptyUsage: OpenAiUsage = {
  inputTokens: 0,
  cachedInputTokens: 0,
  cacheWriteTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
}

function jsonResponse(status: number, body: JsonValue) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return jsonResponse(status, { error: { code, message } })
}

function isDefinitiveProviderRejection(error: unknown): error is OpenAiHttpError {
  return error instanceof OpenAiHttpError && error.status < 500 && error.status !== 408
}

function databaseError(error: unknown): Response {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('allowance is not configured')) {
    return errorResponse(403, 'AI_ALLOWANCE_REQUIRED', 'AI test allowance is not enabled for this Project.')
  }
  if (message.includes('allowance is exhausted')) {
    return errorResponse(429, 'AI_ALLOWANCE_EXHAUSTED', 'AI allowance is exhausted for this Project.')
  }
  if (message.includes('limit reached')) {
    return errorResponse(429, 'AI_LIMIT_REACHED', 'This request would exceed the Project AI allowance.')
  }
  if (message.includes('already active')) {
    return errorResponse(409, 'AI_REQUEST_IN_PROGRESS', 'Another AI request is already active for this Project.')
  }
  if (message.includes('idempotency key')) {
    return errorResponse(409, 'AI_IDEMPOTENCY_CONFLICT', 'This request key was already used with different input.')
  }
  return errorResponse(500, 'AI_INTERNAL_ERROR', 'The AI request could not be recorded safely.')
}

function proposalResponse(
  proposal: AiProposalRecord,
  usageSummary: JsonValue | null,
  idempotent: boolean,
) {
  return jsonResponse(200, {
    proposal: {
      id: proposal.id,
      requestId: proposal.request_id,
      action: proposal.action,
      envelope: proposal.envelope,
      reviewStatus: proposal.review_status,
      createdAt: proposal.created_at,
    },
    usageSummary,
    idempotent,
  })
}

async function finalizeKnownFailure(
  dependencies: CodesignAiDependencies,
  requestId: string,
  error: OpenAiCompletedResponseError,
) {
  await dependencies.finalizeRequest({
    requestId,
    status: 'failed',
    responseId: error.responseId,
    usage: error.usage,
    actualCostMicros: error.actualCostMicros,
    errorCode: 'invalid_structured_output',
  })
}

export function createCodesignAiHandler(dependencies: CodesignAiDependencies) {
  return async function handleCodesignAi(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return errorResponse(405, 'INVALID_REQUEST', 'Only POST is supported.')
    }
    if (!dependencies.isConfigured) {
      return errorResponse(503, 'AI_NOT_CONFIGURED', 'CODESIGN AI is not configured yet.')
    }

    const authenticated = await dependencies.authenticate(request).catch(() => null)
    if (!authenticated) {
      return errorResponse(401, 'AUTH_REQUIRED', 'Please sign in before using CODESIGN AI.')
    }

    const rawBody: unknown = await request.json().catch(() => null)
    const validated = validateCodesignAiRequest(rawBody)
    if (!validated.success) {
      return errorResponse(400, 'INVALID_REQUEST', validated.error)
    }
    const body = validated.data

    const context = await dependencies.loadProjectContext(body.projectId, authenticated.userId)
      .catch(() => null)
    if (!context) {
      return errorResponse(403, 'PROJECT_ACCESS_DENIED', 'Active own-mode Project access is required.')
    }

    const prompt = assembleCodesignAiPrompt({
      action: body.action,
      locale: body.locale,
      project: context.project,
      decisions: context.decisions,
      phaseEntries: context.phaseEntries,
      userDraft: body.userDraft,
    })
    const policy = getCodesignAiServerPolicy(body.action)

    let inputTokens: number
    try {
      inputTokens = await dependencies.countInputTokens({
        instructions: prompt.developerInstructions,
        userInput: prompt.userInput,
      })
    } catch (error) {
      if (isDefinitiveProviderRejection(error)) {
        return errorResponse(502, 'AI_UPSTREAM_REJECTED', 'The AI provider rejected the token-count request.')
      }
      return errorResponse(503, 'AI_RECONCILIATION_REQUIRED', 'AI input could not be counted safely. Please try again later.')
    }

    if (inputTokens > MAX_INPUT_TOKENS_PER_REQUEST) {
      return errorResponse(413, 'AI_INPUT_TOO_LARGE', 'This request exceeds the 40,000 input-token safety limit.')
    }

    const reservedCostMicros = estimateReservedCostMicros(inputTokens, policy.maxOutputTokens)
    let aiRequest: AiRequestRecord
    try {
      aiRequest = await dependencies.reserveRequest({
        projectId: body.projectId,
        ownerId: authenticated.userId,
        action: body.action,
        idempotencyKey: body.idempotencyKey,
        estimatedInputTokens: inputTokens,
        reservedOutputTokens: policy.maxOutputTokens,
        reservedCostMicros,
        promptTemplateVersion: prompt.promptTemplateVersion,
        outputSchemaVersion: prompt.outputSchemaVersion,
      })
    } catch (error) {
      return databaseError(error)
    }

    const existingProposal = await dependencies.findProposal(aiRequest.id).catch(() => null)
    if (existingProposal) {
      if (aiRequest.status !== 'completed') {
        const usage = existingProposal.usage as Record<string, JsonValue>
        try {
          await dependencies.finalizeRequest({
            requestId: aiRequest.id,
            status: 'completed',
            responseId: existingProposal.openai_response_id,
            usage: {
              inputTokens: Number(usage.inputTokens ?? 0),
              cachedInputTokens: Number(usage.cachedInputTokens ?? 0),
              cacheWriteTokens: Number(usage.cacheWriteTokens ?? 0),
              outputTokens: Number(usage.outputTokens ?? 0),
              reasoningTokens: Number(usage.reasoningTokens ?? 0),
            },
            actualCostMicros: existingProposal.actual_cost_micros,
            errorCode: null,
          })
        } catch {
          return errorResponse(503, 'AI_RECONCILIATION_REQUIRED', 'The saved AI proposal still needs usage reconciliation.')
        }
      }
      const usageSummary = await dependencies.getUsageSummary(body.projectId).catch(() => null)
      return proposalResponse(existingProposal, usageSummary, true)
    }

    if (aiRequest.status !== 'reserved') {
      return errorResponse(409, 'AI_RECONCILIATION_REQUIRED', 'This AI request cannot be repeated until its prior attempt is reconciled.')
    }

    try {
      await dependencies.markRequestStarted(aiRequest.id)
    } catch {
      return errorResponse(503, 'AI_RECONCILIATION_REQUIRED', 'The AI request could not be started safely.')
    }

    let response: OpenAiStructuredResponse
    try {
      response = await dependencies.createResponse({
        action: body.action,
        reasoningEffort: policy.reasoningEffort,
        instructions: prompt.developerInstructions,
        userInput: prompt.userInput,
        maxOutputTokens: policy.maxOutputTokens,
        userId: authenticated.userId,
      })
    } catch (error) {
      if (error instanceof OpenAiCompletedResponseError) {
        try {
          await finalizeKnownFailure(dependencies, aiRequest.id, error)
        } catch {
          return errorResponse(503, 'AI_RECONCILIATION_REQUIRED', 'AI usage needs reconciliation before another request.')
        }
        return errorResponse(502, 'AI_OUTPUT_INVALID', 'The AI response did not match the required proposal format.')
      }
      if (isDefinitiveProviderRejection(error)) {
        try {
          await dependencies.finalizeRequest({
            requestId: aiRequest.id,
            status: 'failed',
            responseId: null,
            usage: emptyUsage,
            actualCostMicros: 0,
            errorCode: `openai_http_${error.status}`,
          })
        } catch {
          return errorResponse(503, 'AI_RECONCILIATION_REQUIRED', 'AI usage needs reconciliation before another request.')
        }
        return errorResponse(502, 'AI_UPSTREAM_REJECTED', 'The AI provider rejected the request.')
      }
      return errorResponse(503, 'AI_RECONCILIATION_REQUIRED', 'The AI result is uncertain and will not be retried automatically.')
    }

    let proposal: AiProposalRecord
    try {
      proposal = await dependencies.storeProposal({ requestId: aiRequest.id, response })
    } catch {
      try {
        await dependencies.finalizeRequest({
          requestId: aiRequest.id,
          status: 'failed',
          responseId: response.responseId,
          usage: response.usage,
          actualCostMicros: response.actualCostMicros,
          errorCode: 'proposal_persistence_failed',
        })
      } catch {
        return errorResponse(503, 'AI_RECONCILIATION_REQUIRED', 'The AI proposal and usage need manual reconciliation.')
      }
      return errorResponse(500, 'AI_INTERNAL_ERROR', 'The AI proposal could not be saved.')
    }

    try {
      await dependencies.finalizeRequest({
        requestId: aiRequest.id,
        status: 'completed',
        responseId: response.responseId,
        usage: response.usage,
        actualCostMicros: response.actualCostMicros,
        errorCode: null,
      })
    } catch {
      return errorResponse(503, 'AI_RECONCILIATION_REQUIRED', 'The AI proposal was saved, but usage reconciliation is pending.')
    }

    const usageSummary = await dependencies.getUsageSummary(body.projectId).catch(() => null)
    return proposalResponse(proposal, usageSummary, false)
  }
}
