import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import {
  normalizeContentArcs,
  normalizeDailyContent,
  normalizeExperienceOptions,
} from '../specify/specifyModel'
import { resolveProductRuleText } from '../specify/productRuleModel'

export type GitHubReadiness = 'ready' | 'need-account' | 'unsure'

type SpecifyData = Record<string, Json | undefined>

const value = (input: Json | undefined, fallback = 'Not specified') =>
  typeof input === 'string' && input.trim() ? input.trim() : fallback

const list = (input: Json | undefined) => (Array.isArray(input) ? input : [])
  .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
  .map((item) => item.trim())

const sentence = (input: string) => /[.!?…]$/.test(input) ? input : `${input}.`

export function suggestProjectFolderName(projectTitle: string, projectId = '') {
  const titleSlug = projectTitle
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '')

  if (titleSlug) return titleSlug.endsWith('-app') ? titleSlug : `${titleSlug}-app`

  const shortId = projectId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 6)
  return `codesign-app-${shortId || 'project'}`
}

export function assembleContentPack(specify: SpecifyData) {
  const arcs = normalizeContentArcs(specify.contentArcs)
  const days = normalizeDailyContent(specify.dailyContent)

  return `# CONTENT PACK — ${value(specify.brandCopy, '21 DAYS OF')}

## Content Blueprint

${arcs.map((arc) => `### ${arc.range} — ${arc.title || 'Untitled arc'}

${arc.goal || 'Goal not specified.'}`).join('\n\n')}

## Daily Pattern

- **Content:** ${value(specify.contentPattern)}
- **Exercise:** ${value(specify.exercisePattern)}
- **Record:** ${value(specify.recordPattern)}

${days.map((day) => `## DAY ${String(day.day).padStart(2, '0')} — ${day.title || 'Untitled'}

- **Objective:** ${day.objective || 'Not specified'}
- **Duration:** ${day.duration || 'Not specified'}
- **Content:** ${day.content || 'Not specified'}
- **Exercise:** ${day.exercise || 'Not specified'}
- **Reflection:** ${day.reflection || 'Not specified'}
- **Record:** ${day.record || 'Not specified'}
- **Completion:** ${day.completion || 'Not specified'}`).join('\n\n')}
`
}

export function assembleExperienceDirection(specify: SpecifyData) {
  const options = normalizeExperienceOptions(specify.experienceOptions)
  const selectedName = value(specify.selectedExperience, '')
  const selected = options.find((option) => option.name === selectedName) ?? options[0]

  return `# EXPERIENCE DIRECTION

## Owner Decision

**Selected direction:** ${selected?.name ?? 'Not selected'}

This is a direction for implementation, not a request to copy another product or to treat every visual detail as fixed.

${selected ? `## Visual System

- **Mood:** ${selected.mood || 'Not specified'}
- **Background:** ${selected.background}
- **Surface:** ${selected.surface}
- **Primary action:** ${selected.primary}
- **Accent:** ${selected.accent}
- **Text:** ${selected.text}
- **Typography:** ${selected.typography || 'Not specified'}
- **Interaction character:** ${selected.interaction || 'Not specified'}
- **Rationale:** ${selected.rationale || 'Not specified'}
- **Trade-off to manage:** ${selected.tradeoff || 'Not specified'}` : 'No experience direction has been selected.'}

## Alternatives Considered

${options.map((option) => `- **${option.name}:** ${option.mood || 'No mood recorded'}${option.name === selected?.name ? ' — SELECTED BY OWNER' : ''}`).join('\n')}

## Implementation Guardrails

- Preserve readable contrast and comfortable body-text sizes.
- Make the complete journey work on desktop, tablet, and mobile.
- Keep Thai word wrapping natural; do not force character-by-character breaks.
- Use motion only when it clarifies state or progress, and respect reduced-motion settings.
- Codex may refine spacing, layout, and component details without changing the chosen mood or color roles.
`
}

