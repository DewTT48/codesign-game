import { describe, expect, it } from 'vitest'
import { parseSpecifyMarkdown, serializeContentPack, serializeExperienceDraft } from './markdownImport'
import { createDailyContent, starterExperienceOptions } from './specifyModel'

describe('Specify Markdown import', () => {
  it('parses daily content without exposing Markdown control text', () => {
    const markdown = `<!-- CODESIGN:CONTENT_PACK:v1 -->

## DAY 01
TITLE: เริ่มจากสิ่งที่เห็น
OBJECTIVE: แยกข้อเท็จจริงออกจากการตีความ
CONTENT: สังเกตสิ่งที่เกิดขึ้น
โดยยังไม่รีบสรุป
EXERCISE: เขียนสิ่งที่เห็นสามข้อ
REFLECTION: สิ่งใดทำให้คุณประหลาดใจ
RECORD: คำตอบแบบข้อความ
COMPLETION: บันทึกคำตอบอย่างน้อยหนึ่งข้อ
DURATION: 10 นาที`

    const result = parseSpecifyMarkdown(markdown)

    expect(result.days).toHaveLength(1)
    expect(result.days[0].content).toContain('โดยยังไม่รีบสรุป')
    expect(result.days[0].completion).toContain('อย่างน้อยหนึ่งข้อ')
    expect(result.warnings).toContain('CONTENT_PACK_INCOMPLETE')
  })

  it('parses theme options and normalizes colors', () => {
    const markdown = `<!-- CODESIGN:EXPERIENCE_DRAFT:v1 -->

## THEME OPTION 1
NAME: Deep Focus
MOOD: Calm
BACKGROUND: #102A43
SURFACE: #174A6E
PRIMARY: #ff922b
ACCENT: invalid
TEXT: #FFFFFF
TYPOGRAPHY: Readable
INTERACTION: Direct
RATIONALE: Supports focus
TRADEOFF: Less playful`

    const result = parseSpecifyMarkdown(markdown)

    expect(result.experienceOptions[0].primary).toBe('#FF922B')
    expect(result.experienceOptions[0].accent).toBe('#7AC943')
  })

  it('round-trips supported handoff documents', () => {
    const days = createDailyContent()
    days[0] = {
      day: 1,
      title: 'Notice',
      objective: 'Observe',
      content: 'Read this',
      exercise: 'Write this',
      reflection: 'What changed?',
      record: 'A note',
      completion: 'Save a note',
      duration: '10 minutes',
      reviewed: true,
    }
    const markdown = `${serializeContentPack(days)}\n\n${serializeExperienceDraft(starterExperienceOptions)}`
    const result = parseSpecifyMarkdown(markdown)

    expect(result.days).toHaveLength(21)
    expect(result.experienceOptions).toHaveLength(3)
    expect(result.days[0].reviewed).toBe(false)
  })
})
