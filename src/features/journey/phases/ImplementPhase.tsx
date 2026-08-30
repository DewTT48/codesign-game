import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { completeImplementation } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

const initialImplement = { workingApp: false, appUrl: '', repositoryUrl: '' }

export function ImplementPhase({ project }: { project: ProjectRow }) {
  const draft = usePhaseDraft({ projectId: project.id, phase: 'I', initialValues: initialImplement })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ready = Boolean(draft.values.workingApp && String(draft.values.appUrl).trim())
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      return completeImplementation({
        projectId: project.id,
        appUrl: String(draft.values.appUrl),
        repositoryUrl: String(draft.values.repositoryUrl),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/G`)
    },
  })

  return (
    <JourneyLayout project={project} phase="I" phaseName="IMPLEMENT" headline="YOU KNOW WHAT TO BUILD. NOW LET CODEX BUILD IT." principle="Codex ตัดสินใจเรื่อง implementation ได้ แต่ไม่ควรสร้าง Product decision สำคัญขึ้นมาเอง" hint="เมื่อเจอความกำกวมที่เปลี่ยนพฤติกรรม Product ให้กลับไปแก้ PRD แทนการเดาหรือเพิ่ม Feature" chatMove="Implement PRD นี้อย่างครบถ้วน หากความกำกวมใดเปลี่ยน Product behavior ให้ระบุ PRODUCT DECISION REQUIRED แทนการเดา" saveState={draft.saveState}>
      <PhaseSection step="01" title="HANDOFF TO CODEX" description="ใช้ PRD ที่ Solidified แล้วเป็น source of truth">
        <ol className="implementation-steps">
          {['Open or create the project in Codex', 'Give Codex the exported PRD', 'Build the complete Basic version', 'Preview and fix implementation issues', 'Deploy to GitHub Pages'].map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
        </ol>
      </PhaseSection>
      <PhaseSection step="02" title="SAVE THE WORKING BUILD">
        <label className={draft.values.workingApp ? 'build-confirm is-active' : 'build-confirm'}>
          <input type="checkbox" checked={Boolean(draft.values.workingApp)} onChange={(event) => draft.setField('workingApp', event.target.checked)} />
          <Check size={20} /> <strong>I HAVE A WORKING APP</strong>
        </label>
        <div className="form-grid form-grid--two">
          <FormField label="APP URL" required><input type="url" placeholder="https://…" value={String(draft.values.appUrl)} onChange={(event) => draft.setField('appUrl', event.target.value)} /></FormField>
          <FormField label="REPOSITORY URL" hint="OPTIONAL"><input type="url" placeholder="https://github.com/…" value={String(draft.values.repositoryUrl)} onChange={(event) => draft.setField('repositoryUrl', event.target.value)} /></FormField>
        </div>
      </PhaseSection>
      <ReviewGate title="IMPLEMENTATION GATE" question="App ทำงานจริงและพร้อมให้คนอื่นทดลองแล้วหรือยัง?" actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? 'SAVING BUILD…' : 'START FEEDBACK'} <ArrowRight size={18} /></ArcadeButton>}>
        <p><ExternalLink size={17} /> URL นี้จะถูกบันทึกเป็น Build v1 ใน Journal</p>
        {completion.isError ? <p className="field-error" role="alert">บันทึก Working App ไม่สำเร็จ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

