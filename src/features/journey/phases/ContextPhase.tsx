import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import { useLanguage } from '../../i18n/LanguageContext'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { ChoiceCard, FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

const reflectionOptions = [
  { value: 'It made my idea clearer', th: 'Chat ช่วยให้ไอเดียชัดขึ้น' },
  { value: 'It found something I had not considered', th: 'Chat พบสิ่งที่ฉันยังไม่ได้คิดถึง' },
  { value: 'I had to correct Chat', th: 'ฉันต้องแก้ความเข้าใจของ Chat' },
  { value: 'My thinking did not change much', th: 'ความคิดของฉันแทบไม่เปลี่ยน' },
]

const initialContext = {
  initialWho: '',
  initialOutcome: '',
  who: '',
  goal: '',
  success: '',
  importantContext: '',
  constraints: '',
  reflection: [] as string[],
  corrections: '',
}

export function ContextPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'C', initialValues: initialContext })
  const [reviewing, setReviewing] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      return completePhase(project.id, 'C')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/O`)
    },
  })

  const requiredComplete = [
    draft.values.who,
    draft.values.goal,
    draft.values.success,
    draft.values.importantContext,
    draft.values.constraints,
  ].every((value) => value.trim().length > 0)

  function toggleReflection(option: string) {
    const next = draft.values.reflection.includes(option)
      ? draft.values.reflection.filter((item) => item !== option)
      : [...draft.values.reflection, option]
    draft.setField('reflection', next)
  }

  return (
    <JourneyLayout
      project={project}
      phase="C"
      phaseName="CONTEXT"
      chatContext={draft.values}
      saveState={draft.saveState}
    >
      <PhaseSection step="01" title={isThai ? 'คิดก่อนคุยกับ Chat' : 'THINK FIRST'} description={isThai ? 'บันทึกความคิดตั้งต้นก่อนเปิด Chat ไม่ต้องพยายามตอบให้สมบูรณ์' : 'Capture your starting thought before opening Chat. It does not need to be complete.'}>
        <div className="form-grid form-grid--two">
          <FormField label={isThai ? 'คุณอยากช่วยใคร?' : 'WHO DO YOU WANT TO HELP?'} guideKey="context.initialWho">
            <textarea value={draft.values.initialWho} onChange={(event) => draft.setField('initialWho', event.target.value)} rows={3} />
          </FormField>
          <FormField label={isThai ? 'หลัง 21 วัน คุณอยากให้เกิดอะไรขึ้น?' : 'WHAT SHOULD HAPPEN AFTER 21 DAYS?'} guideKey="context.initialOutcome">
            <textarea value={draft.values.initialOutcome} onChange={(event) => draft.setField('initialOutcome', event.target.value)} rows={3} />
          </FormField>
        </div>
      </PhaseSection>

      <PhaseSection step="02" title={isThai ? 'คุยกับ Chat' : 'TALK TO CHAT'} description={isThai ? 'เปิดชุดคำสั่งด้านบน คัดลอก Prompt และสนทนาจนได้สรุปครบ 5 หัวข้อ' : 'Open the Prompt Kit above, copy the prompt, and continue until all five areas are clear.'}>
        <div className="chat-mission-card">
          <span>{isThai ? 'ภารกิจในการคุยกับ Chat' : 'CHAT MISSION'}</span>
          <p>{isThai ? 'ทำให้ WHO · GOAL · SUCCESS · CONTEXT OF USE · CONSTRAINTS ชัดเจน' : 'Clarify WHO · GOAL · SUCCESS · CONTEXT OF USE · CONSTRAINTS'}</p>
          <strong>{isThai ? 'ยังไม่ต้องขอให้ Chat เสนอ Feature' : 'DO NOT ASK FOR FEATURES YET.'}</strong>
        </div>
      </PhaseSection>

      <PhaseSection step="03" title={isThai ? 'บันทึกเฉพาะสิ่งสำคัญ' : 'CAPTURE WHAT MATTERS'} description={isThai ? 'นำเฉพาะข้อสรุปสำคัญกลับมา ไม่ต้องคัดลอกบทสนทนาทั้งหมด' : 'Bring back the important decisions, not the full transcript.'}>
        <div className="form-grid">
          <FormField label={isThai ? 'Product นี้สร้างให้ใคร?' : 'WHO IS THIS FOR?'} guideKey="context.who" required><textarea rows={3} value={draft.values.who} onChange={(event) => draft.setField('who', event.target.value)} /></FormField>
          <FormField label={isThai ? 'ผู้ใช้ต้องการบรรลุอะไร?' : 'WHAT DO THEY WANT TO ACHIEVE?'} guideKey="context.goal" required><textarea rows={3} value={draft.values.goal} onChange={(event) => draft.setField('goal', event.target.value)} /></FormField>
          <FormField label={isThai ? 'เมื่อสำเร็จแล้วจะเห็นอะไรเกิดขึ้น?' : 'SUCCESS LOOKS LIKE…'} guideKey="context.success" required><textarea rows={3} value={draft.values.success} onChange={(event) => draft.setField('success', event.target.value)} /></FormField>
          <FormField label={isThai ? 'บริบทสำคัญ' : 'IMPORTANT CONTEXT'} guideKey="context.importantContext" required><textarea rows={3} value={draft.values.importantContext} onChange={(event) => draft.setField('importantContext', event.target.value)} /></FormField>
          <FormField label={isThai ? 'ข้อจำกัด' : 'CONSTRAINTS'} guideKey="context.constraints" required><textarea rows={3} value={draft.values.constraints} onChange={(event) => draft.setField('constraints', event.target.value)} /></FormField>
        </div>
      </PhaseSection>

      <PhaseSection step="04" title={isThai ? 'Chat ทำให้ความคิดของคุณเปลี่ยนอย่างไร?' : 'WHAT DID CHAT CHANGE?'}>
        <div className="choice-grid">
          {reflectionOptions.map((option) => (
            <label key={option.value}>
              <input type="checkbox" checked={draft.values.reflection.includes(option.value)} onChange={() => toggleReflection(option.value)} />
              <ChoiceCard active={draft.values.reflection.includes(option.value)} title={isThai ? option.th : option.value} />
            </label>
          ))}
        </div>
        <FormField label={isThai ? 'คุณแก้หรือเปลี่ยนความเข้าใจเรื่องใด?' : 'WHAT DID YOU CORRECT OR CHANGE?'} guideKey="context.corrections" hint={isThai ? 'ไม่บังคับ' : 'OPTIONAL'}>
          <textarea rows={3} value={draft.values.corrections} onChange={(event) => draft.setField('corrections', event.target.value)} />
        </FormField>
      </PhaseSection>

      {!reviewing ? (
        <div className="phase-next-row">
          <p>{requiredComplete ? (isThai ? 'กรอก Context ที่จำเป็นครบแล้ว' : 'REQUIRED CONTEXT CAPTURED') : (isThai ? 'กรอก Context ที่จำเป็นให้ครบ' : 'COMPLETE ALL REQUIRED CONTEXT FIELDS')}</p>
          <ArcadeButton disabled={!requiredComplete} onClick={() => setReviewing(true)}>{isThai ? 'ตรวจทานบริบท' : 'REVIEW CONTEXT'} <Check aria-hidden="true" size={18} /></ArcadeButton>
        </div>
      ) : (
        <ReviewGate
          title={isThai ? 'ตรวจความพร้อมของบริบท' : 'REVIEW GATE'}
          question={isThai ? 'ถ้ามีคนอื่นอ่านแค่นี้ เขาจะเข้าใจไหมว่าเรากำลังสร้างอะไร เพื่อใคร และเพื่ออะไร?' : 'Would another person understand what we are building, for whom, and why from this alone?'}
          actions={
            <>
              <ArcadeButton variant="secondary" onClick={() => setReviewing(false)}>{isThai ? 'ยัง — กลับไปแก้' : 'NOT YET — EDIT'}</ArcadeButton>
              <ArcadeButton disabled={completion.isPending} onClick={() => completion.mutate()}>
                <LockKeyhole aria-hidden="true" size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'ใช่ — ยืนยันบริบท' : 'YES — LOCK CONTEXT')}
              </ArcadeButton>
            </>
          }
        >
          <dl>
            <div><dt>{isThai ? 'ผู้ใช้หลัก' : 'WHO'}</dt><dd>{draft.values.who}</dd></div>
            <div><dt>{isThai ? 'เป้าหมาย' : 'GOAL'}</dt><dd>{draft.values.goal}</dd></div>
            <div><dt>{isThai ? 'ภาพความสำเร็จ' : 'SUCCESS'}</dt><dd>{draft.values.success}</dd></div>
            <div><dt>{isThai ? 'บริบท' : 'CONTEXT'}</dt><dd>{draft.values.importantContext}</dd></div>
            <div><dt>{isThai ? 'ข้อจำกัด' : 'CONSTRAINTS'}</dt><dd>{draft.values.constraints}</dd></div>
          </dl>
          {completion.isError ? <p className="field-error" role="alert">{isThai ? 'Lock ไม่สำเร็จ ข้อมูลยังไม่เปลี่ยนสถานะ กรุณาลองใหม่' : 'Lock failed. Nothing changed; please try again.'}</p> : null}
        </ReviewGate>
      )}
    </JourneyLayout>
  )
}
