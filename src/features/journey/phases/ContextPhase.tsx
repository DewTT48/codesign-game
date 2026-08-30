import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { ChoiceCard, FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

const reflectionOptions = [
  'It made my idea clearer',
  'It found something I had not considered',
  'I had to correct Chat',
  'My thinking did not change much',
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
      headline="DON'T DESIGN YET."
      principle="ก่อนคิดว่า App จะมี Feature อะไร ทำให้ชัดก่อนว่าคุณกำลังสร้างมันให้ใครและเพื่ออะไร"
      hint="ลองนึกถึงคนหนึ่งคนที่คุณอยากช่วย เขาอยู่ในสถานการณ์แบบไหน และหลังครบ 21 วันคุณอยากเห็นอะไรเปลี่ยนไป?"
      chatMove="ยังไม่ต้องออกแบบ App ช่วยถามคำถามเพื่อทำความเข้าใจ User, Goal, Context และ Constraints ของสิ่งที่ผมกำลังสร้างก่อน"
      saveState={draft.saveState}
    >
      <PhaseSection step="01" title="THINK FIRST" description="บันทึกความคิดของคุณก่อนเปิด Chat ไม่ต้องพยายามตอบให้สมบูรณ์">
        <div className="form-grid form-grid--two">
          <FormField label="WHO DO YOU WANT TO HELP?">
            <textarea value={draft.values.initialWho} onChange={(event) => draft.setField('initialWho', event.target.value)} rows={3} />
          </FormField>
          <FormField label="WHAT SHOULD HAPPEN AFTER 21 DAYS?">
            <textarea value={draft.values.initialOutcome} onChange={(event) => draft.setField('initialOutcome', event.target.value)} rows={3} />
          </FormField>
        </div>
      </PhaseSection>

      <PhaseSection step="02" title="TALK TO CHAT" description="ใช้ Chat conversation จริงของคุณเพื่อทำความเข้าใจ Context — ยังไม่ให้ออกแบบ App">
        <div className="chat-mission-card">
          <span>CHAT MISSION</span>
          <p>ทำให้ WHO · GOAL · SUCCESS · CONTEXT OF USE · CONSTRAINTS ชัดเจน</p>
          <strong>DO NOT ASK FOR FEATURES YET.</strong>
        </div>
      </PhaseSection>

      <PhaseSection step="03" title="CAPTURE WHAT MATTERS" description="นำเฉพาะข้อสรุปสำคัญกลับมา ไม่ต้องคัดลอก Chat transcript">
        <div className="form-grid">
          <FormField label="WHO IS THIS FOR?" required><textarea rows={3} value={draft.values.who} onChange={(event) => draft.setField('who', event.target.value)} /></FormField>
          <FormField label="WHAT DO THEY WANT TO ACHIEVE?" required><textarea rows={3} value={draft.values.goal} onChange={(event) => draft.setField('goal', event.target.value)} /></FormField>
          <FormField label="SUCCESS LOOKS LIKE…" required><textarea rows={3} value={draft.values.success} onChange={(event) => draft.setField('success', event.target.value)} /></FormField>
          <FormField label="IMPORTANT CONTEXT" required><textarea rows={3} value={draft.values.importantContext} onChange={(event) => draft.setField('importantContext', event.target.value)} /></FormField>
          <FormField label="CONSTRAINTS" required><textarea rows={3} value={draft.values.constraints} onChange={(event) => draft.setField('constraints', event.target.value)} /></FormField>
        </div>
      </PhaseSection>

      <PhaseSection step="04" title="WHAT DID CHAT CHANGE?">
        <div className="choice-grid">
          {reflectionOptions.map((option) => (
            <label key={option}>
              <input type="checkbox" checked={draft.values.reflection.includes(option)} onChange={() => toggleReflection(option)} />
              <ChoiceCard active={draft.values.reflection.includes(option)} title={option} />
            </label>
          ))}
        </div>
        <FormField label="WHAT DID YOU CORRECT OR CHANGE?" hint="OPTIONAL">
          <textarea rows={3} value={draft.values.corrections} onChange={(event) => draft.setField('corrections', event.target.value)} />
        </FormField>
      </PhaseSection>

      {!reviewing ? (
        <div className="phase-next-row">
          <p>{requiredComplete ? 'REQUIRED CONTEXT CAPTURED' : 'COMPLETE ALL REQUIRED CONTEXT FIELDS'}</p>
          <ArcadeButton disabled={!requiredComplete} onClick={() => setReviewing(true)}>REVIEW CONTEXT <Check aria-hidden="true" size={18} /></ArcadeButton>
        </div>
      ) : (
        <ReviewGate
          title="REVIEW GATE"
          question="ถ้ามีคนอื่นอ่านแค่นี้ เขาจะเข้าใจไหมว่าเรากำลังสร้างอะไร เพื่อใคร และเพื่ออะไร?"
          actions={
            <>
              <ArcadeButton variant="secondary" onClick={() => setReviewing(false)}>NOT YET — EDIT</ArcadeButton>
              <ArcadeButton disabled={completion.isPending} onClick={() => completion.mutate()}>
                <LockKeyhole aria-hidden="true" size={18} /> {completion.isPending ? 'LOCKING…' : 'YES — LOCK CONTEXT'}
              </ArcadeButton>
            </>
          }
        >
          <dl>
            <div><dt>WHO</dt><dd>{draft.values.who}</dd></div>
            <div><dt>GOAL</dt><dd>{draft.values.goal}</dd></div>
            <div><dt>SUCCESS</dt><dd>{draft.values.success}</dd></div>
            <div><dt>CONTEXT</dt><dd>{draft.values.importantContext}</dd></div>
            <div><dt>CONSTRAINTS</dt><dd>{draft.values.constraints}</dd></div>
          </dl>
          {completion.isError ? <p className="field-error" role="alert">Lock ไม่สำเร็จ ข้อมูลยังไม่เปลี่ยนสถานะ กรุณาลองใหม่</p> : null}
        </ReviewGate>
      )}
    </JourneyLayout>
  )
}
