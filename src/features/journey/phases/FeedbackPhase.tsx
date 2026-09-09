import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { CrossStepAlignment } from '../CrossStepAlignment'
import { alignmentIsReady, entriesToRecord, normalizeAlignmentStatus } from '../crossStepAlignmentModel'
import { completeFeedback, getPhaseEntries } from '../journey.service'
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

const thaiCheckLabels: Record<(typeof checks)[number][0], string> = {
  mobile: 'เปิดใช้งานบนโทรศัพท์',
  start: 'เริ่มโปรแกรม 21 วัน',
  dailyFlow: 'ทำขั้นตอนของหนึ่งวันตัวอย่างจนจบ',
  saveData: 'กรอกและบันทึกข้อมูลของผู้ใช้',
  reopen: 'รีเฟรชหรือเปิด App ใหม่',
  persistence: 'ตรวจว่าความคืบหน้ายังคงอยู่',
  navigation: 'ออกจากหน้าแล้วกลับเข้ามาใหม่',
  prdRules: 'ตรวจยืนยันกติกาสำคัญจาก PRD',
}

const initialFeedback = {
  mobile: false, start: false, dailyFlow: false, saveData: false,
  reopen: false, persistence: false, navigation: false, prdRules: false,
  expected: '', actual: '', stuck: '', worked: '', mostImportant: '',
  alignmentStatus: '', alignmentNote: '', alignmentConfirmed: false,
}

