import { AlertTriangle, ArrowRight, Check, Clock3, Eye, FileDiff, ShieldCheck } from 'lucide-react'
import type { PrdFileKey } from './prdPackage'
import { prdFiles } from './prdPackage'
import { getUiReviewForwardPlan, getUiReviewResolutionAnswers } from './uiReview'
import type { UiReviewFinalizationEvidence, UiReviewIntegrityCheck } from './uiReviewEvidence'
import { MarkdownPreview } from './MarkdownPreview'

type Props = {
  evidence: UiReviewFinalizationEvidence
  integrity: UiReviewIntegrityCheck
  review: string
  resolution: string
  isThai: boolean
  onOpenFile: (key: PrdFileKey) => void
}

const afterDescriptions: Record<PrdFileKey, { th: string; en: string }> = {
  handoff: {
    th: 'เพิ่ม Screen Map, Navigation, Accepted UX Changes, PRD Impact Map และคำตอบของเจ้าของ',
    en: 'Added the screen map, navigation, accepted UX changes, PRD impact map, and owner answers.',
  },
  contentPack: {
    th: 'คงเนื้อหา แบบฝึก และคำถามที่อนุมัติไว้เดิมทุกตัวอักษร',
    en: 'Preserved the approved content, exercises, and prompts byte-for-byte.',
  },
  experienceDirection: {
    th: 'เพิ่ม Visual/Interaction Direction, Responsive/Accessibility และ UX ที่อนุมัติ',
    en: 'Added the approved visual, interaction, responsive, accessibility, and UX direction.',
  },
}

function fingerprintLabel(fingerprint: string) {
  const digest = fingerprint.replace(/^sha256-/, '').replace(/^fnv1a-/, '')
  return digest.length > 14 ? `${digest.slice(0, 7)}…${digest.slice(-7)}` : digest
}

