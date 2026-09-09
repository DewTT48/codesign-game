import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, LockKeyhole, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completeNextIteration, getPhaseEntries } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

type ChangeRoute = '' | 'implementation' | 'PRD' | 'S' | 'E' | 'C'

const initialNext = { change: '', because: '', expectedResult: '', changeRoute: '', routeConfirmed: false }

export function NextPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'N', initialValues: initialNext })
  const feedback = useQuery({ queryKey: ['phase-entries', project.id, 'G'], queryFn: () => getPhaseEntries(project.id, 'G') })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mostImportant = feedback.data?.find((entry) => entry.fieldKey === 'mostImportant')?.content
  const feedbackAlignment = feedback.data?.find((entry) => entry.fieldKey === 'alignmentStatus')?.content
  const feedbackAlignmentNote = feedback.data?.find((entry) => entry.fieldKey === 'alignmentNote')?.content
  const changeRoute = normalizeChangeRoute(draft.values.changeRoute)
  const resetRouteConfirmation = () => draft.setField('routeConfirmed', false)
  const ready = [draft.values.change, draft.values.because, draft.values.expectedResult].every((value) => String(value).trim()) && changeRoute === 'implementation' && Boolean(draft.values.routeConfirmed)
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      return completeNextIteration(project.id, { change: draft.values.change, because: draft.values.because, expectedResult: draft.values.expectedResult, changeRoute, sourceFeedbackAlignment: feedbackAlignment, sourceFeedbackAlignmentNote: feedbackAlignmentNote } as Json)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/COMPLETE`)
    },
  })

  return (
    <JourneyLayout project={project} phase="N" phaseName="NEXT ITERATION" chatContext={{ ...draft.values, mostImportant }} saveState={draft.saveState}>
      <PhaseSection step="01" title={isThai ? 'สิ่งที่การทดสอบเปิดเผย' : 'WHAT THE TEST REVEALED'}>
        <blockquote className="feedback-quote">{typeof mostImportant === 'string' ? mostImportant : (isThai ? 'กำลังโหลดข้อเสนอแนะ…' : 'Loading feedback…')}</blockquote>
      </PhaseSection>
      <PhaseSection step="02" title={isThai ? 'เลือกการเปลี่ยนแปลงหนึ่งเรื่อง' : 'LOCK ONE CHANGE'} description={isThai ? 'ถ้าแก้ได้หนึ่งเรื่องก่อน อะไรจะทำให้ Product เข้าใกล้ Goal มากที่สุด?' : 'If you could change one thing first, what would move the product closest to its goal?'}>
        <FormField label={isThai ? 'สิ่งที่จะเปลี่ยน' : 'CHANGE'} guideKey="next.change" required><textarea rows={4} value={String(draft.values.change)} onChange={(event) => { draft.setField('change', event.target.value); resetRouteConfirmation() }} /></FormField>
        <FormField label={isThai ? 'เพราะอะไร' : 'BECAUSE'} guideKey="next.because" required><textarea rows={4} value={String(draft.values.because)} onChange={(event) => { draft.setField('because', event.target.value); resetRouteConfirmation() }} /></FormField>
        <FormField label={isThai ? 'ผลลัพธ์ที่คาดหวัง' : 'EXPECTED RESULT'} guideKey="next.expected" required><textarea rows={4} value={String(draft.values.expectedResult)} onChange={(event) => { draft.setField('expectedResult', event.target.value); resetRouteConfirmation() }} /></FormField>
      </PhaseSection>
      <PhaseSection step="03" title={isThai ? 'เลือกเจ้าของการเปลี่ยนแปลง' : 'ROUTE THE CHANGE'} description={isThai ? 'ระบุว่าเรื่องนี้แก้ที่การสร้างได้เลย หรือต้องย้อนกลับไปแก้คำตัดสินต้นทาง' : 'Decide whether this is an implementation change or requires a revision of an earlier decision.'}>
        <div className="alignment-contract alignment-contract--2">
          <article><span>{isThai ? 'ผลจาก Step G' : 'STEP G RESULT'}</span><p>{typeof mostImportant === 'string' ? mostImportant : '—'}</p></article>
          <article><span>{isThai ? 'ความสัมพันธ์ที่บันทึกไว้' : 'RECORDED RELATIONSHIP'}</span><p>{[String(feedbackAlignment ?? ''), String(feedbackAlignmentNote ?? '')].filter(Boolean).join(' — ') || '—'}</p></article>
        </div>
        <div className="alignment-choices iteration-route-choices" role="radiogroup" aria-label={isThai ? 'เลือก Step ที่ต้องแก้ไข' : 'Choose the owner of the change'}>
          {([
            ['implementation', isThai ? 'แก้ที่ App' : 'IMPLEMENTATION', isThai ? 'แก้ Code, UI หรือ Bug โดยไม่เปลี่ยน Product decision' : 'Fix code, UI, or a bug without changing a product decision.'],
            ['PRD', isThai ? 'แก้ชุดส่งต่องาน' : 'PRD PACKAGE', isThai ? 'ไฟล์หรือเกณฑ์ตรวจรับประกอบผิดจากข้อมูลที่ยืนยันไว้' : 'The files or acceptance criteria were assembled incorrectly.'],
            ['S', isThai ? 'แก้รายละเอียด' : 'STEP S', isThai ? 'เปลี่ยน Journey เนื้อหา กติกา การบันทึก หรือ Theme' : 'Change the journey, content, rules, records, or theme.'],
            ['E', isThai ? 'แก้ขอบเขต' : 'STEP E', isThai ? 'เปลี่ยน Direction, Must Have หรือ Non-goal' : 'Change direction, must-haves, or non-goals.'],
            ['C', isThai ? 'แก้บริบท' : 'STEP C', isThai ? 'เปลี่ยนผู้ใช้ Goal Success บริบท หรือข้อจำกัด' : 'Change the user, goal, success, context, or constraints.'],
          ] as const).map(([value, title, description]) => <label key={value} className={changeRoute === value ? `is-active ${value === 'implementation' ? '' : 'is-revision'}` : value === 'implementation' ? '' : 'is-revision'}><input type="radio" name="change-route" checked={changeRoute === value} onChange={() => { draft.setField('changeRoute', value); resetRouteConfirmation() }} /><span><strong>{title}</strong><small>{description}</small></span></label>)}
        </div>
        {changeRoute && changeRoute !== 'implementation' ? <div className="alignment-revision-route"><RotateCcw size={22} /><div><strong>{isThai ? `เริ่ม Revision ที่ Step ${changeRoute}` : `START A REVISION AT STEP ${changeRoute}`}</strong><p>{isThai ? 'ระบบจะเก็บฉบับเดิมไว้ และเปิด Step ที่ได้รับผลกระทบให้ตรวจยืนยันใหม่ตามลำดับ' : 'The prior version will be preserved and affected downstream steps will reopen for review.'}</p><Link to={`/projects/${project.id}/${changeRoute}`}>{isThai ? `ไปที่ Step ${changeRoute}` : `GO TO STEP ${changeRoute}`}</Link></div></div> : null}
        {changeRoute === 'implementation' ? <label className={draft.values.routeConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}><input type="checkbox" checked={Boolean(draft.values.routeConfirmed)} onChange={(event) => draft.setField('routeConfirmed', event.target.checked)} /><Flag size={19} /><span><strong>{isThai ? 'การเปลี่ยนแปลงนี้ไม่เปลี่ยน Product decision' : 'THIS CHANGE DOES NOT ALTER A PRODUCT DECISION'}</strong><small>{isThai ? 'สามารถบันทึกเป็นงานรอบถัดไปโดยไม่ย้อน Revision' : 'It can be recorded as the next implementation iteration without revising an earlier step.'}</small></span></label> : null}
      </PhaseSection>
      <ReviewGate title={isThai ? 'ตรวจการเปลี่ยนแปลงรอบถัดไป' : 'NEXT ITERATION GATE'} question={isThai ? 'นี่คือการเปลี่ยนแปลงที่สำคัญที่สุด ไม่ใช่แค่สิ่งที่แก้ง่ายที่สุด ใช่หรือไม่?' : 'Is this the most important change—not merely the easiest one?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'ยืนยันการเปลี่ยนแปลงรอบถัดไป' : 'LOCK NEXT ITERATION')}</ArcadeButton>}>
        <p><Flag size={17} /> {changeRoute && changeRoute !== 'implementation' ? (isThai ? `เรื่องนี้ต้องเริ่ม Revision ที่ Step ${changeRoute} ก่อน จึงยังปิดรอบไม่ได้` : `START A STEP ${changeRoute} REVISION BEFORE CLOSING THIS ITERATION.`) : (isThai ? 'การตัดสินใจนี้จะถูกเก็บใน Decision History และปิด Guided Build รอบแรก' : 'This decision will enter Decision History and complete the first Guided Build.')}</p>
        {completion.isError ? <p className="field-error" role="alert">Lock Next Iteration ไม่สำเร็จ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

function normalizeChangeRoute(value: Json | undefined): ChangeRoute {
  return value === 'implementation' || value === 'PRD' || value === 'S' || value === 'E' || value === 'C' ? value : ''
}
