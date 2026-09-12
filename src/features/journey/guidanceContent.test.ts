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
    expect(guide.prompt).toContain('C → O HANDOFF')
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
    expect(guide.prompt).toContain('เลือก 2 ข้อที่เป็น ASSUMED หรือ UNKNOWN')
    expect(guide.prompt).toContain('DEBATE HANDOFF')
    expect(guide.prompt).toContain('O → D HANDOFF')
    expect(guide.prompt).toContain('C → O STATUS:')
    expect(guide.prompt).toContain('ฝึกมองหาโอกาส\nแล้วลงมือทำหนึ่งอย่าง')
    expect(guide.prompt).not.toContain('{"name"')
    expect(guide.prompt).not.toContain('\\n')
  })

  it('formats the simplified Specify brief and requests importable Markdown instead of JSON', () => {
    const guide = getPhaseGuide('en', 'S', {
      C: { importantContext: 'Used on a phone' },
      E: {
        direction: 'A short daily practice',
        mustHaves: ['Daily activity', 'Saved reflection'],
        nonGoals: ['Social sharing', 'AI coaching'],
      },
    }, {
      productLanguage: 'th',
      brandCopy: '21 DAYS OF',
      journeySummary: 'Open app → Complete activity → See progress',
      dailyCompletionRule: 'Save one reflection',
      returnRule: 'Users can return to read and edit an earlier response.',
      sequenceRule: 'Users complete each day in order.',
      storageRule: 'The product saves progress in this device browser.',
      dailyDuration: '10 minutes',
      contentArcs: [{ range: 'DAY 01–07', title: 'Notice', goal: 'Build awareness' }],
      contentPattern: 'One short idea',
      exercisePattern: 'One small action',
      recordPattern: 'One saved reflection',
    }, 'REFLECTION')

    expect(guide.prompt).toContain('1. Daily activity')
    expect(guide.prompt).toContain('PRIMARY JOURNEY: Open app → Complete activity → See progress')
    expect(guide.prompt).toContain('<!-- CODESIGN:OWNER_SPEC:v1 -->')
    expect(guide.prompt).toContain('## OWNER SPECIFICATION')
    expect(guide.prompt).toContain('## DAY 01')
    expect(guide.prompt).toContain('## THEME OPTION 1')
    expect(guide.prompt).toContain('three meaningfully different CONTENT EXPERIENCE DIRECTIONS')
    expect(guide.prompt).toContain('DAY 01–07, DAY 08–14, and DAY 15–21')
    expect(guide.prompt).toContain('APPROVE COMPLETE DRAFT')
    expect(guide.prompt).toContain('CREATE CODESIGN_SPEC.md')
    expect(guide.prompt).toContain('ALIGNMENT_WITH_STEP_E: aligned | clarifies | revision')
    expect(guide.prompt).toContain('must each contain the complete owner-approved rule as a plain-language sentence')
    expect(guide.prompt).not.toContain('allow-edit | read-only | no-revisit')
    expect(guide.prompt).toContain('never continue by silently changing the scope')
    expect(guide.prompt).toContain('D → E STATUS:')
    expect(guide.prompt).not.toContain('type FINALIZE')
    expect(guide.prompt).toContain('CODESIGN_SPEC.md')
    expect(guide.prompt).toContain('must not use JSON')
    expect(guide.prompt).not.toContain('["Daily activity"')
  })

  it('frames Establish must-haves as user actions and keeps removal as a validation test', () => {
    const guide = getPhaseGuide('th', 'E', {
      C: {
        who: 'พนักงานใหม่',
        goal: 'ทบทวนงานอย่างต่อเนื่อง',
        success: 'บันทึกครบ 14 วัน',
        constraints: 'ใช้เวลาไม่เกิน 10 นาที',
      },
      D: { whatChanged: 'ใช้กิจกรรมสะท้อนคิดรายวัน' },
    }, {
      direction: 'เว็บแอปสะท้อนคิดรายวัน',
      mustHaves: ['ตอบคำถามประจำวัน', 'บันทึกคำตอบ'],
      nonGoals: ['Social sharing', 'AI coaching'],
    }, 'REFLECTION')

    expect(guide.prompt).toContain('ผู้ใช้ต้องทำอะไรใน Product นี้ จึงจะบรรลุ Goal หลัก?')
    expect(guide.prompt).toContain('เป็นเกณฑ์ตรวจ')
    expect(guide.prompt).toContain('ห้ามเพิ่ม Feature ใหม่และห้ามตัดสินใจแทนผม')
    expect(guide.prompt).toContain('D → E HANDOFF')
    expect(guide.prompt).toContain('O → D STATUS:')
  })

  it('reviews three source files against locked decisions and returns complete updates', () => {
    const guide = getPhaseGuide('th', 'PRD', { C: { who: 'พนักงานใหม่', goal: 'เติบโตในงาน' }, S: { alignmentStatus: 'clarifies', alignmentNote: 'เวลาใน Product ไม่รวมการลงมือทำจริง' } }, {
      handoff: 'HANDOFF CONTENT',
      contentPack: 'CONTENT PACK CONTENT',
      experienceDirection: 'EXPERIENCE CONTENT',
    }, 'CAREER GROWTH')

    expect(guide.prompt).toContain('===== CODESIGN_HANDOFF.md =====')
    expect(guide.prompt).toContain('CONTENT PACK CONTENT')
    expect(guide.prompt).toContain('EXPERIENCE CONTENT')
    expect(guide.prompt).toContain('LOCKED OWNER DECISIONS')
    expect(guide.prompt).toContain('WHO: พนักงานใหม่')
    expect(guide.prompt).toContain('E → S ALIGNMENT: clarifies')
    expect(guide.prompt).toContain('ASSEMBLY MISMATCH')
    expect(guide.prompt).toContain('READY TO LOCK')
    expect(guide.prompt).toContain('FILE UPDATE REQUIRED')
    expect(guide.prompt).toContain('REVISION REQUIRED — STEP E หรือ STEP S')
    expect(guide.prompt).toContain('หากต้องถาม ให้ถามทีละหนึ่งคำถาม')
    expect(guide.prompt).toContain('UPDATE HANDOFF FILES')
    expect(guide.prompt).toContain('START_WITH_CODEX.md ยังไม่อยู่ในขั้นนี้และห้ามสร้าง')
    expect(guide.prompt).not.toContain('undefined')
  })

  it('extends build, feedback, and iteration prompts with explicit handoff ownership', () => {
    const source = { C: { goal: 'Complete the practice', success: 'Finish 21 days' } }

    const implement = getPhaseGuide('en', 'I', source, {}, 'CAREER GROWTH')
    const feedback = getPhaseGuide('en', 'G', source, {}, 'CAREER GROWTH')
    const next = getPhaseGuide('en', 'N', source, {}, 'CAREER GROWTH')

    expect(implement.prompt).toContain('PRD → I HANDOFF')
    expect(feedback.prompt).toContain('I → G HANDOFF')
    expect(feedback.prompt).toContain('IMPLEMENTATION / PRD / STEP S / STEP E / STEP C')
    expect(next.prompt).toContain('recommend exactly one change owner')
    expect(next.bringBack).toContain('revision owner')
  })
})
