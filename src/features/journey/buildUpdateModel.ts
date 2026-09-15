import type { Json } from '../../lib/supabase/database.types'

export const buildUpdateLimits = {
  maxFiles: 12,
  maxFileBytes: 300_000,
  maxTotalBytes: 1_000_000,
} as const

export type BuildUpdateDocument = {
  name: string
  content: string
  size: number
}

export function normalizeBuildUpdateDocuments(value: Json | undefined): BuildUpdateDocument[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    if (typeof item.name !== 'string' || typeof item.content !== 'string') return []
    const name = item.name.trim()
    if (!name || !/\.md$/i.test(name)) return []
    return [{
      name,
      content: item.content,
      size: typeof item.size === 'number' && Number.isFinite(item.size) ? item.size : item.content.length,
    }]
  })
}

export function mergeBuildUpdateDocuments(
  current: BuildUpdateDocument[],
  incoming: BuildUpdateDocument[],
) {
  const merged = new Map(current.map((file) => [file.name.toLocaleLowerCase(), file]))
  for (const file of incoming) merged.set(file.name.toLocaleLowerCase(), file)
  return [...merged.values()]
}

export function buildUpdateIsReady(
  documents: BuildUpdateDocument[],
  primaryFile: string,
  confirmed: boolean,
) {
  if (!documents.length) return true
  return confirmed && documents.some((file) => file.name === primaryFile)
}

export function buildUpdatePrompt(productTitle: string, isThai: boolean) {
  if (!isThai) return `Review the current working app “${productTitle}” in this Codex local project.

Do not change the app in this task. Compare the app as it works now with CODESIGN_HANDOFF.md, CONTENT_PACK.md, EXPERIENCE_DIRECTION.md, and START_WITH_CODEX.md, then create a concise Markdown build update for the product owner.

Recommended primary filename: CODESIGN_BUILD_UPDATE.md. You may create supporting Markdown files when they genuinely help, but a multi-file pack is not required.

Cover:
1. What the app does now
2. Product behavior added, changed, removed, or deferred from the original handoff
3. The reason or evidence for each material change
4. Current Must Have status
5. Test and release evidence
6. Known limitations
7. Candidates for the next iteration

Separate product-decision changes from implementation-only details. State uncertainty instead of guessing. Do not include passwords, tokens, API keys, private repository URLs, environment values, personal data, or source-code dumps.

When complete, tell me which file is the best primary summary to upload to CODESIGN.`

  return `ตรวจแอป “${productTitle}” ที่ใช้งานได้จริงใน Codex Local Project นี้

Task นี้ไม่ต้องแก้ไขแอป ให้เปรียบเทียบพฤติกรรมของแอปปัจจุบันกับ CODESIGN_HANDOFF.md, CONTENT_PACK.md, EXPERIENCE_DIRECTION.md และ START_WITH_CODEX.md แล้วสร้างเอกสาร Markdown สรุปสถานะปัจจุบันสำหรับเจ้าของ Product

ชื่อไฟล์สรุปหลักที่แนะนำคือ CODESIGN_BUILD_UPDATE.md คุณสามารถสร้างไฟล์ Markdown ประกอบเพิ่มเติมได้เมื่อมีประโยชน์จริง แต่ไม่จำเป็นต้องทำเป็นชุดหลายไฟล์

ให้ครอบคลุม:
1. ตอนนี้แอปทำอะไรได้จริง
2. Product behavior ที่เพิ่ม เปลี่ยน ตัดออก หรือเลื่อนจาก Handoff เดิม
3. เหตุผลหรือหลักฐานของการเปลี่ยนแปลงสำคัญแต่ละเรื่อง
4. สถานะ Must Have ปัจจุบัน
5. หลักฐานการทดสอบและ Release
6. ข้อจำกัดที่ยังเหลือ
7. เรื่องที่ควรพิจารณาใน Next Iteration

แยก Product decision ที่เปลี่ยนออกจากรายละเอียดการสร้างหรือการแก้ Bug หากไม่แน่ใจให้ระบุว่าไม่แน่ใจ ห้ามใส่ Password, Token, API Key, Private Repository URL, ค่า Environment, ข้อมูลส่วนบุคคล หรือ Source Code จำนวนมาก

เมื่อเสร็จแล้ว บอกผมด้วยว่าไฟล์ใดเหมาะจะใช้เป็นสรุปหลักสำหรับอัปโหลดกลับเข้า CODESIGN`
}
