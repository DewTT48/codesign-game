import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { completeFeedback } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

const checks = [
  ['mobile', 'OPEN ON MOBILE'],
  ['start', 'START THE 21-DAY PROGRAM'],
  ['dailyFlow', 'COMPLETE A REPRESENTATIVE DAILY FLOW'],
  ['saveData', 'ENTER AND SAVE USER DATA'],
  ['reopen', 'REFRESH OR REOPEN THE APP'],
  ['persistence', 'CHECK PROGRESS PERSISTENCE'],
  ['navigation', 'NAVIGATE AWAY AND BACK'],
  ['prdRules', 'CONFIRM IMPORTANT PRD RULES'],
] as const

const initialFeedback = {
  mobile: false, start: false, dailyFlow: false, saveData: false,
  reopen: false, persistence: false, navigation: false, prdRules: false,
  expected: '', actual: '', stuck: '', worked: '', mostImportant: '',
}

export function FeedbackPhase({ project }: { project: ProjectRow }) {
  const draft = usePhaseDraft({ projectId: project.id, phase: 'G', initialValues: initialFeedback })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const checksComplete = checks.every(([key]) => Boolean(draft.values[key]))
  const feedbackComplete = ['expected', 'actual', 'stuck', 'worked', 'mostImportant'].every((key) => String(draft.values[key as keyof typeof initialFeedback]).trim())
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      const creatorTest = Object.fromEntries(checks.map(([key, label]) => [label, Boolean(draft.values[key])])) as Json
      const userTest = { expected: draft.values.expected, actual: draft.values.actual, stuck: draft.values.stuck, worked: draft.values.worked, mostImportant: draft.values.mostImportant } as Json
      return completeFeedback({ projectId: project.id, creatorTest, userTest })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/N`)
    },
  })

  return (
    <JourneyLayout project={project} phase="G" phaseName="GET FEEDBACK" headline="TEST WHAT YOU BUILT, NOT WHAT YOU INTENDED." principle="สังเกตสิ่งที่เกิดขึ้นจริง โดยไม่อธิบาย Interface ให้ผู้ทดสอบจนกว่าเขาจะติดจริง ๆ" hint="จดสิ่งที่เห็น ไม่ใช่เหตุผลแทนผู้ใช้ เช่น เขาหยุดตรงไหน กดอะไรซ้ำ หรือคาดว่าจะเกิดอะไร" chatMove="ช่วยจัดกลุ่ม observation เหล่านี้โดยไม่เสนอ Solution และแยกสิ่งที่ผู้ใช้ทำจริงออกจากการตีความของผม" saveState={draft.saveState}>
      <PhaseSection step="01" title="CREATOR TEST CHECKLIST">
        <div className="test-checklist">{checks.map(([key, label]) => <label className={draft.values[key] ? 'is-active' : ''} key={key}><input type="checkbox" checked={Boolean(draft.values[key])} onChange={(event) => draft.setField(key, event.target.checked)} /><Check size={17} /> {label}</label>)}</div>
      </PhaseSection>
      <PhaseSection step="02" title="USER TEST" description="ให้คนอื่นทดลองก่อน แล้วค่อยบันทึก observation">
        <div className="form-grid form-grid--two">
          <FormField label="I EXPECTED THEM TO…" required><textarea rows={3} value={String(draft.values.expected)} onChange={(event) => draft.setField('expected', event.target.value)} /></FormField>
          <FormField label="THEY ACTUALLY…" required><textarea rows={3} value={String(draft.values.actual)} onChange={(event) => draft.setField('actual', event.target.value)} /></FormField>
          <FormField label="THEY GOT STUCK AT…" required><textarea rows={3} value={String(draft.values.stuck)} onChange={(event) => draft.setField('stuck', event.target.value)} /></FormField>
          <FormField label="WHAT WORKED WELL…" required><textarea rows={3} value={String(draft.values.worked)} onChange={(event) => draft.setField('worked', event.target.value)} /></FormField>
        </div>
        <FormField label="MOST IMPORTANT FEEDBACK…" required><textarea rows={4} value={String(draft.values.mostImportant)} onChange={(event) => draft.setField('mostImportant', event.target.value)} /></FormField>
      </PhaseSection>
      <ReviewGate title="FEEDBACK GATE" question="คุณได้ทดสอบ Product จริงและบันทึกสิ่งที่เกิดขึ้นโดยไม่แก้ต่างแทน Interface แล้วหรือยัง?" actions={<ArcadeButton disabled={!checksComplete || !feedbackComplete || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? 'LOCKING FEEDBACK…' : 'CHOOSE NEXT ITERATION'} <ArrowRight size={18} /></ArcadeButton>}>
        <p>{checksComplete && feedbackComplete ? 'CREATOR TEST + USER OBSERVATION READY' : 'ทำ Checklist และ User test fields ให้ครบก่อน'}</p>
        {completion.isError ? <p className="field-error" role="alert">บันทึก Feedback ไม่สำเร็จ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

