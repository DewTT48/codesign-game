import { Check, FileCheck2, ShieldCheck } from 'lucide-react'
import type { Json } from '../../../lib/supabase/database.types'
import { parseUiReviewFinalizationEvidence } from './uiReviewEvidence'

export function PrdHistoryEvidenceSummary({ value, isThai }: { value: Json | undefined; isThai: boolean }) {
  const evidence = parseUiReviewFinalizationEvidence(value)

  if (!evidence) {
    return <div className="prd-history-evidence-summary">
      <p><FileCheck2 size={20} aria-hidden="true" /><strong>{isThai ? 'Final PRD ถูกจัดเตรียมจากผลการตรวจ UI แล้ว' : 'The Final PRD was prepared from the UI review.'}</strong></p>
      <small>{isThai ? 'ข้อมูลทางเทคนิคถูกซ่อนไว้ เพราะไม่จำเป็นต่อการใช้งานขั้นต่อไป' : 'Technical audit data is hidden because it is not needed for the next step.'}</small>
    </div>
  }

  const prototypeVerified = Boolean(evidence.prototype)
    && evidence.prototype?.actualSha256 === evidence.prototype?.expectedSha256
  const items = [
    {
      label: isThai ? 'CODESIGN_HANDOFF.md รวมข้อสรุปจาก UI ที่อนุมัติแล้ว' : 'CODESIGN_HANDOFF.md includes the approved UI decisions',
      complete: evidence.files.handoff.changed,
    },
    {
      label: isThai ? 'CONTENT_PACK.md ยังคงเนื้อหาที่เคยอนุมัติไว้ ไม่ถูก Prototype เปลี่ยน' : 'CONTENT_PACK.md preserves the previously approved content',
      complete: !evidence.files.contentPack.changed,
    },
    {
      label: isThai ? 'EXPERIENCE_DIRECTION.md รวมทิศทางหน้าตาและการใช้งานจาก UI Review แล้ว' : 'EXPERIENCE_DIRECTION.md includes the reviewed visual and interaction direction',
      complete: evidence.files.experienceDirection.changed,
    },
    ...(evidence.prototype ? [{
      label: isThai ? 'APPROVED_PROTOTYPE.html เป็นไฟล์เดียวกับต้นแบบที่อนุมัติ' : 'APPROVED_PROTOTYPE.html matches the approved prototype',
      complete: prototypeVerified,
    }] : []),
  ]

  return <div className="prd-history-evidence-summary">
    <p><FileCheck2 size={20} aria-hidden="true" /><strong>{isThai ? 'Final PRD พร้อมใช้สร้าง App แล้ว' : 'The Final PRD is ready to build from'}</strong></p>
    <ul>{items.map((item) => <li className={item.complete ? 'is-complete' : 'is-incomplete'} key={item.label}><Check size={17} aria-hidden="true" /> {item.label}</li>)}</ul>
    <details>
      <summary><ShieldCheck size={17} aria-hidden="true" /> {isThai ? 'ข้อมูลสำหรับตรวจสอบระบบ (ไม่จำเป็นต้องอ่านเพื่อใช้งาน)' : 'System audit details (not required for normal use)'}</summary>
      <dl>
        <div><dt>{isThai ? 'ฉบับ' : 'VERSION'}</dt><dd>{evidence.version}</dd></div>
        <div><dt>{isThai ? 'ยืนยันเมื่อ' : 'FINALIZED'}</dt><dd>{new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(evidence.finalizedAt))}</dd></div>
        {evidence.prototype ? <>
          <div><dt>{isThai ? 'ไฟล์ต้นแบบ' : 'PROTOTYPE'}</dt><dd>{evidence.prototype.canonicalFileName}</dd></div>
          <div><dt>{isThai ? 'ผลตรวจไฟล์' : 'FILE CHECK'}</dt><dd>{prototypeVerified ? (isThai ? 'ตรงกับไฟล์ที่อนุมัติ' : 'MATCHES THE APPROVED FILE') : (isThai ? 'ต้องตรวจสอบอีกครั้ง' : 'REVIEW REQUIRED')}</dd></div>
        </> : null}
      </dl>
    </details>
  </div>
}
