import { describe, expect, it } from 'vitest'
import { aiActions, CODESIGN_AI_MODEL, getAiActionPolicy } from './aiPolicy'

describe('AI action policy', () => {
  it('keeps every action on GPT-5.6 Sol and varies only reasoning effort', () => {
    expect(aiActions.map((action) => getAiActionPolicy(action).model)).toEqual(
      aiActions.map(() => CODESIGN_AI_MODEL),
    )
    expect(getAiActionPolicy('frame_context').reasoningEffort).toBe('medium')
    expect(getAiActionPolicy('challenge_assumptions').reasoningEffort).toBe('high')
    expect(getAiActionPolicy('draft_prd').reasoningEffort).toBe('xhigh')
  })
})
