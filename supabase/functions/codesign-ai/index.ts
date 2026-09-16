/* global Deno */
import { createClient } from 'npm:@supabase/supabase-js@2.112.4'
import { createCodesignAiHandler, type AiProposalRecord } from '../_shared/codesign-ai/handler.ts'
import {
  OPENAI_PRICING_VERSION,
  countOpenAiInputTokens,
  createOpenAiStructuredResponse,
  hashSafetyIdentifier,
  type OpenAiUsage,
} from '../_shared/codesign-ai/openaiClient.ts'
import type {
  DecisionSnapshot,
  JsonValue,
  PhaseEntrySnapshot,
} from '../_shared/codesign-ai/promptAssembly.ts'

const allowedOrigins = new Set([
  'https://dewtt48.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const openAiApiKey = Deno.env.get('OPENAI_API_KEY') ?? ''
const service = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  : null

function unwrapRpcRow<T>(value: T | T[]): T {
  if (Array.isArray(value)) {
    if (value.length !== 1) throw new Error('Expected one database row.')
    return value[0]
  }
  return value
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

const handle = createCodesignAiHandler({
  isConfigured: Boolean(service && openAiApiKey),

  async authenticate(request) {
    if (!service) return null
    const authorization = request.headers.get('authorization') ?? ''
    const match = authorization.match(/^Bearer\s+(.+)$/i)
    if (!match) return null
    const { data, error } = await service.auth.getUser(match[1])
    if (error || !data.user) return null
    return { userId: data.user.id }
  },

  async loadProjectContext(projectId, userId) {
    if (!service) return null
    const { data: project, error: projectError } = await service
      .from('projects')
      .select('id, owner_id, mode, title, topic, current_phase, status')
      .eq('id', projectId)
      .eq('owner_id', userId)
      .eq('mode', 'own')
      .neq('status', 'archived')
      .maybeSingle()
    throwIfError(projectError)
    if (!project) return null

    const [decisionResult, phaseEntryResult] = await Promise.all([
      service
        .from('decisions')
        .select('id, phase, decision_type, content, version, is_current')
        .eq('project_id', projectId)
        .eq('is_current', true),
      service
        .from('phase_entries')
        .select('id, phase, section, field_key, content, status, version, is_current')
        .eq('project_id', projectId)
        .eq('is_current', true)
        .eq('status', 'locked'),
    ])
    throwIfError(decisionResult.error)
    throwIfError(phaseEntryResult.error)

    return {
      project: {
        id: project.id,
        mode: 'own' as const,
        title: project.title,
        topic: project.topic,
        currentPhase: project.current_phase,
      },
      decisions: (decisionResult.data ?? []).map((decision): DecisionSnapshot => ({
        id: decision.id,
        phase: decision.phase,
        decisionType: decision.decision_type,
        content: decision.content as JsonValue,
        version: decision.version,
        isCurrent: decision.is_current,
      })),
      phaseEntries: (phaseEntryResult.data ?? []).map((entry): PhaseEntrySnapshot => ({
        id: entry.id,
        phase: entry.phase,
        section: entry.section,
        fieldKey: entry.field_key,
        content: entry.content as JsonValue,
        status: entry.status,
        version: entry.version,
        isCurrent: entry.is_current,
      })),
    }
  },

  countInputTokens({ instructions, userInput }) {
    return countOpenAiInputTokens({
      apiKey: openAiApiKey,
      instructions,
      userInput,
      signal: AbortSignal.timeout(20_000),
    })
  },

  async reserveRequest(input) {
    if (!service) throw new Error('AI service is not configured.')
    const { data, error } = await service.rpc('reserve_ai_request', {
      target_project_id: input.projectId,
      target_owner_id: input.ownerId,
      target_action: input.action,
      target_idempotency_key: input.idempotencyKey,
      target_estimated_input_tokens: input.estimatedInputTokens,
      target_reserved_output_tokens: input.reservedOutputTokens,
      target_reserved_cost_micros: input.reservedCostMicros,
      target_prompt_template_version: input.promptTemplateVersion,
      target_output_schema_version: input.outputSchemaVersion,
    })
    throwIfError(error)
    return unwrapRpcRow(data)
  },

  async findProposal(requestId) {
    if (!service) return null
    const { data, error } = await service
      .from('ai_proposals')
      .select('id, request_id, action, envelope, openai_response_id, usage, actual_cost_micros, pricing_version, review_status, created_at')
      .eq('request_id', requestId)
      .maybeSingle()
    throwIfError(error)
    return data as AiProposalRecord | null
  },

  async markRequestStarted(requestId) {
    if (!service) throw new Error('AI service is not configured.')
    const { data, error } = await service.rpc('mark_ai_request_started', {
      target_request_id: requestId,
    })
    throwIfError(error)
    return unwrapRpcRow(data)
  },

  async createResponse(input) {
    return createOpenAiStructuredResponse({
      apiKey: openAiApiKey,
      action: input.action,
      reasoningEffort: input.reasoningEffort,
      instructions: input.instructions,
      userInput: input.userInput,
      maxOutputTokens: input.maxOutputTokens,
      safetyIdentifier: await hashSafetyIdentifier(input.userId),
      signal: AbortSignal.timeout(120_000),
    })
  },

  async storeProposal({ requestId, response }) {
    if (!service) throw new Error('AI service is not configured.')
    const { data, error } = await service.rpc('store_ai_proposal', {
      target_request_id: requestId,
      target_openai_response_id: response.responseId,
      target_envelope: response.envelope,
      target_usage: response.usage,
      target_actual_cost_micros: response.actualCostMicros,
      target_pricing_version: OPENAI_PRICING_VERSION,
    })
    throwIfError(error)
    return unwrapRpcRow(data) as AiProposalRecord
  },

  async finalizeRequest(input) {
    if (!service) throw new Error('AI service is not configured.')
    const usage: OpenAiUsage = input.usage
    const { data, error } = await service.rpc('finalize_ai_request', {
      target_request_id: input.requestId,
      target_status: input.status,
      target_openai_response_id: input.responseId,
      target_input_tokens: usage.inputTokens,
      target_cached_input_tokens: usage.cachedInputTokens,
      target_output_tokens: usage.outputTokens,
      target_reasoning_tokens: usage.reasoningTokens,
      target_actual_cost_micros: input.actualCostMicros,
      target_error_code: input.errorCode,
    })
    throwIfError(error)
    return unwrapRpcRow(data)
  },

  async getUsageSummary(projectId) {
    if (!service) return null
    const { data, error } = await service.rpc('get_ai_usage_summary', {
      target_project_id: projectId,
    })
    throwIfError(error)
    return data as JsonValue | null
  },
})

Deno.serve(async (request) => {
  const origin = request.headers.get('origin')
  const isAllowedOrigin = !origin || allowedOrigins.has(origin)
  const corsHeaders: Record<string, string> = {
    vary: 'Origin',
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
    'access-control-allow-methods': 'POST, OPTIONS',
  }
  if (origin && isAllowedOrigin) corsHeaders['access-control-allow-origin'] = origin

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: isAllowedOrigin ? 204 : 403, headers: corsHeaders })
  }
  if (!isAllowedOrigin) {
    return new Response(JSON.stringify({
      error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This origin is not allowed.' },
    }), {
      status: 403,
      headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' },
    })
  }

  const response = await handle(request)
  const headers = new Headers(response.headers)
  Object.entries(corsHeaders).forEach(([name, value]) => headers.set(name, value))
  return new Response(response.body, { status: response.status, headers })
})
