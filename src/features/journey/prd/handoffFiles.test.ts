import { describe, expect, it } from 'vitest'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { assembleContentPack, assembleExperienceDirection, assembleStartWithCodex } from './handoffFiles'

const project = { title: '21 DAYS OF WRITING' } as ProjectRow

describe('handoff companion files', () => {
  it('keeps daily content in a deterministic Markdown structure', () => {
    const markdown = assembleContentPack({
      dailyContent: [{ day: 1, title: 'เริ่มต้น', objective: 'สังเกต', content: 'อ่านสั้น ๆ', exercise: 'ลงมือเขียน', reflection: 'พบอะไร', record: 'หนึ่งประโยค', completion: 'บันทึกคำตอบ', duration: '5 นาที', reviewed: true }],
    })

    expect(markdown).toContain('## DAY 01 — เริ่มต้น')
    expect(markdown).toContain('**Exercise:** ลงมือเขียน')
    expect(markdown).toContain('## DAY 21 — Untitled')
  })

  it('records an owner-selected experience direction', () => {
    const markdown = assembleExperienceDirection({ selectedExperience: 'Retro Quest' })
    expect(markdown).toContain('**Selected direction:** Retro Quest')
    expect(markdown).toContain('desktop, tablet, and mobile')
  })

  it('adapts GitHub guidance for an owner without an account', () => {
    const markdown = assembleStartWithCodex(project, 'need-account', { productLanguage: 'en' })
    expect(markdown).toContain('does not yet have a GitHub account')
    expect(markdown).toContain('Never request or handle the owner\'s password')
    expect(markdown).toContain('publish through GitHub Pages')
  })

  it('uses the owner rules in the Codex brief instead of hardcoding browser storage', () => {
    const markdown = assembleStartWithCodex(project, 'ready', {
      productLanguage: 'en',
      returnRule: 'no-revisit',
      sequenceRule: 'Users can complete the items in any order.',
      storageRule: 'Users export a file and import it later to restore progress.',
    })

    expect(markdown).toContain('Users cannot return to an item after completing it.')
    expect(markdown).toContain('Users can complete the items in any order.')
    expect(markdown).toContain('Users export a file and import it later to restore progress.')
    expect(markdown).not.toContain('Store progress only in the browser/device as specified')
  })

  it('creates a reviewable Thai Codex brief for a Thai product', () => {
    const markdown = assembleStartWithCodex(project, 'ready', {
      productLanguage: 'th',
      returnRule: 'no-revisit',
      sequenceRule: 'ผู้ใช้ทำรายการตามลำดับ',
      storageRule: 'บันทึกความคืบหน้าไว้ใน Browser ของอุปกรณ์นี้',
    })

    expect(markdown).toContain('# เริ่มสร้างด้วย CODEX')
    expect(markdown).toContain('## ภาษาในการทำงาน')
    expect(markdown).toContain('สนทนา อธิบายความคืบหน้า และถามคำถามกับผู้ใช้เป็นภาษาไทย')
    expect(markdown).toContain('Product นี้กำหนดให้หน้าจอที่ผู้ใช้เห็นเป็นภาษาไทย')
    expect(markdown).toContain('ผู้ใช้ไม่สามารถย้อนกลับไปยังรายการที่ทำเสร็จแล้ว')
    expect(markdown).toContain('PRODUCT DECISION REQUIRED')
  })
})