export function FeedbackPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'G', initialValues: initialFeedback })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const buildEntries = useQuery({ queryKey: ['phase-entries', project.id, 'I'], queryFn: () => getPhaseEntries(project.id, 'I') })
  const build = entriesToRecord(buildEntries.data)
  const alignmentStatus = normalizeAlignmentStatus(draft.values.alignmentStatus)
  const alignmentNote = String(draft.values.alignmentNote)
  const resetAlignment = () => draft.setField('alignmentConfirmed', false)
  const checksComplete = checks.every(([key]) => Boolean(draft.values[key]))
  const feedbackComplete = ['expected', 'actual', 'stuck', 'worked', 'mostImportant'].every((key) => String(draft.values[key as keyof typeof initialFeedback]).trim())
  const alignmentReady = alignmentIsReady({ status: alignmentStatus, note: alignmentNote, confirmed: Boolean(draft.values.alignmentConfirmed), allowRevision: true })
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      const creatorTest = Object.fromEntries(checks.map(([key, label]) => [label, Boolean(draft.values[key])])) as Json
      const userTest = { expected: draft.values.expected, actual: draft.values.actual, stuck: draft.values.stuck, worked: draft.values.worked, mostImportant: draft.values.mostImportant, alignmentStatus, alignmentNote } as Json
      return completeFeedback({ projectId: project.id, creatorTest, userTest })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/N`)
    },
  })

  return (
    <JourneyLayout project={project} phase="G" phaseName="GET FEEDBACK" chatContext={draft.values} saveState={draft.saveState}>
      <PhaseSection step="01" title={isThai ? 'รายการทดสอบสำหรับผู้สร้าง' : 'CREATOR TEST CHECKLIST'}>
        <div className="test-checklist">{checks.map(([key, label]) => <label className={draft.values[key] ? 'is-active' : ''} key={key}><input type="checkbox" checked={Boolean(draft.values[key])} onChange={(event) => { draft.setField(key, event.target.checked); resetAlignment() }} /><Check size={17} /> {isThai ? thaiCheckLabels[key] : label}</label>)}</div>
      </PhaseSection>
      <PhaseSection step="02" title={isThai ? 'ทดสอบกับผู้ใช้' : 'USER TEST'} description={isThai ? 'ให้คนอื่นทดลองก่อน แล้วบันทึกสิ่งที่สังเกตได้โดยไม่ชี้นำหรืออธิบายแทนหน้าจอ' : 'Let another person test first, then record observations without coaching them.'}>
        <div className="form-grid form-grid--two">
          <FormField label={isThai ? 'ฉันคาดว่าผู้ใช้จะ…' : 'I EXPECTED THEM TO…'} guideKey="feedback.expected" required><textarea rows={3} value={String(draft.values.expected)} onChange={(event) => { draft.setField('expected', event.target.value); resetAlignment() }} /></FormField>
          <FormField label={isThai ? 'สิ่งที่ผู้ใช้ทำจริงคือ…' : 'THEY ACTUALLY…'} guideKey="feedback.actual" required><textarea rows={3} value={String(draft.values.actual)} onChange={(event) => { draft.setField('actual', event.target.value); resetAlignment() }} /></FormField>
          <FormField label={isThai ? 'ผู้ใช้ติดขัดตรง…' : 'THEY GOT STUCK AT…'} guideKey="feedback.stuck" required><textarea rows={3} value={String(draft.values.stuck)} onChange={(event) => { draft.setField('stuck', event.target.value); resetAlignment() }} /></FormField>
          <FormField label={isThai ? 'สิ่งที่ทำงานได้ดีคือ…' : 'WHAT WORKED WELL…'} guideKey="feedback.worked" required><textarea rows={3} value={String(draft.values.worked)} onChange={(event) => { draft.setField('worked', event.target.value); resetAlignment() }} /></FormField>
        </div>
        <FormField label={isThai ? 'ข้อเสนอแนะที่สำคัญที่สุดคือ…' : 'MOST IMPORTANT FEEDBACK…'} guideKey="feedback.important" required><textarea rows={4} value={String(draft.values.mostImportant)} onChange={(event) => { draft.setField('mostImportant', event.target.value); resetAlignment() }} /></FormField>
      </PhaseSection>
      <CrossStepAlignment
        step="03"
        sourceStep="I"
        targetStep="G"
        loading={buildEntries.isLoading}
        loadError={buildEntries.isError}
        allowRevision
        items={[
          { label: isThai ? 'แอปที่นำมาทดสอบ' : 'BUILD UNDER TEST', value: String(build.appUrl ?? '') },
          { label: isThai ? 'Repository' : 'REPOSITORY', value: String(build.repositoryUrl ?? '') },
          { label: isThai ? 'ความสัมพันธ์กับ PRD ที่ยืนยันไว้' : 'IMPLEMENTATION TO PRD', value: [String(build.alignmentStatus ?? ''), String(build.alignmentNote ?? '')].filter(Boolean) },
        ]}
        status={alignmentStatus}
        note={alignmentNote}
        confirmed={Boolean(draft.values.alignmentConfirmed)}
        onStatusChange={(status) => { draft.setField('alignmentStatus', status); draft.setField('alignmentConfirmed', false) }}
        onNoteChange={(note) => { draft.setField('alignmentNote', note); resetAlignment() }}
        onConfirmedChange={(confirmed) => draft.setField('alignmentConfirmed', confirmed)}
      />
      <ReviewGate title={isThai ? 'ตรวจความพร้อมของข้อเสนอแนะ' : 'FEEDBACK GATE'} question={isThai ? 'คุณได้ทดสอบ Product จริงและบันทึกสิ่งที่เกิดขึ้นโดยไม่แก้ต่างแทน Interface แล้วหรือยัง?' : 'Did you test the real product and record what happened without defending the interface?'} actions={<ArcadeButton disabled={!checksComplete || !feedbackComplete || !buildEntries.isSuccess || !alignmentReady || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? (isThai ? 'กำลังบันทึกข้อเสนอแนะ…' : 'LOCKING FEEDBACK…') : (isThai ? 'เลือกสิ่งที่จะปรับรอบถัดไป' : 'CHOOSE NEXT ITERATION')} <ArrowRight size={18} /></ArcadeButton>}>
        <p>{checksComplete && feedbackComplete ? (isThai ? 'รายการทดสอบและสิ่งที่สังเกตจากผู้ใช้พร้อมแล้ว' : 'CREATOR TEST + USER OBSERVATION READY') : (isThai ? 'ทำรายการทดสอบและกรอกผลทดสอบกับผู้ใช้ให้ครบก่อน' : 'Complete the checklist and all user-test fields first.')}</p>
        {completion.isError ? <p className="field-error" role="alert">บันทึก Feedback ไม่สำเร็จ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
