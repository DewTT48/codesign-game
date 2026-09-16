import { z } from 'zod'
import { aiActions } from './aiPolicy'

const warningSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  phase: z.enum(['C', 'O', 'D', 'E', 'S', 'PRD']).optional(),
})

const consistencySchema = z.object({
  status: z.enum(['aligned', 'needs_review', 'conflict']),
  conflicts: z.array(z.string().min(1)),
})

const envelopeFields = {
  decision_status: z.literal('proposed'),
  questions: z.array(z.string().min(1)),
  warnings: z.array(warningSchema),
  consistency: consistencySchema,
}

const frameContextProposalSchema = z.object({
  action: z.literal('frame_context'),
  ...envelopeFields,
  proposal: z.object({
    framing: z.string().min(1),
    evidenceGaps: z.array(z.string().min(1)),
  }),
})

const generateOptionsProposalSchema = z.object({
  action: z.literal('generate_options'),
  ...envelopeFields,
  proposal: z.object({
    options: z.array(z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      tradeoffs: z.array(z.string().min(1)),
    })).min(1),
  }),
})

const challengeAssumptionsProposalSchema = z.object({
  action: z.literal('challenge_assumptions'),
  ...envelopeFields,
  proposal: z.object({
    assumptions: z.array(z.object({
      statement: z.string().min(1),
      status: z.enum(['known', 'assumed', 'unknown']),
      impact: z.enum(['high', 'medium', 'low']),
      failureMode: z.string().min(1),
      ownerQuestion: z.string().min(1),
    })),
  }),
})

const checkAlignmentProposalSchema = z.object({
  action: z.literal('check_alignment'),
  ...envelopeFields,
  proposal: z.object({
    summary: z.string().min(1),
    conflicts: z.array(z.object({
      sourcePhase: z.enum(['C', 'O', 'D', 'E', 'S', 'PRD']),
      targetPhase: z.enum(['C', 'O', 'D', 'E', 'S', 'PRD']),
      issue: z.string().min(1),
      routeBackTo: z.enum(['C', 'O', 'D', 'E', 'S']),
    })),
  }),
})

const draftPrdProposalSchema = z.object({
  action: z.literal('draft_prd'),
  ...envelopeFields,
  proposal: z.object({
    markdown: z.string().min(1),
    sourceDecisionVersions: z.array(z.object({
      decisionId: z.string().uuid(),
      version: z.number().int().positive(),
    })),
  }),
})

export const aiProposalEnvelopeSchema = z.discriminatedUnion('action', [
  frameContextProposalSchema,
  generateOptionsProposalSchema,
  challengeAssumptionsProposalSchema,
  checkAlignmentProposalSchema,
  draftPrdProposalSchema,
])

export const aiActionSchema = z.enum(aiActions)

export type AiProposalEnvelope = z.infer<typeof aiProposalEnvelopeSchema>
export type AiReviewAction = 'accept' | 'edit_and_accept' | 'reject' | 'regenerate'

export function decisionCandidateForReview(
  reviewAction: AiReviewAction,
  proposal: AiProposalEnvelope,
  editedProposal?: AiProposalEnvelope,
): AiProposalEnvelope['proposal'] | null {
  const validatedProposal = aiProposalEnvelopeSchema.parse(proposal)

  if (reviewAction === 'accept') return validatedProposal.proposal
  if (reviewAction === 'edit_and_accept') {
    if (!editedProposal) throw new Error('An edited proposal is required.')
    const validatedEdit = aiProposalEnvelopeSchema.parse(editedProposal)
    if (validatedEdit.action !== validatedProposal.action) {
      throw new Error('An edited proposal must keep the original AI action.')
    }
    return validatedEdit.proposal
  }
  return null
}
