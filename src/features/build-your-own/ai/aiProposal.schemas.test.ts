import { describe, expect, it } from 'vitest'
import {
  aiProposalEnvelopeSchema,
  decisionCandidateForReview,
  type AiProposalEnvelope,
} from './aiProposal.schemas'

const contextProposal: AiProposalEnvelope = {
  action: 'frame_context',
  decision_status: 'proposed',
  proposal: {
    framing: 'ทีมยังไม่เห็นเหตุผลเบื้องหลังการตัดสินใจเดิม',
    evidenceGaps: ['ยังไม่มีข้อมูลว่าทีมค้นหาการตัดสินใจบ่อยแค่ไหน'],
  },
  questions: ['ใครต้องใช้ข้อมูลนี้มากที่สุด?'],
  warnings: [],
  consistency: { status: 'aligned', conflicts: [] },
}

describe('AI proposal contract', () => {
  it('accepts a structured proposal that is still explicitly proposed', () => {
    expect(aiProposalEnvelopeSchema.parse(contextProposal)).toEqual(contextProposal)
  })

  it('rejects an AI response that claims to be an accepted decision', () => {
    const invalidProposal = {
      ...contextProposal,
      decision_status: 'accepted',
    }

    expect(() => aiProposalEnvelopeSchema.parse(invalidProposal)).toThrow()
    expect(() => decisionCandidateForReview(
      'accept',
      invalidProposal as unknown as AiProposalEnvelope,
    )).toThrow()
  })

  it('returns decision content only for Accept or Edit & Accept', () => {
    expect(decisionCandidateForReview('accept', contextProposal)).toEqual(contextProposal.proposal)
    expect(decisionCandidateForReview('reject', contextProposal)).toBeNull()
    expect(decisionCandidateForReview('regenerate', contextProposal)).toBeNull()

    const edited: AiProposalEnvelope = {
      ...contextProposal,
      proposal: { ...contextProposal.proposal, framing: 'ข้อความที่ผู้ใช้แก้ไขเอง' },
    }
    expect(decisionCandidateForReview('edit_and_accept', contextProposal, edited)).toEqual(edited.proposal)
  })
})
