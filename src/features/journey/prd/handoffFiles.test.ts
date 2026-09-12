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
    const markdown = assembleStartWithCodex(project, 'need-account')
    expect(markdown).toContain('does not yet have a GitHub account')
    expect(markdown).toContain('Never request or handle the owner\'s password')
    expect(markdown).toContain('publish through GitHub Pages')
  })

  it('uses the owner rules in the Codex brief instead of hardcoding browser storage', () => {
    const markdown = assembleStartWithCodex(project, 'ready', {
      returnRule: 'no-revisit',
      sequenceRule: 'Users can complete the items in any order.',
      storageRule: 'Users export a file and import it later to restore progress.',
    })

    expect(markdown).toContain('Users cannot return to an item after completing it.')
    expect(markdown).toContain('Users can complete the items in any order.')
    expect(markdown).toContain('Users export a file and import it later to restore progress.')
    expect(markdown).not.toContain('Store progress only in the browser/device as specified')
  })
})
