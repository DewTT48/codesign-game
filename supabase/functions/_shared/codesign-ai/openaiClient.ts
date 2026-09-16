import type { CodesignAiAction, JsonValue } from './promptAssembly.ts'
import { getAiProposalJsonSchema, validateAiProposalEnvelope } from './structuredOutput.ts'

export type AiReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh'

export const OPENAI_MODEL = 'gpt-5.6-sol' as const
export const OPENAI_PRICING_VERSION = 'gpt-5.6-sol-2026-09-16' as const

const inputMicrosPerToken = 4
const cachedInputMicrosPerToken = 0.4
const cacheWriteMicrosPerToken = 5
const outputMicrosPerToken = 20

export type OpenAiUsage = {
  inputTokens: number
  cachedInputTokens: number
  cacheWriteTokens: number
  outputTokens: number
  reasoningTokens: number
}

export type OpenAiStructuredResponse = {
  responseId: string
  envelope: JsonValue
  usage: OpenAiUsage
  actualCostMicros: number
}

type Fetcher = typeof fetch

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json().catch(() => ({}))
  return body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {}
}

function apiError(status: number, body: Record<string, unknown>) {
  const nestedError = body.error && typeof body.error === 'object' && !Array.isArray(body.error)
    ? body.error as Record<string, unknown>
    : null
  const message = typeof nestedError?.message === 'string'
    ? nestedError.message
    : `OpenAI request failed with status ${status}.`
  return new OpenAiHttpError(message, status, body)
}

export class OpenAiHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'OpenAiHttpError'
  }
}

export class OpenAiCompletedResponseError extends Error {
  constructor(
    message: string,
    public readonly responseId: string,
    public readonly usage: OpenAiUsage,
    public readonly actualCostMicros: number,
  ) {
    super(message)
    this.name = 'OpenAiCompletedResponseError'
  }
}

export async function countOpenAiInputTokens(input: {
  apiKey: string
  instructions: string
  userInput: string
  fetcher?: Fetcher
  signal?: AbortSignal
}): Promise<number> {
  const response = await (input.fetcher ?? fetch)('https://api.openai.com/v1/responses/input_tokens', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: input.instructions,
      input: input.userInput,
    }),
    signal: input.signal,
  })
  const body = await readJson(response)
  if (!response.ok) throw apiError(response.status, body)
  if (!Number.isSafeInteger(body.input_tokens) || Number(body.input_tokens) < 0) {
    throw new Error('OpenAI input token count is unavailable.')
  }
  return Number(body.input_tokens)
}

export function calculateOpenAiCostMicros(usage: OpenAiUsage): number {
  const uncachedInputTokens = Math.max(
    usage.inputTokens - usage.cachedInputTokens - usage.cacheWriteTokens,
    0,
  )
  return Math.ceil(
    uncachedInputTokens * inputMicrosPerToken
      + usage.cachedInputTokens * cachedInputMicrosPerToken
      + usage.cacheWriteTokens * cacheWriteMicrosPerToken
      + usage.outputTokens * outputMicrosPerToken,
  )
}

export function estimateReservedCostMicros(
  inputTokens: number,
  reservedOutputTokens: number,
): number {
  return Math.ceil(
    inputTokens * inputMicrosPerToken + reservedOutputTokens * outputMicrosPerToken,
  )
}

export async function createOpenAiStructuredResponse(input: {
  apiKey: string
  action: CodesignAiAction
  reasoningEffort: AiReasoningEffort
  instructions: string
  userInput: string
  maxOutputTokens: number
  safetyIdentifier: string
  fetcher?: Fetcher
  signal?: AbortSignal
}): Promise<OpenAiStructuredResponse> {
  const response = await (input.fetcher ?? fetch)('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: input.instructions,
      input: input.userInput,
      reasoning: { effort: input.reasoningEffort },
      max_output_tokens: input.maxOutputTokens,
      safety_identifier: input.safetyIdentifier,
      store: false,
      text: {
        format: {
          type: 'json_schema',
          name: `codesign_${input.action}`,
          strict: true,
          schema: getAiProposalJsonSchema(input.action),
        },
      },
    }),
    signal: input.signal,
  })
  const body = await readJson(response)
  if (!response.ok) throw apiError(response.status, body)
  const rawUsage = body.usage && typeof body.usage === 'object' && !Array.isArray(body.usage)
    ? body.usage as Record<string, unknown>
    : {}
  const inputDetails = rawUsage.input_tokens_details
    && typeof rawUsage.input_tokens_details === 'object'
    && !Array.isArray(rawUsage.input_tokens_details)
    ? rawUsage.input_tokens_details as Record<string, unknown>
    : {}
  const outputDetails = rawUsage.output_tokens_details
    && typeof rawUsage.output_tokens_details === 'object'
    && !Array.isArray(rawUsage.output_tokens_details)
    ? rawUsage.output_tokens_details as Record<string, unknown>
    : {}
  const usage: OpenAiUsage = {
    inputTokens: Number(rawUsage.input_tokens ?? 0),
    cachedInputTokens: Number(inputDetails.cached_tokens ?? 0),
    cacheWriteTokens: Number(inputDetails.cache_write_tokens ?? 0),
    outputTokens: Number(rawUsage.output_tokens ?? 0),
    reasoningTokens: Number(outputDetails.reasoning_tokens ?? 0),
  }
  if (Object.values(usage).some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error('OpenAI usage data is invalid.')
  }
  if (typeof body.id !== 'string') throw new Error('OpenAI response ID is unavailable.')
  const actualCostMicros = calculateOpenAiCostMicros(usage)
  if (body.status !== 'completed') {
    throw new OpenAiCompletedResponseError(
      'OpenAI response did not complete.',
      body.id,
      usage,
      actualCostMicros,
    )
  }

  const outputText = extractOutputText(body)
  let parsedOutput: unknown
  try {
    parsedOutput = JSON.parse(outputText)
  } catch {
    throw new OpenAiCompletedResponseError(
      'OpenAI response was not valid JSON.',
      body.id,
      usage,
      actualCostMicros,
    )
  }
  const envelope = validateAiProposalEnvelope(input.action, parsedOutput)
  if (!envelope.success) {
    throw new OpenAiCompletedResponseError(
      envelope.error,
      body.id,
      usage,
      actualCostMicros,
    )
  }

  return {
    responseId: body.id,
    envelope: envelope.data,
    usage,
    actualCostMicros,
  }
}

function extractOutputText(body: Record<string, unknown>): string {
  if (typeof body.output_text === 'string') return body.output_text
  if (!Array.isArray(body.output)) return ''
  for (const item of body.output) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const content = (item as Record<string, unknown>).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (!part || typeof part !== 'object' || Array.isArray(part)) continue
      const record = part as Record<string, unknown>
      if (record.type === 'output_text' && typeof record.text === 'string') return record.text
    }
  }
  return ''
}

export async function hashSafetyIdentifier(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 64)
}
