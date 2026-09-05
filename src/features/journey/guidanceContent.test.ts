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

  it('formats Debate options for people instead of exposing stored JSON', () => {
    const guide = getPhaseGuide('th', 'D', {
      C: {
        who: 'คนทำงานที่กำลังเปลี่ยนอาชีพ',
        goal: 'ทดลองสร้างโอกาสใหม่',
        importantContext: 'มีเวลาวันละ 10 นาที',
        constraints: 'ใช้บนมือถือ',
      },
      O: {
        options: [
          {
            name: 'Career Abundance Practice',
            coreIdea: 'ฝึกมองหาโอกาส\nแล้วลงมือทำหนึ่งอย่าง',
            like: 'เชื่อม Mindset กับ Action',
            tradeoff: 'อาจดูกว้างเกินไป',
          },
          {
            name: '21 Career Experiments',
            coreIdea: 'ทดลองเล็ก ๆ ทุกวัน',
            like: 'สร้างหลักฐานจากการลงมือทำ',
            tradeoff: 'ต้องเตรียมโจทย์ครบ 21 วัน',
          },
        ],
        favorite: 1,
      },
    }, {}, 'CAREER GROWTH')

    expect(guide.prompt).toContain('OPTION 02 — CURRENT FAVORITE')
    expect(guide.prompt).toContain('OPTION NAME: 21 Career Experiments')
    expect(guide.prompt).toContain('ALTERNATIVES — ใช้เปรียบเทียบเท่านั้น')
    expect(guide.prompt).toContain('ฝึกมองหาโอกาส\nแล้วลงมือทำหนึ่งอย่าง')
    expect(guide.prompt).not.toContain('{"name"')
    expect(guide.prompt).not.toContain('\\n')
  })

  it('formats structured lists and screen specifications without JSON syntax', () => {
    const guide = getPhaseGuide('en', 'S', {
      C: { importantContext: 'Used on a phone' },
      E: {
        direction: 'A short daily practice',
        mustHaves: ['Daily activity', 'Saved reflection'],
        nonGoals: ['Social sharing', 'AI coaching'],
      },
    }, {
      flowSteps: ['Open app', 'Complete activity', 'See progress'],
      screens: [{ name: 'Daily Activity', sees: 'Prompt', actions: 'Write and save', next: 'Progress' }],
      dayFields: ['Day number', 'Prompt'],
      browserState: ['Completed days'],
      acceptanceCriteria: ['A saved answer survives refresh'],
    }, 'REFLECTION')

    expect(guide.prompt).toContain('1. Daily activity')
    expect(guide.prompt).toContain('ITEM 01\nNAME: Daily Activity')
    expect(guide.prompt).not.toContain('["Daily activity"')
    expect(guide.prompt).not.toContain('{"name"')
  })
})
