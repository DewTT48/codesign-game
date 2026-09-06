import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clipboard, Download, FileCode2, Github, LockKeyhole, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
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
import {
  assembleContentPack,
  assembleExperienceDirection,
  assembleStartWithCodex,
} from './handoffFiles'

export function PrdPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
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

  const downloadFile = (fileName: string, content: string, message: string) => {
    const file = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
    setFeedback(message)
  }

  if (source.isError || draft.isError) {
    return <div className="route-loading" role="alert">PRD SOURCE COULD NOT BE LOADED.</div>
  }

  if (source.isLoading || draft.isLoading || !hydratedRef.current) {
    return <div className="route-loading" role="status">ASSEMBLING PRD…</div>
  }

  const specify = source.data?.S ?? {}
  const contentPack = assembleContentPack(specify)
  const experienceDirection = assembleExperienceDirection(specify)
  const startWithCodex = assembleStartWithCodex(project)

  return (
    <JourneyLayout
      project={project}
      phase="PRD"
      phaseName="FINAL HANDOFF"
      chatContext={{ markdown }}
      saveState={saveState}
    >
      <PhaseSection
        step="01"
        title="YOUR BUILD PACKAGE"
        description={isThai ? 'CODESIGN ประกอบการตัดสินใจของคุณเป็นชุดไฟล์ที่ Codex ใช้สร้าง Product ได้ โดยไม่ต้องคัดลอกคำตอบทีละส่วน' : 'CODESIGN turns your decisions into a build package Codex can use without copying answers one by one.'}
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

      <PhaseSection step="02" title="GITHUB — THE PROJECT HOME" description={isThai ? 'คุณยังไม่ต้องรู้วิธีเขียนโค้ดหรือใช้คำสั่ง Git และยังไม่จำเป็นต้องมีบัญชีในขั้นนี้' : 'You do not need to know code or Git commands, and an account is not required at this step.'}>
        <div className="github-orientation">
          <Github size={36} aria-hidden="true" />
          <div>
            <h3>{isThai ? 'GitHub เก็บไฟล์และประวัติของ App ส่วน GitHub Pages ทำให้ App เปิดผ่าน Public URL ได้' : 'GitHub stores the app files and history. GitHub Pages gives the app a public URL.'}</h3>
            <p>{isThai ? 'ขั้น Implement จะถามว่าคุณพร้อมระดับไหน แล้ว Codex จะอธิบาย พาเปิดบัญชี สร้าง Repository และ Publish ทีละขั้น คุณเป็นคนกรอก Password, OTP, CAPTCHA และยืนยันความปลอดภัยด้วยตัวเองเสมอ' : 'Implement will ask about your readiness. Codex can explain, guide account and repository setup, and publish step by step. You always enter passwords, OTPs, CAPTCHAs, and security confirmations yourself.'}</p>
          </div>
        </div>
      </PhaseSection>

      <PhaseSection step="03" title="DOWNLOAD THE HANDOFF" description={isThai ? 'ดาวน์โหลดทั้ง 4 ไฟล์ไว้ใน Folder เดียวกัน แล้วส่งให้ Codex ในขั้นถัดไป' : 'Download all four files into one folder, then give them to Codex in the next step.'}>
        <div className="handoff-file-grid">
          <button type="button" onClick={() => downloadFile('CODESIGN_HANDOFF.md', markdown, 'HANDOFF DOWNLOADED')}><FileCode2 size={21} /><span><strong>CODESIGN_HANDOFF.md</strong><small>{isThai ? 'Product decisions และขอบเขตงาน' : 'Product decisions and scope'}</small></span><Download size={18} /></button>
          <button type="button" onClick={() => downloadFile('CONTENT_PACK.md', contentPack, 'CONTENT PACK DOWNLOADED')}><FileCode2 size={21} /><span><strong>CONTENT_PACK.md</strong><small>{isThai ? 'เนื้อหา แบบฝึก และการบันทึกครบ 21 วัน' : 'All 21 days of content and exercises'}</small></span><Download size={18} /></button>
          <button type="button" onClick={() => downloadFile('EXPERIENCE_DIRECTION.md', experienceDirection, 'EXPERIENCE DOWNLOADED')}><FileCode2 size={21} /><span><strong>EXPERIENCE_DIRECTION.md</strong><small>{isThai ? 'Theme ที่เลือกและ Design guardrails' : 'Selected theme and design guardrails'}</small></span><Download size={18} /></button>
          <button type="button" onClick={() => downloadFile('START_WITH_CODEX.md', startWithCodex, 'CODEX GUIDE DOWNLOADED')}><FileCode2 size={21} /><span><strong>START_WITH_CODEX.md</strong><small>{isThai ? 'คำสั่งเริ่มสร้างและคำแนะนำ GitHub' : 'Build brief and GitHub guidance'}</small></span><Download size={18} /></button>
        </div>
        <div className="prd-toolbar">
          <button type="button" onClick={() => void copyMarkdown()}><Clipboard size={17} /> COPY HANDOFF</button>
          <button type="button" onClick={() => window.print()}><Printer size={17} /> PRINT / PDF</button>
          {feedback ? <span role="status">{feedback}</span> : null}
        </div>
        <details className="prd-source-editor">
          <summary>{isThai ? 'ADVANCED — ตรวจหรือแก้ CODESIGN_HANDOFF.md' : 'ADVANCED — REVIEW OR EDIT CODESIGN_HANDOFF.md'}</summary>
          <p>{isThai ? 'แก้เฉพาะเมื่อ Product decision ในเอกสารไม่ตรงกับสิ่งที่คุณตั้งใจ ระบบจะ Autosave จนกว่าจะ Lock' : 'Edit only when a product decision does not match your intent. Changes autosave until locked.'}</p>
          <textarea ref={editorRef} className="prd-editor" aria-label="Editable CODESIGN handoff Markdown" spellCheck="false" value={markdown} onChange={(event) => updateMarkdown(event.target.value)} />
        </details>
        <pre className="prd-print-preview" aria-hidden="true">{markdown}</pre>
      </PhaseSection>

      <ReviewGate
        title="FINAL HANDOFF GATE"
        question={isThai ? 'ชุดส่งต่องานนี้สะท้อนสิ่งที่คุณตัดสินใจ และพร้อมให้ Codex เริ่มสร้างแล้วหรือยัง?' : 'Does this handoff reflect your decisions and give Codex what it needs to begin?'}
        actions={(
          <>
            <ArcadeButton
              variant="secondary"
              onClick={() => {
                setFeedback('REVIEW THE DRAFT — REMOVE OR CLARIFY ANY INVENTED DECISION')
                editorRef.current?.focus()
              }}
            >
              {isThai ? 'ยัง — ตรวจอีกครั้ง' : 'NOT YET — REVIEW'}
            </ArcadeButton>
            <ArcadeButton
              disabled={!markdown.trim() || completion.isPending || saveState === 'saving'}
              onClick={() => completion.mutate()}
            >
              <LockKeyhole size={18} /> {completion.isPending ? 'SOLIDIFYING…' : (isThai ? 'พร้อม — LOCK HANDOFF' : 'READY — LOCK HANDOFF')}
            </ArcadeButton>
          </>
        )}
      >
        <p>{isThai ? 'เมื่อ Lock ระบบจะเก็บ Snapshot ของ CODESIGN_HANDOFF.md และพาไปเตรียมทำงานกับ Codex และ GitHub' : 'Locking saves a snapshot of CODESIGN_HANDOFF.md and moves to Codex and GitHub preparation.'}</p>
        {completion.isError ? <p className="field-error" role="alert">Lock PRD ไม่สำเร็จ ข้อมูลยังคงเป็น Draft</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
