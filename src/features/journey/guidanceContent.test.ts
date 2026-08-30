import { describe, expect, it } from 'vitest'
import { getFieldGuide, getPhaseGuide } from './guidanceContent'

describe('guided content', () => {
  it('builds a Thai Context prompt from the learner draft', () => {
    const guide = getPhaseGuide('th', 'C', {}, {
      initialWho: 'พนักงานใหม่',
      initialOutcome: 'ทบทวนงานได้ต่อเนื่อง',
    }, 'REFLECTION')

    expect(guide.prompt).toContain('21 DAYS OF REFLECTION')
    expect(guide.prompt).toContain('พนักงานใหม่')
    expect(guide.prompt).toContain('ยังไม่ต้องเสนอ Feature')
  })

  it('carries locked context into an English Options prompt', () => {
    const guide = getPhaseGuide('en', 'O', {
      C: {
        who: 'New employees',
        goal: 'Reflect daily',
        success: 'Complete 14 entries',
        importantContext: 'Ten minutes before bed',
        constraints: 'Standalone web app',
      },
    }, {}, 'REFLECTION')

    expect(guide.prompt).toContain('New employees')
    expect(guide.prompt).toContain('Do not choose a winner for me')
  })

  it('returns localized field guidance', () => {
    expect(getFieldGuide('th', 'context.success')?.question).toContain('หลักฐาน')
    expect(getFieldGuide('en', 'context.success')?.question).toContain('evidence')
  })
})
