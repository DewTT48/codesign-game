export const CODESIGN_AI_MODEL = 'gpt-5.6-sol' as const

export const aiActions = [
  'frame_context',
  'generate_options',
  'challenge_assumptions',
  'check_alignment',
  'draft_prd',
] as const

export type AiAction = (typeof aiActions)[number]
export type AiReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh'

export type AiActionPolicy = {
  model: typeof CODESIGN_AI_MODEL
  reasoningEffort: AiReasoningEffort
  promptTemplateVersion: string
  outputSchemaVersion: string
}

export const aiActionPolicies: Record<AiAction, AiActionPolicy> = {
  frame_context: {
    model: CODESIGN_AI_MODEL,
    reasoningEffort: 'medium',
    promptTemplateVersion: 'frame-context-v1',
    outputSchemaVersion: 'ai-proposal-v1',
  },
  generate_options: {
    model: CODESIGN_AI_MODEL,
    reasoningEffort: 'medium',
    promptTemplateVersion: 'generate-options-v1',
    outputSchemaVersion: 'ai-proposal-v1',
  },
  challenge_assumptions: {
    model: CODESIGN_AI_MODEL,
    reasoningEffort: 'high',
    promptTemplateVersion: 'challenge-assumptions-v1',
    outputSchemaVersion: 'ai-proposal-v1',
  },
  check_alignment: {
    model: CODESIGN_AI_MODEL,
    reasoningEffort: 'high',
    promptTemplateVersion: 'check-alignment-v1',
    outputSchemaVersion: 'ai-proposal-v1',
  },
  draft_prd: {
    model: CODESIGN_AI_MODEL,
    reasoningEffort: 'xhigh',
    promptTemplateVersion: 'draft-prd-v1',
    outputSchemaVersion: 'ai-proposal-v1',
  },
}

export function getAiActionPolicy(action: AiAction): AiActionPolicy {
  return aiActionPolicies[action]
}
