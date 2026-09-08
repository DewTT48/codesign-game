export type PrdFileKey = 'handoff' | 'contentPack' | 'experienceDirection'

export type PrdDrafts = Record<PrdFileKey, string>

export const prdFiles: Array<{
  key: PrdFileKey
  fileName: string
}> = [
  { key: 'handoff', fileName: 'CODESIGN_HANDOFF.md' },
  { key: 'contentPack', fileName: 'CONTENT_PACK.md' },
  { key: 'experienceDirection', fileName: 'EXPERIENCE_DIRECTION.md' },
]

export type PrdDocumentCheck = {
  valid: boolean
  errors: string[]
}

export function validatePrdDocument(key: PrdFileKey, content: string): PrdDocumentCheck {
  const source = content.trim()
  const errors: string[] = []

  if (!source) return { valid: false, errors: ['ไฟล์ไม่มีเนื้อหา'] }
  if (!/^#\s+.+/m.test(source)) errors.push('ไม่พบหัวเรื่องหลักของไฟล์')

  if (key === 'handoff') {
    if (!/must\s*have/i.test(source)) errors.push('ไม่พบส่วน Must Have')
    if (!/acceptance\s+criteria/i.test(source)) errors.push('ไม่พบส่วน Acceptance Criteria')
  }

  if (key === 'contentPack') {
    const days = new Set(
      Array.from(source.matchAll(/^##\s+DAY\s+(\d{1,2})\b/gim), (match) => Number(match[1]))
        .filter((day) => day >= 1 && day <= 21),
    )
    if (days.size !== 21) errors.push(`พบเนื้อหารายวัน ${days.size}/21 วัน`)
  }

  if (key === 'experienceDirection') {
    if (!/owner\s+decision/i.test(source)) errors.push('ไม่พบส่วน Owner Decision')
    if (!/(visual\s+system|implementation\s+guardrails)/i.test(source)) errors.push('ไม่พบแนวทางกำกับการออกแบบ')
  }

  return { valid: errors.length === 0, errors }
}

export function countChangedLines(before: string, after: string) {
  const previous = before.replace(/\r\n/g, '\n').split('\n')
  const next = after.replace(/\r\n/g, '\n').split('\n')
  const length = Math.max(previous.length, next.length)
  let changed = 0
  for (let index = 0; index < length; index += 1) {
    if (previous[index] !== next[index]) changed += 1
  }
  return changed
}
