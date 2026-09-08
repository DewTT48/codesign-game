import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clipboard, Download, Eye, FileCode2, Github, LockKeyhole, PencilLine } from 'lucide-react'
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
import { MarkdownPreview } from './MarkdownPreview'

type HandoffFileKey = 'handoff' | 'contentPack' | 'experienceDirection' | 'startWithCodex'

type HandoffDrafts = Record<HandoffFileKey, string>

const fileFieldKeys: Record<HandoffFileKey, string> = {
  handoff: 'markdownDraft',
  contentPack: 'contentPackDraft',
  experienceDirection: 'experienceDirectionDraft',
  startWithCodex: 'startWithCodexDraft',
}

const emptyDrafts: HandoffDrafts = {
  handoff: '',
  contentPack: '',
  experienceDirection: '',
  startWithCodex: '',
}

export function PrdPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const timerRefs = useRef<Partial<Record<HandoffFileKey, number>>>({})
  const hydratedRef = useRef(false)
  const [files, setFiles] = useState<HandoffDrafts>(emptyDrafts)
  const [selectedFile, setSelectedFile] = useState<HandoffFileKey>('handoff')
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview')
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
    const specify = source.data.S ?? {}
    const generated: HandoffDrafts = {
      handoff: assemblePrd(project, source.data),
      contentPack: assembleContentPack(specify),
      experienceDirection: assembleExperienceDirection(specify),
      startWithCodex: assembleStartWithCodex(project),
    }
    const initial = (Object.keys(generated) as HandoffFileKey[]).reduce<HandoffDrafts>((result, key) => {
      const saved = draft.data.find((entry) => entry.fieldKey === fileFieldKeys[key])
      result[key] = typeof saved?.content === 'string' ? saved.content : generated[key]
      return result
    }, { ...emptyDrafts })
    setFiles(initial)

    const missing = (Object.keys(generated) as HandoffFileKey[]).filter((key) => (
      !draft.data.some((entry) => entry.fieldKey === fileFieldKeys[key])
    ))
    if (missing.length) {
      setSaveState('saving')
      void Promise.all(missing.map((key) => savePhaseEntry({
          projectId: project.id,
          phase: 'PRD',
          section: 'document',
          fieldKey: fileFieldKeys[key],
          content: initial[key],
        })))
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'))
    } else {
      setSaveState('saved')
    }
  }, [draft.data, project, source.data])

  useEffect(() => () => {
    Object.values(timerRefs.current).forEach((timer) => window.clearTimeout(timer))
  }, [])

  const persist = async (key: HandoffFileKey, content: string) => {
    setSaveState('saving')
    try {
      await savePhaseEntry({
        projectId: project.id,
        phase: 'PRD',
        section: 'document',
        fieldKey: fileFieldKeys[key],
        content,
      })
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      throw error
    }
  }

  const updateFile = (key: HandoffFileKey, content: string) => {
    setFiles((current) => ({ ...current, [key]: content }))
    setSaveState('idle')
    const timer = timerRefs.current[key]
    if (timer) window.clearTimeout(timer)
    timerRefs.current[key] = window.setTimeout(() => {
      delete timerRefs.current[key]
      void persist(key, content).catch(() => undefined)
    }, 700)
  }

  const completion = useMutation({
    mutationFn: async () => {
      Object.values(timerRefs.current).forEach((timer) => window.clearTimeout(timer))
      timerRefs.current = {}
      await Promise.all((Object.keys(files) as HandoffFileKey[]).map((key) => persist(key, files[key])))
      return lockPrd(project.id, files.handoff)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/I`)
    },
  })

  const copyFile = async (fileName: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setFeedback(isThai ? `คัดลอก ${fileName} แล้ว` : `${fileName} COPIED`)
    } catch {
      setFeedback(isThai ? 'คัดลอกไม่สำเร็จ — กรุณาเลือกและคัดลอกข้อความเอง' : 'COPY FAILED — SELECT THE TEXT MANUALLY')
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
    return <div className="route-loading" role="alert">{isThai ? 'โหลดข้อมูลสำหรับ PRD ไม่สำเร็จ' : 'PRD SOURCE COULD NOT BE LOADED.'}</div>
  }

  if (source.isLoading || draft.isLoading || !hydratedRef.current) {
    return <div className="route-loading" role="status">{isThai ? 'กำลังประกอบชุดส่งต่องาน…' : 'ASSEMBLING PRD…'}</div>
  }

  const fileOptions: Array<{ key: HandoffFileKey; fileName: string; description: string }> = [
    { key: 'handoff', fileName: 'CODESIGN_HANDOFF.md', description: isThai ? 'การตัดสินใจเกี่ยวกับ Product และขอบเขตงาน' : 'Product decisions and scope' },
    { key: 'contentPack', fileName: 'CONTENT_PACK.md', description: isThai ? 'เนื้อหา แบบฝึก และการบันทึกครบ 21 วัน' : 'All 21 days of content and exercises' },
    { key: 'experienceDirection', fileName: 'EXPERIENCE_DIRECTION.md', description: isThai ? 'Theme ที่เลือกและแนวทางกำกับการออกแบบ' : 'Selected theme and design guardrails' },
    { key: 'startWithCodex', fileName: 'START_WITH_CODEX.md', description: isThai ? 'คำสั่งเริ่มสร้างและคำแนะนำ GitHub' : 'Build brief and GitHub guidance' },
  ]
  const activeFile = fileOptions.find((file) => file.key === selectedFile) ?? fileOptions[0]
  const activeContent = files[selectedFile]
  const checklist = isThai ? [
    'เข้าใจบริบทแล้ว',
    'สำรวจทางเลือกแล้ว',
    'ท้าทายสมมติฐานแล้ว',
    'ยืนยันขอบเขตแล้ว',
    'กำหนดเส้นทางแล้ว',
    'เนื้อหาพร้อมแล้ว',
    'กำหนดประสบการณ์แล้ว',
    'มีเกณฑ์ตรวจรับแล้ว',
  ] : [
    'CONTEXT',
    'OPTIONS EXPLORED',
    'ASSUMPTIONS CHALLENGED',
    'SCOPE LOCKED',
    'FLOW DEFINED',
    'CONTENT READY',
    'EXPERIENCE DEFINED',
    'ACCEPTANCE CRITERIA',
  ]

  return (
    <JourneyLayout
      project={project}
      phase="PRD"
      phaseName="FINAL HANDOFF"
      chatContext={files}
      saveState={saveState}
    >
      <PhaseSection
        step="01"
        title={isThai ? 'ชุดไฟล์สำหรับสร้างแอป' : 'YOUR BUILD PACKAGE'}
        description={isThai ? 'CODESIGN ประกอบการตัดสินใจของคุณเป็นชุดไฟล์ที่ Codex ใช้สร้าง Product ได้ โดยไม่ต้องคัดลอกคำตอบทีละส่วน' : 'CODESIGN turns your decisions into a build package Codex can use without copying answers one by one.'}
      >
        <div className="prd-checklist" aria-label={isThai ? 'รายการตรวจความพร้อมของ Product' : 'Product definition checklist'}>
          {checklist.map((item) => <span key={item}><Check size={16} aria-hidden="true" /> {item}</span>)}
        </div>
      </PhaseSection>

      <PhaseSection step="02" title={isThai ? 'GitHub — บ้านของโครงการ' : 'GITHUB — THE PROJECT HOME'} description={isThai ? 'คุณยังไม่ต้องรู้วิธีเขียนโค้ดหรือใช้คำสั่ง Git และยังไม่จำเป็นต้องมีบัญชีในขั้นนี้' : 'You do not need to know code or Git commands, and an account is not required at this step.'}>
        <div className="github-orientation">
          <Github size={36} aria-hidden="true" />
          <div>
            <h3>{isThai ? 'GitHub เก็บไฟล์และประวัติของ App ส่วน GitHub Pages ทำให้ App เปิดผ่าน Public URL ได้' : 'GitHub stores the app files and history. GitHub Pages gives the app a public URL.'}</h3>
            <p>{isThai ? 'ขั้น Implement จะถามว่าคุณพร้อมระดับไหน แล้ว Codex จะอธิบาย พาเปิดบัญชี สร้าง Repository และ Publish ทีละขั้น คุณเป็นคนกรอก Password, OTP, CAPTCHA และยืนยันความปลอดภัยด้วยตัวเองเสมอ' : 'Implement will ask about your readiness. Codex can explain, guide account and repository setup, and publish step by step. You always enter passwords, OTPs, CAPTCHAs, and security confirmations yourself.'}</p>
          </div>
        </div>
      </PhaseSection>

      <PhaseSection step="03" title={isThai ? 'ตรวจและดาวน์โหลดชุดส่งต่องาน' : 'REVIEW AND DOWNLOAD THE HANDOFF'} description={isThai ? 'เปิดดูและแก้ไขไฟล์แต่ละฉบับให้สอดคล้องกัน จากนั้นดาวน์โหลดทั้ง 4 ไฟล์ไว้ใน Folder เดียวกันเพื่อส่งให้ Codex' : 'Preview and edit each file for consistency, then download all four into one folder for Codex.'}>
        <div className="handoff-file-grid" aria-label={isThai ? 'เลือกไฟล์เพื่อตรวจสอบ' : 'Choose a file to review'}>
          {fileOptions.map((file) => (
            <button
              type="button"
              className={selectedFile === file.key ? 'is-active' : ''}
              aria-pressed={selectedFile === file.key}
              key={file.key}
              onClick={() => {
                setSelectedFile(file.key)
                setViewMode('preview')
              }}
            >
              <FileCode2 size={21} />
              <span><strong>{file.fileName}</strong><small>{file.description}</small></span>
              <Eye size={18} />
            </button>
          ))}
        </div>
        <section className="prd-file-workspace" aria-labelledby="active-handoff-file">
          <header>
            <div>
              <span>{isThai ? 'ไฟล์ที่กำลังตรวจ' : 'REVIEWING FILE'}</span>
              <h3 id="active-handoff-file">{activeFile.fileName}</h3>
              <p>{isThai ? 'Preview เพื่ออ่านภาพรวม หรือเลือกแก้ไขเมื่อต้องปรับการตัดสินใจ ข้อความจะบันทึกอัตโนมัติ' : 'Preview the file or edit decisions that need correction. Changes autosave.'}</p>
            </div>
            <div className="prd-view-switch" role="group" aria-label={isThai ? 'เลือกโหมดดูไฟล์' : 'File view mode'}>
              <button type="button" className={viewMode === 'preview' ? 'is-active' : ''} aria-pressed={viewMode === 'preview'} onClick={() => setViewMode('preview')}><Eye size={17} /> {isThai ? 'ดูตัวอย่าง' : 'PREVIEW'}</button>
              <button type="button" className={viewMode === 'edit' ? 'is-active' : ''} aria-pressed={viewMode === 'edit'} onClick={() => setViewMode('edit')}><PencilLine size={17} /> {isThai ? 'แก้ไข' : 'EDIT'}</button>
            </div>
          </header>
          {viewMode === 'preview'
            ? <MarkdownPreview markdown={activeContent} />
            : <textarea ref={editorRef} className="prd-editor" aria-label={`${isThai ? 'แก้ไข' : 'Edit'} ${activeFile.fileName}`} spellCheck="false" value={activeContent} onChange={(event) => updateFile(selectedFile, event.target.value)} />}
        </section>
        <div className="prd-toolbar">
          <button type="button" onClick={() => void copyFile(activeFile.fileName, activeContent)}><Clipboard size={17} /> {isThai ? 'คัดลอกไฟล์นี้' : 'COPY THIS FILE'}</button>
          <button type="button" onClick={() => downloadFile(activeFile.fileName, activeContent, isThai ? `ดาวน์โหลด ${activeFile.fileName} แล้ว` : `${activeFile.fileName} DOWNLOADED`)}><Download size={17} /> {isThai ? 'ดาวน์โหลดไฟล์นี้' : 'DOWNLOAD THIS FILE'}</button>
          {feedback ? <span role="status">{feedback}</span> : null}
        </div>
      </PhaseSection>

      <ReviewGate
        title={isThai ? 'ตรวจความพร้อมของชุดส่งต่องาน' : 'FINAL HANDOFF GATE'}
        question={isThai ? 'ชุดส่งต่องานนี้สะท้อนสิ่งที่คุณตัดสินใจ และพร้อมให้ Codex เริ่มสร้างแล้วหรือยัง?' : 'Does this handoff reflect your decisions and give Codex what it needs to begin?'}
        actions={(
          <>
            <ArcadeButton
              variant="secondary"
              onClick={() => {
                setFeedback(isThai ? 'ตรวจร่างอีกครั้ง — ลบหรืออธิบายการตัดสินใจที่ไม่ได้มาจากคุณให้ชัด' : 'REVIEW THE DRAFT — REMOVE OR CLARIFY ANY INVENTED DECISION')
                setSelectedFile('handoff')
                setViewMode('edit')
                window.requestAnimationFrame(() => editorRef.current?.focus())
              }}
            >
              {isThai ? 'ยัง — ตรวจอีกครั้ง' : 'NOT YET — REVIEW'}
            </ArcadeButton>
            <ArcadeButton
              disabled={Object.values(files).some((content) => !content.trim()) || completion.isPending || saveState === 'saving'}
              onClick={() => completion.mutate()}
            >
              <LockKeyhole size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'SOLIDIFYING…') : (isThai ? 'พร้อม — ยืนยันชุดส่งต่องาน' : 'READY — LOCK HANDOFF')}
            </ArcadeButton>
          </>
        )}
      >
        <p>{isThai ? 'ก่อนยืนยัน ควรเปิดตรวจทั้ง 4 ไฟล์ เพราะไฟล์เหล่านี้ทำหน้าที่ต่างกันแต่ต้องสอดคล้องกัน เมื่อ Lock ระบบจะบันทึกฉบับล่าสุดและพาไปเตรียมทำงานกับ Codex และ GitHub' : 'Review all four files before locking. They serve different purposes but must agree. Locking saves the latest drafts and moves to Codex and GitHub preparation.'}</p>
        {completion.isError ? <p className="field-error" role="alert">Lock PRD ไม่สำเร็จ ข้อมูลยังคงเป็น Draft</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