export function assembleStartWithCodex(project: ProjectRow, readiness: GitHubReadiness = 'unsure', specify: SpecifyData = {}) {
  const productLanguage = value(specify.productLanguage, 'en')
  const useThaiInstructions = productLanguage === 'th' || productLanguage === 'bilingual'
  const ruleLanguage = useThaiInstructions ? 'th' : 'en'
  const returnRule = resolveProductRuleText('return', specify.returnRule, ruleLanguage) || (useThaiInstructions ? 'ยังไม่ได้ระบุ' : 'Not specified')
  const sequenceRule = resolveProductRuleText('sequence', specify.sequenceRule, ruleLanguage) || (useThaiInstructions ? 'ยังไม่ได้ระบุ' : 'Not specified')
  const storageRule = resolveProductRuleText('storage', specify.storageRule, ruleLanguage) || (useThaiInstructions ? 'ยังไม่ได้ระบุ' : 'Not specified')

  if (useThaiInstructions) {
    const readinessInstruction = {
      ready: 'เจ้าของ Product มีบัญชี GitHub และเข้าใช้งานได้แล้ว ให้ยืนยันบัญชีที่จะใช้ จากนั้นพาสร้าง Repository และตั้งค่า GitHub Pages',
      'need-account': 'เจ้าของ Product ยังไม่มีบัญชี GitHub ให้อธิบาย GitHub ด้วยภาษาง่ายและพาเปิดบัญชีก่อนสร้าง Repository',
      unsure: 'เจ้าของ Product ยังไม่แน่ใจเรื่อง GitHub ให้อธิบายความหมายของ Account, Repository, Commit, Push และ GitHub Pages ก่อน แล้วจึงช่วยตรวจว่ามีบัญชีอยู่แล้วหรือไม่',
    }[readiness]
    const productLanguageInstruction = productLanguage === 'bilingual'
      ? 'Product นี้กำหนดให้หน้าจอรองรับทั้งภาษาไทยและภาษาอังกฤษ'
      : 'Product นี้กำหนดให้หน้าจอที่ผู้ใช้เห็นเป็นภาษาไทย'

    return `# เริ่มสร้างด้วย CODEX — ${project.title}

เอกสารนี้คือคำสั่งเริ่มต้นสำหรับให้ Codex เปลี่ยนชุดส่งต่องานจาก CODESIGN ที่อยู่ใน Project Folder ปัจจุบันให้เป็น Web App ที่ใช้งานได้จริง โดยพาเจ้าของ Product ที่ไม่ใช่นักพัฒนาทำงานทีละขั้น

ทำงานและสร้างไฟล์ทั้งหมดภายใน Project Folder ปัจจุบัน ไม่ต้องขอให้ผู้ใช้แนบไฟล์ทั้ง 5 ฉบับซ้ำ

## ภาษาในการทำงาน

- สนทนา อธิบายความคืบหน้า และถามคำถามกับผู้ใช้เป็นภาษาไทย
- ${productLanguageInstruction}
- คงชื่อไฟล์ โค้ด คำสั่ง Terminal และชื่อทางเทคนิคไว้ในรูปแบบเดิม
- หากผู้ใช้ขอภาษาอื่นภายหลัง ให้ใช้ภาษาที่ผู้ใช้ร้องขอ

## อ่านไฟล์เหล่านี้ก่อน

1. \`CODESIGN_HANDOFF.md\` — การตัดสินใจเกี่ยวกับ Product และข้อจำกัดในการสร้าง
2. \`CONTENT_PACK.md\` — เนื้อหา แบบฝึก คำถามสะท้อนคิด และกติกาการบันทึกครบทั้ง 21 วัน
3. \`EXPERIENCE_DIRECTION.md\` — ทิศทางภาพและปฏิสัมพันธ์ที่เจ้าของ Product เลือก
4. \`APPROVED_PROTOTYPE.html\` — Visual/Interaction Reference ที่เจ้าของ Product อนุมัติและ CODESIGN ตรวจ SHA-256 แล้ว

## ลำดับอำนาจของข้อมูล

- Product rules, Scope, Content, Data behavior และ Acceptance criteria ให้ยึด Final PRD ทั้งสามไฟล์
- Layout, visual hierarchy, control placement, interaction และ transition ที่ Prototype แสดงไว้และไม่ขัดกับ Final PRD ให้ยึด \`APPROVED_PROTOTYPE.html\`
- หาก Prototype ไม่ครอบคลุมหน้าจอหรือ state ใด ให้ใช้ \`EXPERIENCE_DIRECTION.md\` และ Acceptance criteria เติมช่องว่างโดยไม่เพิ่ม Feature
- ใช้ Prototype เป็นแบบอ้างอิง ห้ามคัดลอก prototype code ไปเป็น production codeโดยตรงโดยไม่ประเมิน accessibility, responsive behavior, maintainability และความปลอดภัย
- หากเกิดความขัดแย้งที่ลำดับข้างต้นยังตัดสินไม่ได้ ให้ระบุ **PRODUCT DECISION REQUIRED** และถามผู้ใช้ครั้งละหนึ่งคำถาม

ก่อนเริ่มสร้าง ให้คำนวณ SHA-256 ของ \`APPROVED_PROTOTYPE.html\` และตรวจว่าตรงกับค่าในหัวข้อ CODESIGN UI Review ของ Final PRD หากไม่ตรงให้หยุดและแจ้ง **PROTOTYPE INTEGRITY FAILED** ห้ามสร้างต่อจากไฟล์นั้น ไม่ต้องขอ \`CODESIGN_UI_REVIEW.md\` แยก เพราะข้อสรุปและค่า integrity อยู่ใน Final PRD แล้ว

## กติกา Product ที่ยืนยันแล้ว

- **การกลับไปยังรายการก่อนหน้า:** ${returnRule}
- **การเข้าถึงวันหรือส่วนต่าง ๆ:** ${sequenceRule}
- **การบันทึกและเรียกคืนข้อมูล:** ${storageRule}

ทำตามกติกาเหล่านี้ตามที่เขียนไว้ หากข้อใดขัดกับ Must Have, Not in This Version หรือข้อจำกัดอื่นที่ยืนยันแล้ว ให้หยุดและระบุ **PRODUCT DECISION REQUIRED** ห้ามเลือกกติกาแทนเจ้าของ Product

## ความพร้อมด้าน GitHub

${readinessInstruction}

GitHub คือบ้านออนไลน์ของไฟล์โครงการและประวัติการเปลี่ยนแปลง ส่วน GitHub Pages คือบริการที่เผยแพร่ Web App นี้ให้เปิดผ่าน Public URL

- พาเจ้าของ Product ทำทีละขั้น และอธิบายคำที่ยังไม่คุ้นก่อนใช้งาน
- ห้ามขอหรือจัดการ Password, Verification code, Recovery code หรือข้อมูลลับของ Two-factor authentication
- หยุดรอให้เจ้าของ Product ทำขั้นตอน Sign in, CAPTCHA, Email verification หรือการยืนยันความปลอดภัยด้วยตนเอง
- ไม่บังคับให้เจ้าของ Product ใช้ Terminal หาก Codex สามารถทำขั้นตอนนั้นได้อย่างปลอดภัย

## ภารกิจการสร้าง

1. สรุป Product, เส้นทางหลักของผู้ใช้, กติกาที่ทำให้หนึ่งวันสำเร็จ และทิศทางประสบการณ์โดยย่อ
2. ระบุเฉพาะช่องว่างที่เป็น Product decision จริง ห้ามเปลี่ยนความชอบด้าน implementation ให้กลายเป็นคำถาม
3. สร้างโครงสร้าง App ภายใน Project Folder ปัจจุบัน พร้อม README ที่เข้าใจง่าย
4. สร้าง Standalone Web App ให้ครบทั้ง 21 วัน
5. ทำกติกาการกลับมา การเข้าถึง และการบันทึกข้อมูลตามหัวข้อ “กติกา Product ที่ยืนยันแล้ว” อย่างเคร่งครัด ห้ามอนุมานว่าต้องมี Auth, Backend, Cloud storage, AI ในตัว App, Analytics หรือบริการเสียเงิน เว้นแต่มีการตัดสินใจที่ยืนยันแล้วระบุไว้
6. ทดสอบเส้นทางทั้งหมดบน Desktop, Tablet และ Mobile รวมถึง Keyboard, Empty state, การกลับมาใช้ App และการตัดคำภาษาไทย
7. ก่อน Publish เปรียบเทียบ App กับ Approved Prototype ทีละหน้าจอและ state ตาม Confirmed Screen Map อย่างน้อยที่ viewport Mobile และ Desktop โดยตรวจ Layout, hierarchy, controls, navigation, feedback และ interaction
8. สร้าง \`PROTOTYPE_CONFORMANCE.md\` บันทึกแต่ละหน้าจอ/viewport เป็น MATCH, APPROVED DEVIATION หรือ MISMATCH พร้อมเหตุผล แก้ MISMATCH ที่มีผลต่อ UX และขอเจ้าของยืนยัน deviation ที่จำเป็น ห้าม Publish ขณะที่ยังมี material MISMATCH
9. แสดง Preview และ Conformance report ให้เจ้าของ Product ตรวจ แล้วจึง Publish ผ่าน GitHub Pages
10. ส่งกลับ Public App URL สรุปผลการทดสอบ ผล Conformance และข้อจำกัดที่ยังเหลืออยู่ ไม่ต้องส่ง Repository URL กลับไปบันทึกใน CODESIGN

เริ่มจากอ่านไฟล์ส่งต่อทั้งสี่ฉบับ ตรวจ SHA-256 ของ Approved Prototype แล้วสรุปความพร้อมให้เจ้าของ Product เป็นภาษาไทยแบบสั้นและเข้าใจง่าย จากนั้นดำเนินการขั้นถัดไปที่ปลอดภัยและเป็นประโยชน์ที่สุด
`
  }

  const readinessInstruction = {
    ready: 'The owner already has a GitHub account. Confirm the intended account, then guide repository creation and GitHub Pages setup.',
    'need-account': 'The owner does not yet have a GitHub account. Explain GitHub in plain language and guide account creation before repository setup.',
    unsure: 'The owner is unsure about GitHub. First explain what an account, repository, commit, push, and GitHub Pages mean; then help them determine whether an account already exists.',
  }[readiness]

  return `# START WITH CODEX — ${project.title}

Help a non-technical product owner turn the CODESIGN handoff in the current project folder into a working web app.

Work entirely inside the current project folder. Do not ask the owner to attach the five files again.

## Working Language

- Communicate, explain progress, and ask questions in English.
- Build the user-facing product in English, as selected in Step S.
- Keep filenames, code, terminal commands, and technical identifiers in their original form.
- If the user later requests another language, follow their request.

## Read These Files First

1. \`CODESIGN_HANDOFF.md\` — product decisions and build constraints
2. \`CONTENT_PACK.md\` — all 21 days of content, exercises, reflection, and recording rules
3. \`EXPERIENCE_DIRECTION.md\` — the owner-selected visual and interaction direction
4. \`APPROVED_PROTOTYPE.html\` — the owner-approved visual and interaction reference whose SHA-256 was verified by CODESIGN

## Authority Order

- Final PRD files govern product rules, scope, content, data behavior, and acceptance criteria.
- \`APPROVED_PROTOTYPE.html\` governs covered layout, visual hierarchy, control placement, interaction, and transitions when they do not conflict with the Final PRD.
- For screens or states the Prototype does not cover, follow \`EXPERIENCE_DIRECTION.md\` and the acceptance criteria without inventing features.
- Use the Prototype as a reference. Do not copy prototype code directly into production without reassessing accessibility, responsive behavior, maintainability, and security.
- If this authority order cannot resolve a material conflict, mark it **PRODUCT DECISION REQUIRED** and ask one clear question.

Before building, calculate the SHA-256 of \`APPROVED_PROTOTYPE.html\` and compare it with the digest in the CODESIGN UI Review section of the Final PRD. Stop with **PROTOTYPE INTEGRITY FAILED** if it does not match. Do not request a separate \`CODESIGN_UI_REVIEW.md\`; its conclusions and integrity reference are already consolidated into the Final PRD.

## Locked Product Rules

- **Returning to earlier work:** ${returnRule}
- **Accessing days or sections:** ${sequenceRule}
- **Retaining and restoring data:** ${storageRule}

Implement these rules as written. If one conflicts with Must Have, Not in This Version, or another locked constraint, stop and mark the conflict as **PRODUCT DECISION REQUIRED** instead of choosing a rule yourself.

## GitHub Readiness

${readinessInstruction}

GitHub is the online home for the project files and their change history. GitHub Pages publishes this standalone web app at a public URL.

- Guide the owner one step at a time and explain unfamiliar terms before using them.
- Never request or handle the owner's password, verification code, recovery code, or two-factor authentication secret.
- Pause for the owner to complete sign-in, CAPTCHA, email verification, or security confirmation themselves.
- Do not require the owner to use a terminal if Codex can safely perform the step.

## Build Mission

1. Briefly restate the product, primary journey, daily completion rule, and selected experience direction.
2. Identify only genuine product-decision gaps. Do not turn implementation preferences into questions.
3. Create the app structure inside the current project folder with a clear README.
4. Build the complete 21-day standalone web app.
5. Implement return, access, and data retention behavior exactly as stated in the Locked Product Rules. Do not infer Auth, a backend, cloud storage, embedded AI, analytics, or paid services unless an owner-approved locked decision explicitly requires it.
6. Test the full journey on desktop, tablet, and mobile, including keyboard use, empty states, returning to the app, and Thai text wrapping where relevant.
7. Before publishing, compare the app against the Approved Prototype screen by screen and state by state from the Confirmed Screen Map, at minimum at mobile and desktop viewports. Check layout, hierarchy, controls, navigation, feedback, and interaction.
8. Create \`PROTOTYPE_CONFORMANCE.md\` and classify every screen/viewport as MATCH, APPROVED DEVIATION, or MISMATCH with the reason. Fix UX-impacting mismatches and obtain owner confirmation for necessary deviations. Do not publish while any material MISMATCH remains.
9. Show the owner the preview and conformance report, then publish through GitHub Pages.
10. Return the public app URL, test summary, conformance result, and remaining limitations. Do not return the repository URL for storage in CODESIGN.

Start by reading the four source files, verifying the Approved Prototype SHA-256, and giving the owner a short readiness summary. Then proceed with the safest useful next step.
`
}

export function defaultAcceptanceCriteria(specify: SpecifyData) {
  const custom = list(specify.acceptanceCriteria)
  if (custom.length) return custom
  const returnRule = resolveProductRuleText('return', specify.returnRule, 'en') || 'Not specified'
  const sequenceRule = resolveProductRuleText('sequence', specify.sequenceRule, 'en') || 'Not specified'
  const storageRule = resolveProductRuleText('storage', specify.storageRule, 'en') || 'Not specified'
  return [
    'The user can open and complete all 21 days with the supplied content, exercise, reflection, and record prompt.',
    `A day is complete only when: ${value(specify.dailyCompletionRule)}`,
    `Earlier days follow the locked return rule: ${sentence(returnRule)}`,
    `Day access follows the locked sequence rule: ${sentence(sequenceRule)}`,
    `Progress follows the locked storage rule: ${sentence(storageRule)}`,
    'The selected experience direction remains readable and usable on desktop, tablet, and mobile.',
  ]
}