export function FinalPrdChangeSummary({ evidence, integrity, review, resolution, isThai, onOpenFile }: Props) {
  const plan = getUiReviewForwardPlan(review)
  const answers = getUiReviewResolutionAnswers(review, resolution)
  const changedCount = prdFiles.filter(({ key }) => evidence.files[key].changed).length
  const finalizedAt = new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(evidence.finalizedAt))

  return <section className="final-prd-evidence" aria-labelledby="final-prd-evidence-title">
    <header>
      <div className="final-prd-evidence__icon"><FileDiff size={25} /></div>
      <div>
        <span>{isThai ? `FINAL PRD · CONSOLIDATION v${evidence.version}` : `FINAL PRD · CONSOLIDATION v${evidence.version}`}</span>
        <h3 id="final-prd-evidence-title">{isThai ? `อัปเดต ${changedCount} ไฟล์ · คงเดิม ${prdFiles.length - changedCount} ไฟล์` : `${changedCount} FILES UPDATED · ${prdFiles.length - changedCount} PRESERVED`}</h3>
        <p>{isThai ? 'นี่คือหลักฐานว่า UI Review ถูกผสานเข้า Final PRD แล้ว ไม่ใช่เพียงบันทึกว่าสร้างสำเร็จ' : 'This evidence confirms that the UI Review was merged into the final PRD, rather than only recording a successful action.'}</p>
      </div>
      <div className="final-prd-evidence__time"><Clock3 size={16} /><span>{finalizedAt}</span></div>
    </header>

    <div className="final-prd-evidence__files">
      {prdFiles.map(({ key, fileName }) => {
        const file = evidence.files[key]
        return <article className={file.changed ? 'is-changed' : 'is-preserved'} key={key}>
          <div>
            <span className="final-prd-evidence__state"><Check size={15} /> {file.changed ? (isThai ? 'อัปเดตจาก UI Review' : 'UPDATED FROM UI REVIEW') : (isThai ? 'คงเดิมตามที่อนุมัติ' : 'PRESERVED AS APPROVED')}</span>
            <h4>{fileName}</h4>
            <p>{isThai ? afterDescriptions[key].th : afterDescriptions[key].en}</p>
          </div>
          <div className="final-prd-evidence__plain-result">
            <Check size={17} />
            <div><strong>{file.changed ? (isThai ? 'ตรวจแล้วว่าไฟล์เปลี่ยน' : 'VERIFIED: FILE UPDATED') : (isThai ? 'ตรวจแล้วว่าเหมือนเดิมทุกตัวอักษร' : 'VERIFIED: BYTE-FOR-BYTE IDENTICAL')}</strong><small>{file.changed ? (isThai ? 'ข้อมูลจาก UI Review ถูกเพิ่มเข้า Final PRD แล้ว' : 'The UI Review information is now included in the final PRD.') : (isThai ? 'Prototype ไม่ได้แก้เนื้อหาในไฟล์นี้' : 'The prototype did not alter this file.')}</small></div>
          </div>
          <details className="final-prd-evidence__technical">
            <summary>{isThai ? 'รายละเอียดทางเทคนิค' : 'TECHNICAL DETAILS'}</summary>
            <dl>
              <div><dt>{isThai ? 'ลายนิ้วมือก่อน' : 'BEFORE FINGERPRINT'}</dt><dd>{fingerprintLabel(file.beforeFingerprint)}</dd></div>
              <div><dt>{isThai ? 'ลายนิ้วมือหลัง' : 'AFTER FINGERPRINT'}</dt><dd>{fingerprintLabel(file.afterFingerprint)}</dd></div>
              <div><dt>{isThai ? 'บรรทัดที่ต่าง' : 'CHANGED LINES'}</dt><dd>{file.changedLines}</dd></div>
            </dl>
          </details>
          <button type="button" onClick={() => onOpenFile(key)}><Eye size={16} /> {isThai ? 'เปิดตรวจไฟล์' : 'REVIEW FILE'}</button>
        </article>
      })}
    </div>

    <details className="final-prd-evidence__details">
      <summary><FileDiff size={18} /> {isThai ? 'ดูเฉพาะสิ่งที่เปลี่ยนและคำตอบที่บันทึก' : 'VIEW ONLY THE CHANGES AND RECORDED ANSWERS'}</summary>
      <div className="final-prd-evidence__before-after">
        <section><span>{isThai ? 'ก่อน Prototype' : 'BEFORE PROTOTYPE'}</span><p>{isThai ? 'ไฟล์ร่างประกอบจาก Decision ใน Step C–S และยังไม่มีข้อสรุปจาก UI Review' : 'The drafts were assembled from Steps C–S and did not yet contain UI Review conclusions.'}</p></section>
        <ArrowRight size={24} aria-hidden="true" />
        <section><span>{isThai ? 'Final PRD หลัง Consolidate' : 'FINAL PRD AFTER CONSOLIDATION'}</span><p>{isThai ? 'สองไฟล์มี Addendum ที่เป็นข้อกำหนดล่าสุด ส่วน Content Pack คงเดิมและได้รับการตรวจด้วย Fingerprint' : 'Two files contain an authoritative addendum, while the Content Pack is preserved and verified by fingerprint.'}</p></section>
      </div>
      {plan.acceptedChanges ? <section className="final-prd-evidence__markdown"><h4>{isThai ? 'สิ่งที่รับจาก Prototype' : 'ACCEPTED FROM THE PROTOTYPE'}</h4><MarkdownPreview markdown={plan.acceptedChanges} /></section> : null}
      {plan.impactMap ? <section className="final-prd-evidence__markdown"><h4>{isThai ? 'หัวข้อ PRD ที่ได้รับผล' : 'AFFECTED PRD AREAS'}</h4><MarkdownPreview markdown={plan.impactMap} /></section> : null}
      {Object.keys(answers).length ? <section className="final-prd-evidence__answers"><h4>{isThai ? 'คำตอบของเจ้าของที่บันทึกแล้ว' : 'RECORDED OWNER ANSWERS'}</h4>{plan.ownerQuestions.map((item) => answers[item.id] ? <article key={item.id}><strong>{item.id} · {item.prompt}</strong><p>{answers[item.id]}</p></article> : null)}</section> : null}
    </details>

    <div className={`final-prd-evidence__integrity is-${integrity.status}`} role={integrity.status === 'invalid' ? 'alert' : 'status'}>
      {integrity.status === 'valid' ? <ShieldCheck size={22} /> : integrity.status === 'invalid' ? <AlertTriangle size={22} /> : <Clock3 size={22} />}
      <div>
        <strong>{integrity.status === 'valid'
          ? (isThai ? 'Integrity Check ผ่าน' : 'INTEGRITY CHECK PASSED')
          : integrity.status === 'invalid'
            ? (isThai ? 'Integrity Check ยังไม่ผ่าน' : 'INTEGRITY CHECK FAILED')
            : (isThai ? 'กำลังตรวจ Final PRD…' : 'CHECKING FINAL PRD…')}</strong>
        {integrity.status === 'valid' ? <p>{isThai ? 'พบ Addendum ในสองไฟล์ คำตอบของเจ้าของอยู่ครบ และ CONTENT_PACK.md ตรงกับฉบับก่อน Prototype' : 'Both addenda are present, owner answers are recorded, and CONTENT_PACK.md matches the pre-prototype version.'}</p> : null}
        {integrity.errors.map((error) => <p key={error}>{error}</p>)}
        {integrity.warnings.map((warning) => <p className="is-warning" key={warning}>{warning}</p>)}
      </div>
    </div>
  </section>
}
