import { requireSupabase } from '../../../lib/supabase/client'
import type { AiProposalRow, Json } from '../../../lib/supabase/database.types'
import { aiProposalEnvelopeSchema, type AiProposalEnvelope } from './aiProposal.schemas'
import type { AiAction } from './aiPolicy'

export type AiUsageSummary = {
  status: 'disabled' | 'enabled' | 'exhausted'
  max_requests: number
  used_requests: number
  reserved_requests: number
  max_input_tokens: number
  used_input_tokens: number
  reserved_input_tokens: number
  max_output_tokens: number
  used_output_tokens: number
  reserved_output_tokens: number
  max_total_tokens: number
  max_cost_micros: number
  used_cost_micros: number
  reserved_cost_micros: number
}

export type AiProposalView = {
  id: string
  requestId: string
  action: AiAction
  envelope: AiProposalEnvelope
  reviewStatus: AiProposalRow['review_status']
  createdAt: string
}

type InvokeResponse = {
  proposal: {
    id: string
    requestId: string
    action: AiAction
    envelope: unknown
    reviewStatus: AiProposalRow['review_status']
    createdAt: string
  }
  usageSummary: AiUsageSummary | null
  idempotent: boolean
}

export class CodesignAiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'CodesignAiError'
  }
}

function parseProposal(input: InvokeResponse['proposal']): AiProposalView {
  return {
    id: input.id,
    requestId: input.requestId,
    action: input.action,
    envelope: aiProposalEnvelopeSchema.parse(input.envelope),
    reviewStatus: input.reviewStatus,
    createdAt: input.createdAt,
  }
}

async function functionError(error: unknown): Promise<CodesignAiError> {
  const fallback = error instanceof Error ? error.message : 'CODESIGN AI request failed.'
  const context = (error as { context?: Response } | null)?.context
  if (!context) return new CodesignAiError('AI_REQUEST_FAILED', fallback)
  const payload = await context.clone().json().catch(() => null) as {
    error?: { code?: string; message?: string }
  } | null
  return new CodesignAiError(
    payload?.error?.code ?? 'AI_REQUEST_FAILED',
    payload?.error?.message ?? fallback,
    context.status,
  )
}

export function createAiIdempotencyKey(projectId: string, action: AiAction) {
  const uniquePart = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `own:${projectId}:${action}:${uniquePart}`
}

export async function invokeCodesignAi(input: {
  projectId: string
  action: AiAction
  userDraft: Json
  locale: 'th' | 'en'
  idempotencyKey: string
}): Promise<{ proposal: AiProposalView; usageSummary: AiUsageSummary | null; idempotent: boolean }> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke<InvokeResponse>('codesign-ai', {
    body: input,
  })
  if (error) throw await functionError(error)
  if (!data?.proposal) throw new CodesignAiError('AI_OUTPUT_INVALID', 'CODESIGN AI returned no proposal.')
  return {
    proposal: parseProposal(data.proposal),
    usageSummary: data.usageSummary,
    idempotent: data.idempotent,
  }
}

export async function getAiUsageSummary(projectId: string): Promise<AiUsageSummary | null> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_ai_usage_summary', {
    target_project_id: projectId,
  })
  if (error) throw error
  return data as AiUsageSummary | null
}

export async function getPendingAiProposal(
  projectId: string,
  action: AiAction,
): Promise<AiProposalView | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('ai_proposals')
    .select('*')
    .eq('project_id', projectId)
    .eq('action', action)
    .eq('review_status', 'proposed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    requestId: data.request_id,
    action: data.action,
    envelope: aiProposalEnvelopeSchema.parse(data.envelope),
    reviewStatus: data.review_status,
    createdAt: data.created_at,
  }
}

export async function reviewAiProposal(input: {
  proposalId: string
  reviewAction: 'accepted' | 'rejected'
  reviewContent?: Json | null
}): Promise<AiProposalRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('review_ai_proposal', {
    target_proposal_id: input.proposalId,
    target_review_action: input.reviewAction,
    target_review_content: input.reviewContent ?? null,
  })
  if (error) throw error
  return data
}
