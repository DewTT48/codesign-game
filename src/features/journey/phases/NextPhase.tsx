import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completeNextIteration, getPhaseEntries } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

const initialNext = { change: '', because: '', expectedResult: '' }

export function NextPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'N', initialValues: initialNext })
  const feedback = useQuery({ queryKey: ['phase-entries', project.id, 'G'], queryFn: () => getPhaseEntries(project.id, 'G') })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mostImportant = feedback.data?.find((entry) => entry.fieldKey === 'mostImportant')?.content
  const ready = [draft.values.change, draft.values.because, draft.values.expectedResult].every((value) => String(value).trim())
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      return completeNextIteration(project.id, { change: draft.values.change, because: draft.values.because, expectedResult: draft.values.expectedResult } as Json)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/COMPLETE`)
    },
  })

  return (
    <JourneyLayout project={project} phase="N" phaseName="NEXT ITERATION" chatContext={{ ...draft.values, mostImportant }} saveState={draft.saveState}>
      <PhaseSection step="01" title="WHAT THE TEST REVEALED">
        <blockquote className="feedback-quote">{typeof mostImportant === 'string' ? mostImportant : 'Feedback กำลังโหลด…'}</blockquote>
      </PhaseSection>
      <PhaseSection step="02" title="LOCK ONE CHANGE" description="ถ้าแก้ได้หนึ่งเรื่องก่อน อะไรจะทำให้ Product เข้าใกล้ Goal มากที่สุด?">
        <FormField label="CHANGE" guideKey="next.change" required><textarea rows={4} value={String(draft.values.change)} onChange={(event) => draft.setField('change', event.target.value)} /></FormField>
        <FormField label="BECAUSE" guideKey="next.because" required><textarea rows={4} value={String(draft.values.because)} onChange={(event) => draft.setField('because', event.target.value)} /></FormField>
        <FormField label="EXPECTED RESULT" guideKey="next.expected" required><textarea rows={4} value={String(draft.values.expectedResult)} onChange={(event) => draft.setField('expectedResult', event.target.value)} /></FormField>
      </PhaseSection>
      <ReviewGate title="NEXT ITERATION GATE" question={isThai ? 'นี่คือการเปลี่ยนแปลงที่สำคัญที่สุด—not แค่สิ่งที่แก้ง่ายที่สุด—ใช่หรือไม่?' : 'Is this the most important change—not merely the easiest one?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? 'LOCKING…' : 'LOCK NEXT ITERATION'}</ArcadeButton>}>
        <p><Flag size={17} /> {isThai ? 'การตัดสินใจนี้จะถูกเก็บใน Decision History และปิด Guided Build รอบแรก' : 'This decision will enter Decision History and complete the first Guided Build.'}</p>
        {completion.isError ? <p className="field-error" role="alert">Lock Next Iteration ไม่สำเร็จ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
