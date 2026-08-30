import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

type Assumption = { text: string; stance: '' | 'agree' | 'challenge'; why: string; change: string }
const blankAssumption = (): Assumption => ({ text: '', stance: '', why: '', change: '' })
const initialDebate = { assumptions: [blankAssumption(), blankAssumption()] as unknown as Json, directionResult: '', whatChanged: '' }

export function DebatePhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'D', initialValues: initialDebate })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const assumptions = draft.values.assumptions as unknown as Assumption[]
  const completion = useMutation({ mutationFn: async () => { await draft.saveAll(); return completePhase(project.id, 'D') }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['project', project.id] }); navigate(`/projects/${project.id}/E`) } })
  function updateAssumption(index: number, patch: Partial<Assumption>) { draft.setField('assumptions', assumptions.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) as unknown as Json) }
  const ready = assumptions.every((item) => item.text.trim() && item.stance && (item.stance !== 'challenge' || (item.why.trim() && item.change.trim()))) && Boolean(String(draft.values.directionResult)) && Boolean(String(draft.values.whatChanged).trim())

  return (
    <JourneyLayout project={project} phase="D" phaseName="DEBATE" chatContext={draft.values} saveState={draft.saveState}>
      <PhaseSection step="01" title="EXPOSE THE ASSUMPTIONS" description={isThai ? 'ใช้ Prompt Kit ค้นหาสิ่งที่ข้อเสนอถือว่าเป็นจริงโดยยังไม่มีหลักฐาน' : 'Use the Prompt Kit to expose what the proposal treats as true without evidence.'}>
        <div className="assumption-stack">
          {assumptions.map((assumption, index) => (
            <article className="assumption-card" key={index}>
              <FormField label={`AI ASSUMED THAT… ${index + 1}`} guideKey="debate.assumption" required><textarea rows={3} value={assumption.text} onChange={(event) => updateAssumption(index, { text: event.target.value })} /></FormField>
              <div className="stance-buttons">
                <button className={assumption.stance === 'agree' ? 'is-active' : ''} type="button" onClick={() => updateAssumption(index, { stance: 'agree' })}>WE AGREE</button>
                <button className={assumption.stance === 'challenge' ? 'is-active challenge' : ''} type="button" onClick={() => updateAssumption(index, { stance: 'challenge' })}>WE CHALLENGE</button>
              </div>
              {assumption.stance === 'challenge' ? <div className="form-grid form-grid--two challenge-fields"><FormField label="WHY?" guideKey="debate.why"><textarea rows={3} value={assumption.why} onChange={(event) => updateAssumption(index, { why: event.target.value })} /></FormField><FormField label="WHAT SHOULD CHANGE?" guideKey="debate.change"><textarea rows={3} value={assumption.change} onChange={(event) => updateAssumption(index, { change: event.target.value })} /></FormField></div> : null}
            </article>
          ))}
        </div>
      </PhaseSection>
      <PhaseSection step="02" title="RECONSIDER WITH CHAT" description={isThai ? 'ใช้ Locked Context และคำท้าทายของคุณพิจารณา Direction ใหม่' : 'Reconsider the direction using locked context and your challenges.'}>
        <div className="choice-grid choice-grid--two">
          {['OUR DIRECTION STAYED THE SAME', 'WE CHANGED OUR DIRECTION'].map((option) => <label className={draft.values.directionResult === option ? 'simple-choice is-active' : 'simple-choice'} key={option}><input type="radio" name="direction-result" checked={draft.values.directionResult === option} onChange={() => draft.setField('directionResult', option)} />{option}</label>)}
        </div>
        <FormField label="WHAT CHANGED AND WHY?" guideKey="debate.whatChanged" required><textarea rows={4} value={String(draft.values.whatChanged)} onChange={(event) => draft.setField('whatChanged', event.target.value)} /></FormField>
      </PhaseSection>
      <ReviewGate title="DEBATE COMPLETE" question={isThai ? 'คุณได้ท้าทายสิ่งที่ AI คาดไว้ และบันทึกเหตุผลของมนุษย์แล้วหรือยัง?' : 'Have you challenged AI assumptions and recorded the human reasoning?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? 'LOCKING…' : 'ESTABLISH DIRECTION'} <ArrowRight aria-hidden="true" size={18} /></ArcadeButton>}>
        <p>{isThai ? 'ข้อเสนอเดิม สมมติฐาน เหตุผล และผลลัพธ์ใหม่จะอยู่ใน Journal โดยไม่เขียนทับกัน' : 'The original proposal, assumptions, reasoning, and revised result remain in the Journal.'}</p>
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'บันทึก Debate ไม่สำเร็จ กรุณาลองใหม่' : 'Could not save the debate. Please try again.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
