import { describe, expect, it } from 'vitest'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import {
  applyOwnUiReview,
  applyGuidedUiReview,
  assembleGuidedUiBrief,
  assembleOwnUiBrief,
  assemblePrototypePrompt,
  assembleUiReviewResolution,
  getUiReviewForwardPlan,
  validateOwnFinalPrd,
  validateUiReviewDocument,
  validateUiReviewResolution,
} from './uiReview'

const project: ProjectRow = {
  id: 'project-1', owner_id: 'owner-1', mode: 'guided', title: '21 Days of Focus', topic: 'Focus',
  content_readiness: 'ready', status: 'in_progress', current_phase: 'PRD', solidification_stage: 'SOLID',
  created_at: '2026-09-19T00:00:00.000Z', updated_at: '2026-09-19T00:00:00.000Z', completed_at: null,
}

const review = `# CODESIGN UI REVIEW
<!-- CODESIGN:UI_REVIEW:v1 -->

## Review Status
APPROVED FOR FINAL PRD

## Prototype Reviewed
Desktop and mobile v3

## Confirmed Screen Map
- Home — start the journey

## Navigation and Flow
Home to day detail and back

## Visual and Interaction Direction
Calm cards with one primary action

## Responsive and Accessibility
Single column on mobile, visible focus, AA contrast

## Accepted UX Changes
- Keep progress visible in the header

## PRD Impact Map
- CODESIGN_HANDOFF.md — primary navigation

## Protected Decisions
- Approved daily content remains unchanged

## Open Questions
NONE

## Owner Approval
I APPROVE THIS UI DIRECTION`

