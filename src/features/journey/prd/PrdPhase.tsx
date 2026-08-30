import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clipboard, Download, LockKeyhole, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import {
  getPhaseEntries,
  getPrdSource,
  lockPrd,
  savePhaseEntry,
} from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { PhaseSection, ReviewGate } from '../PhaseFormComponents'
import type { SaveState } from '../usePhaseDraft'
import { assemblePrd } from './assemblePrd'

export function PrdPhase({ project }: { project: ProjectRow }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<number | null>(null)
  const hydratedRef = useRef(false)
  const [markdown, setMarkdown] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [feedback, setFeedback] = useState('')

  const source = useQuery({
    queryKey: ['prd-source', project.id],
    queryFn: () => getPrdSource(project.id),
  })
  const draft = useQuery({
    queryKey: ['phase-entries', project.id, 'PRD'],
    queryFn: () => getPhaseEntries(project.id, 'PRD'),
  })

  useEffect(() => {
    if (hydratedRef.current || !source.data || !draft.data) return
    hydratedRef.current = true
    const saved = draft.data.find((entry) => entry.fieldKey === 'markdownDraft')
    const initial = typeof saved?.content === 'string'
      ? saved.content
      : assemblePrd(project, source.data)
    setMarkdown(initial)

    if (!saved) {
      setSaveState('saving')
      void savePhaseEntry({
        projectId: project.id,
        phase: 'PRD',
        section: 'document',
        fieldKey: 'markdownDraft',
        content: initial,
      }).then(() => setSaveState('saved')).catch(() => setSaveState('error'))
    } else {
      setSaveState('saved')
    }
  }, [draft.data, project, source.data])

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  const persist = async (nextMarkdown: string) => {
    setSaveState('saving')
    try {
      await savePhaseEntry({
        projectId: project.id,
        phase: 'PRD',
        section: 'document',
        fieldKey: 'markdownDraft',
        content: nextMarkdown,
      })
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      throw error
    }
  }

  const updateMarkdown = (nextMarkdown: string) => {
    setMarkdown(nextMarkdown)
    setSaveState('idle')
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      void persist(nextMarkdown).catch(() => undefined)
    }, 700)
  }

  const completion = useMutation({
    mutationFn: async () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = null
      await persist(markdown)
      return lockPrd(project.id, markdown)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/I`)
    },
  })

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setFeedback('PRD COPIED')
    } catch {
      setFeedback('COPY FAILED — SELECT THE TEXT MANUALLY')
    }
  }

  const downloadMarkdown = () => {
    const file = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${project.topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'codesign'}-prd.md`
    anchor.click()
    URL.revokeObjectURL(url)
    setFeedback('PRD DOWNLOADED')
  }

  if (source.isError || draft.isError) {
    return <div className="route-loading" role="alert">PRD SOURCE COULD NOT BE LOADED.</div>
  }

  if (source.isLoading || draft.isLoading || !hydratedRef.current) {
    return <div className="route-loading" role="status">ASSEMBLING PRD…</div>
  }

  return (
    <JourneyLayout
      project={project}
      phase="PRD"
      phaseName="PRODUCT REQUIREMENTS"
      headline="MAKE EVERY DECISION VISIBLE."
      principle="PRD นี้ประกอบจากข้อมูลที่คุณตัดสินใจและล็อกไว้ ไม่มี AI เติม Product rule ที่ขาดหาย"
      hint="อ่านแบบผู้พัฒนา: ทุกหัวข้อบอกสิ่งที่ต้องสร้างได้หรือยัง? ถ้าข้อความใดเปลี่ยนพฤติกรรมของ Product ให้แก้ให้ชัดก่อน Lock"
      chatMove="ช่วย review PRD นี้เพื่อหาความคลุมเครือเท่านั้น อย่าเพิ่ม Feature หรือ Product rule ใหม่ และระบุจุดที่ต้องให้มนุษย์ตัดสินใจ"
      saveState={saveState}
    >
      <PhaseSection
        step="01"
        title="PRODUCT DEFINITION: SOLID"
        description="ตรวจว่าการตัดสินใจจาก C/O/D/E/S ถูกนำมาประกอบครบก่อนส่งต่อให้ Codex"
      >
        <div className="prd-checklist" aria-label="Product definition checklist">
          {[
            'CONTEXT',
            'OPTIONS EXPLORED',
            'ASSUMPTIONS CHALLENGED',
            'SCOPE LOCKED',
            'FLOW DEFINED',
            'CONTENT READY',
            'EXPERIENCE DEFINED',
            'ACCEPTANCE CRITERIA',
          ].map((item) => <span key={item}><Check size={16} aria-hidden="true" /> {item}</span>)}
        </div>
      </PhaseSection>

      <PhaseSection
        step="02"
        title="REVIEW & EDIT"
        description="แก้ข้อความได้โดยตรง ระบบจะ autosave เป็น PRD draft จนกว่าคุณจะ Lock"
      >
        <div className="prd-toolbar">
          <button type="button" onClick={() => void copyMarkdown()}><Clipboard size={17} /> COPY PRD</button>
          <button type="button" onClick={downloadMarkdown}><Download size={17} /> DOWNLOAD .MD</button>
          <button type="button" onClick={() => window.print()}><Printer size={17} /> PRINT / PDF</button>
          {feedback ? <span role="status">{feedback}</span> : null}
        </div>
        <textarea
          ref={editorRef}
          className="prd-editor"
          aria-label="Editable PRD Markdown"
          spellCheck="false"
          value={markdown}
          onChange={(event) => updateMarkdown(event.target.value)}
        />
        <pre className="prd-print-preview" aria-hidden="true">{markdown}</pre>
      </PhaseSection>

      <ReviewGate
        title="PRD GATE"
        question="มีอะไรใน Specification นี้ที่ AI เติมเข้ามาเอง โดยที่คุณไม่เคยตัดสินใจหรือไม่?"
        actions={(
          <>
            <ArcadeButton
              variant="secondary"
              onClick={() => {
                setFeedback('REVIEW THE DRAFT — REMOVE OR CLARIFY ANY INVENTED DECISION')
                editorRef.current?.focus()
              }}
            >
              YES — REVIEW
            </ArcadeButton>
            <ArcadeButton
              disabled={!markdown.trim() || completion.isPending || saveState === 'saving'}
              onClick={() => completion.mutate()}
            >
              <LockKeyhole size={18} /> {completion.isPending ? 'SOLIDIFYING…' : 'NO — READY'}
            </ArcadeButton>
          </>
        )}
      >
        <p>เมื่อกด NO — READY ระบบจะสร้าง locked snapshot และเลื่อนไปขั้น I — IMPLEMENT</p>
        {completion.isError ? <p className="field-error" role="alert">Lock PRD ไม่สำเร็จ ข้อมูลยังคงเป็น Draft</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
