import { describe, expect, it } from 'vitest'
import { applyGuidedUiReview, assembleUiReviewResolution } from './uiReview'
import {
  createUiReviewFinalizationEvidence,
  parseUiReviewFinalizationEvidence,
  uiReviewFinalizationEvidenceToJson,
  validateUiReviewFinalization,
} from './uiReviewEvidence'

const review = `# CODESIGN UI REVIEW
<!-- CODESIGN:UI_REVIEW:v1 -->

## Review Status
OWNER CONFIRMATION NEEDED

## Prototype Reviewed
Prototype v4

## Confirmed Screen Map
- Home

## Navigation and Flow
Home to practice

## Visual and Interaction Direction
Calm and focused

## Responsive and Accessibility
Visible focus and mobile layout

## Accepted UX Changes
- Keep progress visible

## PRD Impact Map
- CODESIGN_HANDOFF.md — Navigation

## Protected Decisions
- Content remains unchanged

## Open Questions
### Q-01 — Practice duration
- **Type:** OWNER DECISION
- **Question or action:** Does 10 minutes include real-world action?

## Owner Approval
I APPROVE THIS UI DIRECTION`

const before = {
  handoff: '# HANDOFF\n\n## Must Have\nA\n',
  contentPack: '# CONTENT PACK\n\nAPPROVED CONTENT',
  experienceDirection: '# EXPERIENCE DIRECTION\n\n## Owner Decision\nA\n',
}

describe('Final PRD change evidence', () => {
  it('records exactly which files changed and preserves the content pack fingerprint', async () => {
    const resolution = assembleUiReviewResolution(review, { 'Q-01': 'In-product time only.' }, 'en')
    const after = applyGuidedUiReview(before, review, resolution)
    const evidence = await createUiReviewFinalizationEvidence(before, after, 2, '2026-09-19T15:00:00.000Z')

    expect(evidence.version).toBe(2)
    expect(evidence.files.handoff.changed).toBe(true)
    expect(evidence.files.experienceDirection.changed).toBe(true)
    expect(evidence.files.contentPack.changed).toBe(false)
    expect(evidence.files.contentPack.beforeFingerprint).toBe(evidence.files.contentPack.afterFingerprint)
    expect(parseUiReviewFinalizationEvidence(uiReviewFinalizationEvidenceToJson(evidence))).toEqual(evidence)

    const check = await validateUiReviewFinalization(after, evidence, review, resolution)
    expect(check).toEqual({ status: 'valid', errors: [], warnings: [] })
  })

  it('blocks locking when approved content changes after consolidation', async () => {
    const resolution = assembleUiReviewResolution(review, { 'Q-01': 'In-product time only.' }, 'en')
    const after = applyGuidedUiReview(before, review, resolution)
    const evidence = await createUiReviewFinalizationEvidence(before, after)
    const check = await validateUiReviewFinalization({ ...after, contentPack: `${after.contentPack}\nChanged` }, evidence, review, resolution)

    expect(check.status).toBe('invalid')
    expect(check.errors).toContain('CONTENT_PACK.md เปลี่ยนจากฉบับที่อนุมัติก่อน Prototype')
  })
})