describe('CODESIGN UI Review contract', () => {
  it('creates a lean guided UI Brief with representative content instead of all 21 days', () => {
    const brief = assembleGuidedUiBrief(project, {
      C: { who: 'Busy managers', goal: 'Reflect consistently', success: 'Complete 14 days' },
      E: { direction: 'A calm daily companion', mustHaves: ['Daily reflection'], nonGoals: ['Social feed'] },
      S: { journeySummary: 'Open, reflect, save', dailyCompletionRule: 'Save one reflection' },
    }, {
      handoff: '# HANDOFF',
      experienceDirection: '# EXPERIENCE DIRECTION\n\n## Owner Decision\nCalm',
      contentPack: '# CONTENT PACK\n\n## DAY 01 — Begin\nFirst day content\n\n## DAY 02 — Continue\nSecond day content',
    })

    expect(brief).toContain('## DAY 01 — Begin')
    expect(brief).not.toContain('## DAY 02 — Continue')
    expect(brief).toContain('The complete 21-day content is already owner-approved')
  })

  it('gives Chat an explicit iteration and final-file contract for both modes', () => {
    const guided = assemblePrototypePrompt('# UI BRIEF', 'guided', 'th')
    const own = assemblePrototypePrompt(assembleOwnUiBrief({ ...project, mode: 'own' }, '# PRD'), 'own', 'en')
    expect(guided).toContain('FINALIZE UI REVIEW')
    expect(guided).toContain('CODESIGN_UI_REVIEW.md')
    expect(guided).toContain('จะไม่แก้ CONTENT_PACK.md')
    expect(guided).toContain('OWNER CONFIRMATION NEEDED')
    expect(guided).toContain('## Prototype Integrity')
    expect(guided).toContain('SHA-256')
    expect(guided).toContain('HTML Prototype ฉบับที่อนุมัติจริง')
    expect(guided).not.toContain('REVISION REQUIRED — STEP E')
    expect(own).toContain('PRODUCT_REQUIREMENTS.md')
    expect(own).toContain('Return the complete PRD, not a patch or summary.')
    expect(own).toContain('exact approved HTML prototype')
  })

  it('requires an explicit approved review with no open questions', () => {
    expect(validateUiReviewDocument(review)).toEqual({ valid: true, route: 'approved', errors: [] })
    expect(validateUiReviewDocument(review.replace('NONE', 'Which icon?')).valid).toBe(false)
    expect(validateUiReviewDocument(review.replace('I APPROVE THIS UI DIRECTION', '')).valid).toBe(false)
  })

  it('converts a legacy revision review into a forward confirmation checkpoint', () => {
    const legacyReview = review
      .replace('APPROVED FOR FINAL PRD', 'REVISION REQUIRED — STEP S')
      .replace('NONE', `### OQ-01 — Merge approved scope
**คำถามที่ต้องตรวจ:** CODESIGN บันทึกสิ่งที่อนุมัติแล้วหรือยัง?

### OQ-02 — Practice duration
**คำถามที่ต้องยืนยัน:** เวลา 5–10 นาทีรวมการลงมือจริงหรือไม่?

### ขอบเขตที่ไม่ใช่คำถามใหม่
เนื้อหาอธิบายเพิ่มเติม ไม่ต้องแสดงเป็นคำถามให้เจ้าของตอบ`)
    expect(validateUiReviewDocument(legacyReview)).toEqual({ valid: true, route: 'confirmation-needed', errors: [] })
    const plan = getUiReviewForwardPlan(legacyReview)
    expect(plan.consolidationItems.map((item) => item.id)).toEqual(['OQ-01'])
    expect(plan.ownerQuestions.map((item) => item.id)).toEqual(['OQ-02'])

    const resolution = assembleUiReviewResolution(legacyReview, { 'OQ-02': '5–10 นาทีใน Product ไม่รวมเวลาลงมือจริง' }, 'th')
    expect(validateUiReviewResolution(legacyReview, resolution)).toBe(true)
    expect(resolution).toContain('I CONFIRM THESE PROTOTYPE-DRIVEN CHANGES')
  })

  it('applies an approved review only to handoff and experience files', () => {
    const files = {
      handoff: '# HANDOFF\n\n## Must Have\nA\n\n## Acceptance Criteria\nB\n',
      contentPack: '# CONTENT PACK\n\nAPPROVED CONTENT',
      experienceDirection: '# EXPERIENCE DIRECTION\n\n## Owner Decision\nA\n\n## Implementation Guardrails\nB\n',
    }
    const applied = applyGuidedUiReview(files, review)
    expect(applied.handoff).toContain('## CODESIGN UI Review — Owner Approved')
    expect(applied.experienceDirection).toContain('Calm cards with one primary action')
    expect(applied.contentPack).toBe(files.contentPack)
    expect(applyGuidedUiReview(applied, review).handoff.match(/CODESIGN UI Review — Owner Approved/g)).toHaveLength(1)
  })

  it('removes transport-only citation tokens from the final PRD addendum', () => {
    const files = {
      handoff: '# HANDOFF\n\n## Must Have\nA\n',
      contentPack: '# CONTENT PACK\n\nAPPROVED CONTENT',
      experienceDirection: '# EXPERIENCE DIRECTION\n\n## Owner Decision\nA\n',
    }
    const cited = review.replace('primary navigation', 'primary navigation fileciteturn3file0L10-L14')
    const applied = applyGuidedUiReview(files, cited)
    expect(applied.handoff).not.toContain('filecite')
  })

  it('consolidates confirmed prototype changes without rewriting the content pack', () => {
    const forwardReview = review
      .replace('APPROVED FOR FINAL PRD', 'OWNER CONFIRMATION NEEDED')
      .replace('NONE', `### Q-01 — Duration
- **Type:** OWNER DECISION
- **Question or action:** Does 10 minutes include real-world action?
- **Suggested answer or update:** Count in-product time only.
- **Done when:** The owner answers.`)
    const resolution = assembleUiReviewResolution(forwardReview, { 'Q-01': 'In-product time only.' }, 'en')
    const files = {
      handoff: '# HANDOFF\n\n## Must Have\nA\n',
      contentPack: '# CONTENT PACK\n\nAPPROVED CONTENT',
      experienceDirection: '# EXPERIENCE DIRECTION\n\n## Owner Decision\nA\n',
    }
    const applied = applyGuidedUiReview(files, forwardReview, resolution)
    expect(applied.handoff).toContain('Prototype Change Resolution')
    expect(applied.handoff).toContain('In-product time only.')
    expect(applied.contentPack).toBe(files.contentPack)
    expect(applyGuidedUiReview(applied, forwardReview, resolution).handoff.match(/CODESIGN UI Review — Owner Approved/g)).toHaveLength(1)
    expect(() => applyGuidedUiReview(files, forwardReview)).toThrow()
  })

  it('checks that a Build Your Own final PRD still contains the core contract', () => {
    const finalPrd = `# Product\n## Context\nA\n## User and goal\nB\n## Scope\nC\n## Journey\nD\n## Requirements\nE\n## Acceptance criteria\nF`
    expect(validateOwnFinalPrd(finalPrd).valid).toBe(true)
    expect(validateOwnFinalPrd('# Product\nPretty screens only').valid).toBe(false)
    expect(validateOwnFinalPrd('# ผลิตภัณฑ์\n## บริบทและปัญหา\nA\n## ผู้ใช้และเป้าหมาย\nB\n## ขอบเขต\nC\n## เส้นทางและขั้นตอน\nD\n## ข้อกำหนด\nE\n## เกณฑ์ตรวจรับ\nF').valid).toBe(true)
    expect(applyOwnUiReview(finalPrd, review)).toContain('CODESIGN UI Review — Owner Approved')
  })
})
