import { describe, expect, it } from 'vitest'
import { parseSpecifyMarkdown, serializeContentPack, serializeExperienceDraft, serializeOwnerSpecification } from './markdownImport'
import { contrastRatio, createDailyContent, starterExperienceOptions } from './specifyModel'

describe('Specify Markdown import', () => {
  const ownerSpecification = {
    productLanguage: 'th' as const,
    brandCopy: '21 DAYS OF',
    journeySummary: 'เปิด App → รับภารกิจ → บันทึกผล',
    dailyCompletionRule: 'ลงมือทำและบันทึกผล',
    returnRule: 'ผู้ใช้กลับมาอ่านและแก้ไขคำตอบเดิมได้',
    sequenceRule: 'ผู้ใช้ต้องทำรายการก่อนหน้าให้สำเร็จ จึงเปิดรายการถัดไปได้',
    storageRule: 'ระบบจำคำตอบและความคืบหน้าไว้ใน Browser ของอุปกรณ์นี้',
    dailyDuration: '5–10 นาที',
    contentArcs: [
      { range: 'DAY 01–07', title: 'เห็นความเป็นไปได้', goal: 'ฝึกสังเกต' },
      { range: 'DAY 08–14', title: 'สร้างความเป็นไปได้', goal: 'เริ่มทดลอง' },
      { range: 'DAY 15–21', title: 'เป็นเจ้าของการเติบโต', goal: 'รวบรวมหลักฐาน' },
    ],
    contentPattern: 'แนวคิดสั้นหนึ่งเรื่อง',
    exercisePattern: 'ลงมือทำหนึ่งอย่าง',
    recordPattern: 'สิ่งที่เกิดขึ้น สิ่งที่เปลี่ยน และหลักฐาน',
    alignmentStatus: 'clarifies' as const,
    alignmentNote: 'เวลา 5–10 นาทีหมายถึงเวลาใน Product เท่านั้น',
  }

  it('parses the owner specification used to populate S1–S2', () => {
    const result = parseSpecifyMarkdown(serializeOwnerSpecification(ownerSpecification))

    expect(result.ownerSpecification).toEqual(ownerSpecification)
    expect(result.warnings).toEqual([])
  })

  it('keeps legacy rule codes importable for existing handoff files', () => {
    const legacy = serializeOwnerSpecification({
      ...ownerSpecification,
      returnRule: 'allow-edit',
      sequenceRule: 'sequential',
      storageRule: 'browser-device',
    })

    const result = parseSpecifyMarkdown(legacy)

    expect(result.ownerSpecification?.returnRule).toBe('allow-edit')
    expect(result.ownerSpecification?.sequenceRule).toBe('sequential')
    expect(result.ownerSpecification?.storageRule).toBe('browser-device')
    expect(result.warnings).toEqual([])
  })

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
    const markdown = `${serializeOwnerSpecification(ownerSpecification)}\n\n${serializeContentPack(days)}\n\n${serializeExperienceDraft(starterExperienceOptions)}`
    const result = parseSpecifyMarkdown(markdown)

    expect(result.ownerSpecification).toEqual(ownerSpecification)
    expect(result.days).toHaveLength(21)
    expect(result.experienceOptions).toHaveLength(3)
    expect(result.days[0].reviewed).toBe(false)
    expect(result.ownerSpecification?.recordPattern).not.toContain('CODESIGN:')
    expect(result.days[20].duration).not.toContain('CODESIGN:')
  })

  it('keeps every starter theme readable on its named palette', () => {
    expect(starterExperienceOptions.map((option) => option.name)).toEqual([
      'Calm Focus',
      'Retro Quest',
      'Warm Momentum',
    ])
    for (const option of starterExperienceOptions) {
      expect(contrastRatio(option.text, option.background)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(option.text, option.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(option.background, option.primary)).toBeGreaterThanOrEqual(3)
    }
  })
})
