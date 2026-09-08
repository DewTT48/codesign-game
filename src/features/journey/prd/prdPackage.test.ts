import { describe, expect, it } from 'vitest'
import { countChangedLines, validatePrdDocument } from './prdPackage'

describe('PRD package validation', () => {
  it('requires all 21 days in the content pack', () => {
    const complete = `# CONTENT PACK\n${Array.from({ length: 21 }, (_, index) => `## DAY ${String(index + 1).padStart(2, '0')}\nContent`).join('\n')}`
    expect(validatePrdDocument('contentPack', complete).valid).toBe(true)
    expect(validatePrdDocument('contentPack', '# CONTENT PACK\n## DAY 01\nContent').errors).toContain('พบเนื้อหารายวัน 1/21 วัน')
  })

  it('checks the key structure of the product and experience files', () => {
    expect(validatePrdDocument('handoff', '# HANDOFF\n## Must Have\nA\n## Acceptance Criteria\nB').valid).toBe(true)
    expect(validatePrdDocument('experienceDirection', '# EXPERIENCE\n## Owner Decision\nA\n## Visual System\nB').valid).toBe(true)
  })

  it('counts changed, added, and removed lines', () => {
    expect(countChangedLines('one\ntwo', 'one\nchanged\nthree')).toBe(2)
  })
})
