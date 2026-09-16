import { describe, expect, it, vi } from 'vitest'
import {
  calculateOpenAiCostMicros,
  countOpenAiInputTokens,
  createOpenAiStructuredResponse,
  estimateReservedCostMicros,
} from '../../../../supabase/functions/_shared/codesign-ai/openaiClient'
import { getAiProposalJsonSchema } from '../../../../supabase/functions/_shared/codesign-ai/structuredOutput'

describe('OpenAI Responses contract', () => {
  it('counts input tokens using the same instructions and input sent to Responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      object: 'response.input_tokens',
      input_tokens: 321,
    }), { status: 200 }))

    await expect(countOpenAiInputTokens({
      apiKey: 'test-key',
      instructions: 'Developer instructions',
      userInput: '{"draft":"hello"}',
      fetcher,
    })).resolves.toBe(321)
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses/input_tokens',
      expect.objectContaining({ method: 'POST' }),
    )
    const request = JSON.parse(fetcher.mock.calls[0][1].body)
    expect(request).toMatchObject({
      model: 'gpt-5.6-sol',
      instructions: 'Developer instructions',
      input: '{"draft":"hello"}',
    })
  })

  it('uses strict structured output, store false, and server-selected effort', async () => {
    const envelope = {
      action: 'frame_context',
      decision_status: 'proposed',
      proposal: { framing: 'A focused problem', evidenceGaps: ['Observed frequency'] },
      questions: ['How often does this occur?'],
      warnings: [],
      consistency: { status: 'aligned', conflicts: [] },
    }
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'resp_123',
      status: 'completed',
      output_text: JSON.stringify(envelope),
      usage: {
        input_tokens: 100,
        input_tokens_details: { cached_tokens: 20, cache_write_tokens: 10 },
        output_tokens: 50,
        output_tokens_details: { reasoning_tokens: 15 },
      },
    }), { status: 200 }))

    const result = await createOpenAiStructuredResponse({
      apiKey: 'test-key',
      action: 'frame_context',
      reasoningEffort: 'medium',
      instructions: 'Developer instructions',
      userInput: '{"draft":"hello"}',
      maxOutputTokens: 8_000,
      safetyIdentifier: 'hashed-user-id',
      fetcher,
    })

    expect(result.envelope).toEqual(envelope)
    expect(result.actualCostMicros).toBe(1_338)
    const request = JSON.parse(fetcher.mock.calls[0][1].body)
    expect(request).toMatchObject({
      model: 'gpt-5.6-sol',
      reasoning: { effort: 'medium' },
      max_output_tokens: 8_000,
      safety_identifier: 'hashed-user-id',
      store: false,
      text: {
        format: {
          type: 'json_schema',
          name: 'codesign_frame_context',
          strict: true,
        },
      },
    })
  })

  it('reads structured output from the nested Responses output contract', async () => {
    const envelope = {
      action: 'generate_options',
      decision_status: 'proposed',
      proposal: {
        options: [{
          title: 'Option A',
          description: 'Start with the narrowest workflow',
          tradeoffs: ['Lower coverage'],
        }],
      },
      questions: [],
      warnings: [{ code: 'EVIDENCE_GAP', message: 'Validate demand', phase: null }],
      consistency: { status: 'needs_review', conflicts: [] },
    }
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'resp_nested',
      status: 'completed',
      output: [{
        type: 'message',
        content: [{ type: 'output_text', text: JSON.stringify(envelope) }],
      }],
      usage: { input_tokens: 10, output_tokens: 20 },
    }), { status: 200 }))

    await expect(createOpenAiStructuredResponse({
      apiKey: 'test-key',
      action: 'generate_options',
      reasoningEffort: 'medium',
      instructions: 'Developer instructions',
      userInput: '{}',
      maxOutputTokens: 6_000,
      safetyIdentifier: 'hashed-user-id',
      fetcher,
    })).resolves.toMatchObject({
      responseId: 'resp_nested',
      envelope,
    })
  })

  it('prices reservations and actual usage in integer USD micros', () => {
    expect(estimateReservedCostMicros(10_000, 20_000)).toBe(440_000)
    expect(calculateOpenAiCostMicros({
      inputTokens: 10_000,
      cachedInputTokens: 2_000,
      cacheWriteTokens: 1_000,
      outputTokens: 3_000,
      reasoningTokens: 1_000,
    })).toBe(93_800)
  })

  it('builds a strict schema for every action', () => {
    for (const action of [
      'frame_context',
      'generate_options',
      'challenge_assumptions',
      'check_alignment',
      'draft_prd',
    ] as const) {
      expect(getAiProposalJsonSchema(action)).toMatchObject({
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { const: action },
          decision_status: { const: 'proposed' },
        },
      })
    }
  })
})
