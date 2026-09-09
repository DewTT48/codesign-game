import { Check, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { PhaseSection } from './PhaseFormComponents'
import type { AlignmentStatus } from './crossStepAlignmentModel'

export type AlignmentSourceItem = {
  label: string
  value: string | string[]
}

export function CrossStepAlignment({
  step,
  sourceStep,
  targetStep,
  items,
  status,
  note,
  confirmed,
  loading = false,
  loadError = false,
  allowRevision = false,
  revisionAction,
  onStatusChange,
  onNoteChange,
  onConfirmedChange,
}: {
  step: string
  sourceStep: string
  targetStep: string
  items: AlignmentSourceItem[]
  status: AlignmentStatus
  note: string
  confirmed: boolean
  loading?: boolean
  loadError?: boolean
  allowRevision?: boolean
  revisionAction?: ReactNode
  onStatusChange: (status: AlignmentStatus) => void
  onNoteChange: (note: string) => void
  onConfirmedChange: (confirmed: boolean) => void
}) {
  const { isThai } = useLanguage()
  const relationshipName = `${sourceStep} → ${targetStep}`

  return (
    <PhaseSection
      step={step}
      title={isThai ? `ตรวจการส่งต่อ ${relationshipName}` : `CHECK THE ${relationshipName} HANDOFF`}
      description={isThai ? `อ่านข้อสรุปจาก Step ${sourceStep} พร้อมกับงานใน Step ${targetStep} แล้วระบุว่าข้อมูลต่อกันอย่างไร` : `Review the Step ${sourceStep} decisions together with the Step ${targetStep} work and classify the relationship.`}
    >
      {loading ? <p className="alignment-loading">{isThai ? `กำลังโหลดข้อสรุปจาก Step ${sourceStep}…` : `LOADING STEP ${sourceStep} DECISIONS…`}</p> : null}
      {loadError ? <p className="field-error" role="alert">{isThai ? `โหลดข้อมูลจาก Step ${sourceStep} ไม่สำเร็จ จึงยังยืนยันไม่ได้` : `STEP ${sourceStep} COULD NOT BE LOADED. ALIGNMENT CANNOT BE CONFIRMED.`}</p> : null}
      {!loading && !loadError ? <div className={`alignment-contract alignment-contract--${Math.min(items.length, 3)}`}>
        {items.map((item) => <article key={item.label}>
          <span>{item.label}</span>
          {Array.isArray(item.value) ? <ul>{item.value.length ? item.value.map((value, index) => <li key={`${value}-${index}`}>{value}</li>) : <li>—</li>}</ul> : <p>{item.value || '—'}</p>}
        </article>)}
      </div> : null}

      <div className="alignment-choices" role="radiogroup" aria-label={isThai ? `ความสัมพันธ์ระหว่าง Step ${sourceStep} และ ${targetStep}` : `Relationship between Step ${sourceStep} and ${targetStep}`}>
        <label className={status === 'aligned' ? 'is-active' : ''}>
          <input type="radio" name={`alignment-${targetStep}`} checked={status === 'aligned'} onChange={() => onStatusChange('aligned')} />
          <span><strong>{isThai ? 'สอดคล้องกัน' : 'ALIGNED'}</strong><small>{isThai ? 'งานขั้นนี้ใช้ข้อสรุปเดิมโดยไม่เปลี่ยนความหมาย' : 'This step uses the earlier decisions without changing their meaning.'}</small></span>
        </label>
        <label className={status === 'clarifies' ? 'is-active' : ''}>
          <input type="radio" name={`alignment-${targetStep}`} checked={status === 'clarifies'} onChange={() => onStatusChange('clarifies')} />
          <span><strong>{isThai ? 'ทำให้ชัดขึ้น' : 'CLARIFIES'}</strong><small>{isThai ? 'เพิ่มรายละเอียดหรือกำหนดวิธีตีความ โดยไม่เปลี่ยน Product decision เดิม' : 'Adds detail or interpretation without changing the earlier product decision.'}</small></span>
        </label>
        <label className={status === 'revision' ? 'is-active is-revision' : 'is-revision'}>
          <input type="radio" name={`alignment-${targetStep}`} checked={status === 'revision'} onChange={() => onStatusChange('revision')} />
          <span><strong>{isThai ? 'เปลี่ยนคำตัดสินเดิม' : 'CHANGES AN EARLIER DECISION'}</strong><small>{isThai ? (allowRevision ? 'บันทึกสิ่งที่พบ แล้วใช้ Step ถัดไปเลือกจุดเริ่ม Revision' : 'ต้องย้อนกลับไปสร้าง Revision ก่อนยืนยัน Step นี้') : (allowRevision ? 'Record the finding, then route the revision in the next step.' : 'Return to the owning step and create a revision before locking this step.')}</small></span>
        </label>
      </div>

      {status === 'clarifies' || status === 'revision' ? <label className="alignment-note">
        <span>{isThai ? (status === 'clarifies' ? 'รายละเอียดที่ทำให้ชัดขึ้น' : 'คำตัดสินเดิมที่ต้องเปลี่ยน') : (status === 'clarifies' ? 'LATEST INTERPRETATION' : 'DECISION THAT MUST CHANGE')}</span>
        <small>{isThai ? 'เขียนให้ชัดพอที่ Step ถัดไปจะไม่ต้องเดาความหมาย' : 'Make this explicit enough that the next step will not need to guess.'}</small>
        <textarea rows={3} value={note} onChange={(event) => onNoteChange(event.target.value)} />
      </label> : null}

      {status === 'revision' && !allowRevision ? <div className="alignment-revision-route">
        <RotateCcw size={22} />
        <div><strong>{isThai ? `ยังยืนยัน Step ${targetStep} ไม่ได้` : `STEP ${targetStep} CANNOT BE LOCKED YET`}</strong><p>{isThai ? `กลับไปแก้ Step ที่เป็นเจ้าของคำตัดสิน ระบบจะเก็บฉบับเดิมและเปิด Step ${targetStep} ให้ตรวจใหม่` : `Revise the step that owns the decision. The prior version remains preserved and Step ${targetStep} will reopen for review.`}</p>{revisionAction}</div>
      </div> : null}

      {status && (status !== 'revision' || allowRevision) ? <label className={confirmed ? 'owner-confirm is-active' : 'owner-confirm'}>
        <input type="checkbox" checked={confirmed} disabled={(status === 'clarifies' || status === 'revision') && !note.trim()} onChange={(event) => onConfirmedChange(event.target.checked)} />
        <Check size={19} />
        <span><strong>{isThai ? `ฉันตรวจ Step ${sourceStep} และ ${targetStep} พร้อมกันแล้ว` : `I REVIEWED STEP ${sourceStep} AND ${targetStep} TOGETHER`}</strong><small>{isThai ? 'ข้อมูลที่ส่งต่อไม่ขัดกัน และข้อความด้านบนคือคำอธิบายล่าสุดของฉัน' : 'The handoff is consistent and the statement above is my latest interpretation.'}</small></span>
      </label> : null}
    </PhaseSection>
  )
}
