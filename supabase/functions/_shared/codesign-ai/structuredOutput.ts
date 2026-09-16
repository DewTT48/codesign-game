import type { CodesignAiAction, JsonValue } from './promptAssembly.ts'

type JsonSchema = Record<string, unknown>

const nonEmptyString = { type: 'string', minLength: 1 }
const stringArray = { type: 'array', items: nonEmptyString }

const warningSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['code', 'message', 'phase'],
  properties: {
    code: nonEmptyString,
    message: nonEmptyString,
    phase: {
      anyOf: [
        { type: 'string', enum: ['C', 'O', 'D', 'E', 'S', 'PRD'] },
        { type: 'null' },
      ],
    },
  },
}

const consistencySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'conflicts'],
  properties: {
    status: { type: 'string', enum: ['aligned', 'needs_review', 'conflict'] },
    conflicts: stringArray,
  },
}

const proposalSchemas: Record<CodesignAiAction, JsonSchema> = {
  frame_context: {
    type: 'object',
    additionalProperties: false,
    required: ['framing', 'evidenceGaps'],
    properties: {
      framing: nonEmptyString,
      evidenceGaps: stringArray,
    },
  },
  generate_options: {
    type: 'object',
    additionalProperties: false,
    required: ['options'],
    properties: {
      options: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'description', 'tradeoffs'],
          properties: {
            title: nonEmptyString,
            description: nonEmptyString,
            tradeoffs: stringArray,
          },
        },
      },
    },
  },
  challenge_assumptions: {
    type: 'object',
    additionalProperties: false,
    required: ['assumptions'],
    properties: {
      assumptions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['statement', 'status', 'impact', 'failureMode', 'ownerQuestion'],
          properties: {
            statement: nonEmptyString,
            status: { type: 'string', enum: ['known', 'assumed', 'unknown'] },
            impact: { type: 'string', enum: ['high', 'medium', 'low'] },
            failureMode: nonEmptyString,
            ownerQuestion: nonEmptyString,
          },
        },
      },
    },
  },
  check_alignment: {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'conflicts'],
    properties: {
      summary: nonEmptyString,
      conflicts: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['sourcePhase', 'targetPhase', 'issue', 'routeBackTo'],
          properties: {
            sourcePhase: { type: 'string', enum: ['C', 'O', 'D', 'E', 'S', 'PRD'] },
            targetPhase: { type: 'string', enum: ['C', 'O', 'D', 'E', 'S', 'PRD'] },
            issue: nonEmptyString,
            routeBackTo: { type: 'string', enum: ['C', 'O', 'D', 'E', 'S'] },
          },
        },
      },
    },
  },
  draft_prd: {
    type: 'object',
    additionalProperties: false,
    required: ['markdown', 'sourceDecisionVersions'],
    properties: {
      markdown: nonEmptyString,
      sourceDecisionVersions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['decisionId', 'version'],
          properties: {
            decisionId: { type: 'string', format: 'uuid' },
            version: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
  },
}

export function getAiProposalJsonSchema(action: CodesignAiAction): JsonSchema {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['action', 'decision_status', 'proposal', 'questions', 'warnings', 'consistency'],
    properties: {
      action: { type: 'string', const: action },
      decision_status: { type: 'string', const: 'proposed' },
      proposal: proposalSchemas[action],
      questions: stringArray,
      warnings: { type: 'array', items: warningSchema },
      consistency: consistencySchema,
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString)
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  const allowed = new Set(keys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function validateCommonEnvelope(value: Record<string, unknown>, action: CodesignAiAction) {
  if (!hasOnlyKeys(value, ['action', 'decision_status', 'proposal', 'questions', 'warnings', 'consistency'])) return false
  if (value.action !== action || value.decision_status !== 'proposed') return false
  if (!isStringArray(value.questions) || !Array.isArray(value.warnings)) return false
  if (!value.warnings.every((warning) => {
    if (!isRecord(warning) || !hasOnlyKeys(warning, ['code', 'message', 'phase'])) return false
    if (!isNonEmptyString(warning.code) || !isNonEmptyString(warning.message)) return false
    return warning.phase === null
      || ['C', 'O', 'D', 'E', 'S', 'PRD'].includes(String(warning.phase))
  })) return false
  if (!isRecord(value.consistency) || !hasOnlyKeys(value.consistency, ['status', 'conflicts'])) return false
  if (!['aligned', 'needs_review', 'conflict'].includes(String(value.consistency.status))) return false
  return isStringArray(value.consistency.conflicts)
}

function validateProposal(action: CodesignAiAction, proposal: unknown): boolean {
  if (!isRecord(proposal)) return false
  if (action === 'frame_context') {
    return hasOnlyKeys(proposal, ['framing', 'evidenceGaps'])
      && isNonEmptyString(proposal.framing)
      && isStringArray(proposal.evidenceGaps)
  }
  if (action === 'generate_options') {
    return hasOnlyKeys(proposal, ['options'])
      && Array.isArray(proposal.options)
      && proposal.options.length > 0
      && proposal.options.every((option) => isRecord(option)
        && hasOnlyKeys(option, ['title', 'description', 'tradeoffs'])
        && isNonEmptyString(option.title)
        && isNonEmptyString(option.description)
        && isStringArray(option.tradeoffs))
  }
  if (action === 'challenge_assumptions') {
    return hasOnlyKeys(proposal, ['assumptions'])
      && Array.isArray(proposal.assumptions)
      && proposal.assumptions.every((assumption) => isRecord(assumption)
        && hasOnlyKeys(assumption, ['statement', 'status', 'impact', 'failureMode', 'ownerQuestion'])
        && isNonEmptyString(assumption.statement)
        && ['known', 'assumed', 'unknown'].includes(String(assumption.status))
        && ['high', 'medium', 'low'].includes(String(assumption.impact))
        && isNonEmptyString(assumption.failureMode)
        && isNonEmptyString(assumption.ownerQuestion))
  }
  if (action === 'check_alignment') {
    return hasOnlyKeys(proposal, ['summary', 'conflicts'])
      && isNonEmptyString(proposal.summary)
      && Array.isArray(proposal.conflicts)
      && proposal.conflicts.every((conflict) => isRecord(conflict)
        && hasOnlyKeys(conflict, ['sourcePhase', 'targetPhase', 'issue', 'routeBackTo'])
        && ['C', 'O', 'D', 'E', 'S', 'PRD'].includes(String(conflict.sourcePhase))
        && ['C', 'O', 'D', 'E', 'S', 'PRD'].includes(String(conflict.targetPhase))
        && isNonEmptyString(conflict.issue)
        && ['C', 'O', 'D', 'E', 'S'].includes(String(conflict.routeBackTo)))
  }
  return hasOnlyKeys(proposal, ['markdown', 'sourceDecisionVersions'])
    && isNonEmptyString(proposal.markdown)
    && Array.isArray(proposal.sourceDecisionVersions)
    && proposal.sourceDecisionVersions.every((source) => isRecord(source)
      && hasOnlyKeys(source, ['decisionId', 'version'])
      && isNonEmptyString(source.decisionId)
      && Number.isInteger(source.version)
      && Number(source.version) > 0)
}

export function validateAiProposalEnvelope(
  action: CodesignAiAction,
  value: unknown,
): { success: true; data: JsonValue } | { success: false; error: string } {
  if (!isRecord(value) || !validateCommonEnvelope(value, action) || !validateProposal(action, value.proposal)) {
    return { success: false, error: 'AI response does not match ai-proposal-v1.' }
  }
  return { success: true, data: value as JsonValue }
}
