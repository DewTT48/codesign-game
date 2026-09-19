import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import type { PrdSource } from '../journey.service'
import type { PrdDrafts } from './prdPackage'

export const UI_REVIEW_FILE_NAME = 'CODESIGN_UI_REVIEW.md'
export const OWN_FINAL_PRD_FILE_NAME = 'PRODUCT_REQUIREMENTS.md'

export type UiReviewRoute = 'approved' | 'revision-e' | 'revision-s'

export type UiReviewCheck = {
  valid: boolean
  route: UiReviewRoute | null
  errors: string[]
}

const sourceText = (value: Json | undefined, fallback = 'Not specified') => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const sourceList = (value: Json | undefined) => (Array.isArray(value) ? value : [])
  .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
  .map((item) => item.trim())

const bullets = (items: string[]) => items.length
  ? items.map((item) => `- ${item}`).join('\n')
  : '- Not specified'

function representativeContent(contentPack: string) {
  const match = contentPack.match(/(?:^|\n)(##\s+DAY\s+0?1\b[\s\S]*?)(?=\n##\s+DAY\s+0?2\b|$)/i)
  return match?.[1]?.trim() || 'Use representative placeholder content with the same content, exercise, reflection, and record hierarchy. Do not rewrite approved content.'
}

export function assembleGuidedUiBrief(
  project: ProjectRow,
  source: PrdSource,
  files: PrdDrafts,
) {
  const context = source.C ?? {}
  const establish = source.E ?? {}
  const specify = source.S ?? {}

  return `# CODESIGN UI BRIEF — ${project.title}

<!-- CODESIGN:UI_BRIEF:v1 -->

## Purpose of This Prototype

Create a visual and interaction prototype so the Product Owner can inspect the likely screens, navigation, hierarchy, responsive behavior, and overall feeling before the final PRD is locked. This is not a production build.

## Locked Product Decisions

- **Primary user:** ${sourceText(context.who)}
- **User goal:** ${sourceText(context.goal)}
- **Observable success:** ${sourceText(context.success)}
- **Product direction:** ${sourceText(establish.direction)}
- **Primary journey:** ${sourceText(specify.journeySummary)}
- **One day is complete when:** ${sourceText(specify.dailyCompletionRule)}
- **Return rule:** ${sourceText(specify.returnRule)}
- **Sequence rule:** ${sourceText(specify.sequenceRule)}
- **Storage rule:** ${sourceText(specify.storageRule)}
- **Product language:** ${sourceText(specify.productLanguage)}

## Must Have

${bullets(sourceList(establish.mustHaves))}

## Not in This Version

${bullets(sourceList(establish.nonGoals))}

## Approved Experience Direction

${files.experienceDirection.trim()}

## Representative Content Shape

The complete 21-day content is already owner-approved and is deliberately not included in this prototype prompt. Use this representative structure only to judge hierarchy, readability, and interaction.

${representativeContent(files.contentPack)}

## Prototype Boundary

- Focus on UI, UX, information hierarchy, navigation, responsive layout, state visibility, accessibility, and interaction clarity.
- Do not add, remove, or rewrite product scope, content rules, completion rules, storage behavior, or approved daily content.
- Use realistic representative content, but do not attempt to reproduce all 21 days.
- A visual artifact, image, or lightweight interactive HTML prototype is acceptable. It does not need production code, authentication, a backend, or complete data.
- If a requested UI change would alter a locked Product Decision, stop and mark it as REVISION REQUIRED — STEP E or STEP S instead of silently changing the product.
`
}

export function assembleOwnUiBrief(project: ProjectRow, prdMarkdown: string) {
  return `# CODESIGN UI BRIEF — ${project.title}

<!-- CODESIGN:UI_BRIEF:v1 -->

## Purpose of This Prototype

Create a visual and interaction prototype so the Product Owner can inspect the likely screens, navigation, hierarchy, responsive behavior, and overall feeling before the final PRD is locked. This is not a production build.

## Current PRD Draft

${prdMarkdown.trim() || 'The PRD draft is not ready yet.'}

## Prototype Boundary

- Focus on UI, UX, information hierarchy, navigation, responsive layout, state visibility, accessibility, and interaction clarity.
- Do not invent business rules, permissions, data behavior, scope, or new features.
- A visual artifact, image, or lightweight interactive HTML prototype is acceptable. It does not need production code or production infrastructure.
- Ask one clear Product Owner question at a time when a material UX decision is missing.
- If an accepted UI change alters a Product Decision, identify the affected PRD section explicitly rather than silently rewriting it.
`
}

export function assemblePrototypePrompt(
  uiBrief: string,
  mode: 'guided' | 'own',
  language: 'th' | 'en',
) {
  const thai = language === 'th'
  const finalFiles = mode === 'guided'
    ? thai
      ? `สร้างไฟล์ Markdown ฉบับเต็มชื่อ ${UI_REVIEW_FILE_NAME} เพียงไฟล์เดียวตาม Output Contract ด้านล่าง CODESIGN จะนำ Review นี้ไปผสานกับไฟล์ Final โดยมีกฎควบคุม และจะไม่แก้ CONTENT_PACK.md`
      : `Create one complete Markdown file named ${UI_REVIEW_FILE_NAME} using the output contract below. CODESIGN applies it to the final files under fixed rules and will not rewrite CONTENT_PACK.md.`
    : thai
      ? `สร้างไฟล์ Markdown ฉบับเต็ม 2 ไฟล์ตาม Output Contract ด้านล่าง: ${UI_REVIEW_FILE_NAME} และ ${OWN_FINAL_PRD_FILE_NAME} โดยไฟล์ PRD ต้องเป็นฉบับเต็มที่นำข้อสรุป UI/UX ที่อนุมัติแล้วไปใช้ครบถ้วน`
      : `Create two complete Markdown files using the output contract below: ${UI_REVIEW_FILE_NAME} and ${OWN_FINAL_PRD_FILE_NAME}. The PRD must be a complete final version incorporating every approved UI/UX conclusion.`

  if (thai) return `คุณคือ Product Designer และ UX Facilitator ที่ช่วยเจ้าของ Product ซึ่งอาจไม่เคยสร้างแอปมาก่อน

เป้าหมายของงานนี้คือทำ Prototype เพื่อ “ตรวจหน้าตาและ UX/UI ก่อน Lock Final PRD” ไม่ใช่สร้าง Production App และไม่ใช่การเพิ่ม Feature

===== CODESIGN UI BRIEF =====
${uiBrief}

===== วิธีทำงานกับผู้ใช้ =====
1. อ่าน UI Brief ทั้งหมดก่อนตอบ และสรุปสิ่งที่ถูก Lock ไว้สั้น ๆ
2. สร้าง Prototype ที่เห็นภาพจริง โดยใช้ความสามารถที่มี: Interactive artifact/HTML เป็นตัวเลือกแรก หากทำไม่ได้ให้ใช้ภาพหน้าจอหรือ Wireframe ที่ละเอียดพอให้ตัดสินใจ
3. แสดงหน้าหลัก เส้นทางหลัก Navigation สถานะสำคัญ Mobile และ Desktop เท่าที่จำเป็นต่อการตรวจ UX โดยไม่ต้องทำเนื้อหาครบทุกหน้า
4. ให้ผู้ใช้ทดลองหรือดู Prototype แล้วถามทีละหนึ่งคำถามเกี่ยวกับสิ่งที่เห็นจริง เช่น ลำดับ หน้าจอ ความชัดเจน การกลับไปมา และความรู้สึกของ UI
5. ปรับ Prototype ต่อเนื่องจนผู้ใช้พิมพ์ว่า “FINALIZE UI REVIEW” ห้ามสร้าง Final files ก่อนคำสั่งนี้
6. ถ้าคำขอเปลี่ยน User, Goal, Scope, Must Have, Non-goal, Journey, Completion rule, Content, Storage หรือ Business rule ให้หยุดและสรุป REVISION REQUIRED — STEP E หรือ STEP S ห้ามแก้เงียบ ๆ
7. หลังผู้ใช้สั่ง FINALIZE UI REVIEW: ${finalFiles}

===== OUTPUT CONTRACT: ${UI_REVIEW_FILE_NAME} =====
# CODESIGN UI REVIEW
<!-- CODESIGN:UI_REVIEW:v1 -->

## Review Status
ใช้ค่าเดียว: APPROVED FOR FINAL PRD / REVISION REQUIRED — STEP E / REVISION REQUIRED — STEP S

## Prototype Reviewed
ระบุ Version หรือคำอธิบาย Prototype ล่าสุดที่ผู้ใช้เห็นและอนุมัติ

## Confirmed Screen Map
รายการหน้าจอ จุดประสงค์ ข้อมูลสำคัญ และ Primary action

## Navigation and Flow
เส้นทางหลัก การย้อนกลับ การไปต่อ และสถานะที่ผู้ใช้ต้องเข้าใจ

## Visual and Interaction Direction
Layout, hierarchy, component character, typography, color roles, density, motion และ feedback ที่อนุมัติ

## Responsive and Accessibility
พฤติกรรม Mobile/Desktop, keyboard, focus, contrast, touch target, empty/error/loading states

## Accepted UX Changes
เฉพาะสิ่งที่ผู้ใช้อนุมัติจากการเห็น Prototype แล้ว หากไม่มีให้ระบุ NONE

## PRD Impact Map
ระบุแต่ละการเปลี่ยนแปลง → ไฟล์/หัวข้อ PRD ที่ต้องแก้ หรือ NO PRD CHANGE

## Protected Decisions
ระบุ Product decisions และ Content ที่ห้ามถูกเปลี่ยนจาก UI Review นี้

## Open Questions
ต้องเป็น NONE ก่อนใช้สถานะ APPROVED FOR FINAL PRD

## Owner Approval
ใส่ประโยค I APPROVE THIS UI DIRECTION เฉพาะเมื่อผู้ใช้ยืนยัน Prototype ล่าสุดจริง

${mode === 'own' ? `===== OUTPUT CONTRACT: ${OWN_FINAL_PRD_FILE_NAME} =====
- คืน PRD ฉบับเต็ม ไม่ใช่ Patch หรือ Summary
- รักษา Context, User, Goal, Scope, Non-goals, Business rules, Data behavior และ Acceptance criteria ที่ไม่ได้รับอนุมัติให้เปลี่ยน
- ใช้ Accepted UX Changes และ PRD Impact Map ปรับเฉพาะหัวข้อที่เกี่ยวข้อง
- ต้องมีหัวข้อที่ครอบคลุม Context, User and Goal, Scope and Non-goals, Journey, Requirements และ Acceptance Criteria
- ห้ามมี TODO, คำถามค้าง หรือข้อความบอกให้ทีมสร้างเดาเอง

` : ''}ห้ามใช้ JSON ห้ามย่อหัวข้อ และห้ามอ้างว่าผู้ใช้อนุมัติหากยังไม่ได้รับคำยืนยัน`

  return `Act as a Product Designer and UX Facilitator for a Product Owner who may never have built an app before.

The goal is to prototype and review the likely UI/UX before locking the final PRD. Do not build a production app or add features.

===== CODESIGN UI BRIEF =====
${uiBrief}

===== WORKING METHOD =====
1. Read the complete UI Brief and briefly restate the locked decisions.
2. Create a visible prototype. Prefer an interactive artifact/HTML experience; otherwise provide detailed screens or wireframes.
3. Show only the screens, primary journey, navigation, important states, and mobile/desktop views needed to judge the UX. Do not reproduce every content page.
4. Let the owner inspect the prototype, then ask one question at a time about visible hierarchy, navigation, clarity, and interaction.
5. Iterate until the owner types “FINALIZE UI REVIEW”. Do not create final files before that command.
6. If a request changes the user, goal, scope, must-haves, non-goals, journey, completion rule, content, storage, or business rules, stop and report REVISION REQUIRED — STEP E or STEP S.
7. After FINALIZE UI REVIEW: ${finalFiles}

===== OUTPUT CONTRACT: ${UI_REVIEW_FILE_NAME} =====
# CODESIGN UI REVIEW
<!-- CODESIGN:UI_REVIEW:v1 -->

## Review Status
Use exactly one: APPROVED FOR FINAL PRD / REVISION REQUIRED — STEP E / REVISION REQUIRED — STEP S

## Prototype Reviewed
Identify the latest prototype version the owner actually reviewed.

## Confirmed Screen Map
List each screen, its purpose, essential information, and primary action.

## Navigation and Flow
Describe the primary route, back/forward behavior, and visible states.

## Visual and Interaction Direction
Record the approved layout, hierarchy, component character, typography, color roles, density, motion, and feedback.

## Responsive and Accessibility
Record mobile/desktop behavior, keyboard, focus, contrast, touch targets, and empty/error/loading states.

## Accepted UX Changes
Only owner-approved changes observed through the prototype; use NONE when applicable.

## PRD Impact Map
Map each change to the affected PRD file/section or NO PRD CHANGE.

## Protected Decisions
List product decisions and content this review must not change.

## Open Questions
Must be NONE before APPROVED FOR FINAL PRD.

## Owner Approval
Include I APPROVE THIS UI DIRECTION only after the owner explicitly approves the latest prototype.

${mode === 'own' ? `===== OUTPUT CONTRACT: ${OWN_FINAL_PRD_FILE_NAME} =====
- Return the complete PRD, not a patch or summary.
- Preserve context, users, goals, scope, non-goals, business rules, data behavior, and acceptance criteria unless the owner explicitly approved a change.
- Apply only the Accepted UX Changes and PRD Impact Map to the relevant sections.
- Include sections covering Context, User and Goal, Scope and Non-goals, Journey, Requirements, and Acceptance Criteria.
- Include no TODO markers, open questions, or instructions that force the build team to guess.

` : ''}Do not use JSON, omit headings, or claim approval that did not happen.`
}

export function validateUiReviewDocument(content: string): UiReviewCheck {
  const source = content.trim()
  const errors: string[] = []
  if (!source) return { valid: false, route: null, errors: ['ไฟล์ไม่มีเนื้อหา'] }
  if (!/^#\s+CODESIGN UI REVIEW\s*$/im.test(source)) errors.push('ไม่พบหัวเรื่อง CODESIGN UI REVIEW')
  if (!/<!--\s*CODESIGN:UI_REVIEW:v1\s*-->/i.test(source)) errors.push('ไม่พบ Version marker ของ UI Review')

  const required = [
    'Review Status',
    'Prototype Reviewed',
    'Confirmed Screen Map',
    'Navigation and Flow',
    'Visual and Interaction Direction',
    'Responsive and Accessibility',
    'Accepted UX Changes',
    'PRD Impact Map',
    'Protected Decisions',
    'Open Questions',
    'Owner Approval',
  ]
  for (const heading of required) {
    if (!new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im').test(source)) {
      errors.push(`ไม่พบหัวข้อ ${heading}`)
    }
  }

  const reviewStatus = section(source, 'Review Status')
  let route: UiReviewRoute | null = null
  if (/^\s*APPROVED FOR FINAL PRD\s*[.!]?\s*$/i.test(reviewStatus)) route = 'approved'
  else if (/^\s*REVISION REQUIRED\s*(?:—|-)\s*STEP E\s*[.!]?\s*$/i.test(reviewStatus)) route = 'revision-e'
  else if (/^\s*REVISION REQUIRED\s*(?:—|-)\s*STEP S\s*[.!]?\s*$/i.test(reviewStatus)) route = 'revision-s'
  else errors.push('Review Status ไม่ตรงกับค่าที่รองรับ')

  if (route === 'approved') {
    if (!/I APPROVE THIS UI DIRECTION/i.test(source)) errors.push('ยังไม่มี Owner Approval สำหรับ Prototype ล่าสุด')
    const openQuestions = section(source, 'Open Questions')
    if (!/^\s*(?:NONE|ไม่มี)\s*[.!]?\s*$/i.test(openQuestions)) errors.push('Open Questions ต้องเป็น NONE ก่อนสร้าง Final PRD')
  }

  return { valid: errors.length === 0, route, errors }
}

export function validateOwnFinalPrd(content: string) {
  const source = content.trim()
  const errors: string[] = []
  if (!source) errors.push('Final PRD ไม่มีเนื้อหา')
  if (!/^#\s+.+/m.test(source)) errors.push('Final PRD ไม่มีหัวเรื่องหลัก')
  const requiredConcepts = [
    { label: 'Context', pattern: /context|บริบท|ปัญหา/i },
    { label: 'User', pattern: /user|ผู้ใช้/i },
    { label: 'Goal', pattern: /goal|เป้าหมาย|ผลลัพธ์/i },
    { label: 'Scope', pattern: /scope|ขอบเขต|non-goal/i },
    { label: 'Journey', pattern: /journey|เส้นทาง|ขั้นตอน/i },
    { label: 'Requirements', pattern: /requirement|ข้อกำหนด|ความต้องการ/i },
    { label: 'Acceptance Criteria', pattern: /acceptance|เกณฑ์ตรวจรับ|เกณฑ์ยอมรับ/i },
  ]
  for (const concept of requiredConcepts) {
    if (!concept.pattern.test(source)) errors.push(`Final PRD ไม่พบส่วน ${concept.label}`)
  }
  return { valid: errors.length === 0, errors }
}

function section(markdown: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return markdown.match(new RegExp(`(?:^|\\n)##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i'))?.[1]?.trim() ?? ''
}

function compactReview(content: string, headings: string[]) {
  return headings.map((heading) => {
    const body = section(content, heading)
    return body ? `### ${heading}\n\n${body}` : ''
  }).filter(Boolean).join('\n\n')
}

function replaceOrAppend(markdown: string, title: string, body: string) {
  const block = `${title}\n\n${body}`.trim()
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(^|\\n)${escaped}\\s*\\n[\\s\\S]*?(?=\\n##\\s+|$)`, 'i')
  if (pattern.test(markdown)) return markdown.replace(pattern, (_match, prefix: string) => `${prefix}${block}`).trimEnd() + '\n'
  return `${markdown.trimEnd()}\n\n${block}\n`
}

export function applyGuidedUiReview(files: PrdDrafts, uiReview: string): PrdDrafts {
  const check = validateUiReviewDocument(uiReview)
  if (!check.valid || check.route !== 'approved') throw new Error('An approved CODESIGN UI Review is required.')

  const handoffReview = compactReview(uiReview, [
    'Prototype Reviewed',
    'Confirmed Screen Map',
    'Navigation and Flow',
    'Responsive and Accessibility',
    'Accepted UX Changes',
    'PRD Impact Map',
    'Protected Decisions',
  ])
  const experienceReview = compactReview(uiReview, [
    'Prototype Reviewed',
    'Visual and Interaction Direction',
    'Responsive and Accessibility',
    'Accepted UX Changes',
    'Protected Decisions',
  ])

  return {
    handoff: replaceOrAppend(files.handoff, '## CODESIGN UI Review — Owner Approved', handoffReview),
    contentPack: files.contentPack,
    experienceDirection: replaceOrAppend(files.experienceDirection, '## CODESIGN UI Review — Owner Approved', experienceReview),
  }
}
