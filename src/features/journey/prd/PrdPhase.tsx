import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clipboard, Download, Eye, FileCode2, LockKeyhole, PencilLine } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { getPhaseEntries, getPrdSource, lockPrd, savePhaseEntry } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { PhaseSection, ReviewGate } from '../PhaseFormComponents'
import type { SaveState } from '../usePhaseDraft'
import { assemblePrd } from './assemblePrd'
import { assembleContentPack, assembleExperienceDirection } from './handoffFiles'
import { MarkdownPreview } from './MarkdownPreview'
import { PrdPackageImport } from './PrdPackageImport'
import { prdFiles, type PrdDrafts, type PrdFileKey, validatePrdDocument } from './prdPackage'

const fileFieldKeys: Record<PrdFileKey, string> = {
  handoff: 'markdownDraft',
  contentPack: 'contentPackDraft',
  experienceDirection: 'experienceDirectionDraft',
}

const emptyDrafts: PrdDrafts = { handoff: '', contentPack: '', experienceDirection: '' }
const reviewFieldKey = 'reviewedFiles'

export function PrdPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const timerRefs = useRef<Partial<Record<PrdFileKey, number>>>({})
  const hydratedRef = useRef(false)
  const [files, setFiles] = useState<PrdDrafts>(emptyDrafts)
  const [selectedFile, setSelectedFile] = useState<PrdFileKey>('handoff')
  const [reviewedFiles, setReviewedFiles] = useState<PrdFileKey[]>([])
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [feedback, setFeedback] = useState('')

  const source = useQuery({ queryKey: ['prd-source', project.id], queryFn: () => getPrdSource(project.id) })
  const draft = useQuery({ queryKey: ['phase-entries', project.id, 'PRD'], queryFn: () => getPhaseEntries(project.id, 'PRD') })

  useEffect(() => {
    if (hydratedRef.current || !source.data || !draft.data) return
    hydratedRef.current = true
    const specify = source.data.S ?? {}
    const generated: PrdDrafts = {
      handoff: assemblePrd(project, source.data),
      contentPack: assembleContentPack(specify),
      experienceDirection: assembleExperienceDirection(specify),
    }
    const initial = prdFiles.reduce<PrdDrafts>((result, file) => {
      const saved = draft.data.find((entry) => entry.fieldKey === fileFieldKeys[file.key])
      result[file.key] = typeof saved?.content === 'string' ? saved.content : generated[file.key]
      return result
    }, { ...emptyDrafts })
    const savedReviewed = draft.data.find((entry) => entry.fieldKey === reviewFieldKey)?.content
    const initialReviewed: PrdFileKey[] = Array.isArray(savedReviewed)
      ? savedReviewed.filter((value): value is PrdFileKey => prdFiles.some((file) => file.key === value))
      : ['handoff']
    setFiles(initial)
    setReviewedFiles(initialReviewed)

    const missing = prdFiles.filter(({ key }) => !draft.data.some((entry) => entry.fieldKey === fileFieldKeys[key]))
    const missingReview = !draft.data.some((entry) => entry.fieldKey === reviewFieldKey)
    if (missing.length || missingReview) {
      setSaveState('saving')
      void Promise.all([
        ...missing.map(({ key }) => savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'document', fieldKey: fileFieldKeys[key], content: initial[key] })),
        ...(missingReview ? [savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'review', fieldKey: reviewFieldKey, content: initialReviewed })] : []),
      ]).then(() => setSaveState('saved')).catch(() => setSaveState('error'))
    } else setSaveState('saved')
  }, [draft.data, project, source.data])

  useEffect(() => () => {
    Object.values(timerRefs.current).forEach((timer) => window.clearTimeout(timer))
  }, [])

  const persist = async (key: PrdFileKey, content: string) => {
    setSaveState('saving')
    try {
      await savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'document', fieldKey: fileFieldKeys[key], content })
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      throw error
    }
  }

  const persistReviewed = async (keys: PrdFileKey[]) => {
    setSaveState('saving')
    try {
      await savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'review', fieldKey: reviewFieldKey, content: keys })
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      throw error
    }
  }

  const updateFile = (key: PrdFileKey, content: string) => {
    setFiles((current) => ({ ...current, [key]: content }))
    setSaveState('idle')
    const timer = timerRefs.current[key]
    if (timer) window.clearTimeout(timer)
    timerRefs.current[key] = window.setTimeout(() => {
      delete timerRefs.current[key]
      void persist(key, content).catch(() => undefined)
    }, 700)
  }

  const reviewFile = (key: PrdFileKey, mode: 'preview' | 'edit' = 'preview') => {
    setSelectedFile(key)
    setViewMode(mode)
    if (reviewedFiles.includes(key)) return
    const next = [...reviewedFiles, key]
    setReviewedFiles(next)
    void persistReviewed(next).catch(() => undefined)
  }

  const applyImportedPackage = (nextFiles: PrdDrafts) => {
    Object.values(timerRefs.current).forEach((timer) => window.clearTimeout(timer))
    timerRefs.current = {}
    const reviewed = prdFiles.map(({ key }) => key)
    setFiles(nextFiles)
    setReviewedFiles(reviewed)
    setSelectedFile('handoff')
    setViewMode('preview')
    setSaveState('saving')
    void Promise.all([
      ...prdFiles.map(({ key }) => savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'document', fieldKey: fileFieldKeys[key], content: nextFiles[key] })),
      savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'review', fieldKey: reviewFieldKey, content: reviewed }),
    ]).then(() => {
      setSaveState('saved')
      setFeedback(isThai ? 'นำเข้าทั้ง 3 ไฟล์แล้ว กรุณาเปิดตรวจฉบับสุดท้ายก่อนยืนยัน' : 'ALL THREE FILES IMPORTED. REVIEW THE FINAL VERSIONS BEFORE LOCKING.')
    }).catch(() => setSaveState('error'))
  }

  const documentChecks = Object.fromEntries(prdFiles.map(({ key }) => [key, validatePrdDocument(key, files[key])])) as Record<PrdFileKey, ReturnType<typeof validatePrdDocument>>
  const allValid = prdFiles.every(({ key }) => documentChecks[key].valid)
  const allReviewed = prdFiles.every(({ key }) => reviewedFiles.includes(key))

  const completion = useMutation({
    mutationFn: async () => {
      Object.values(timerRefs.current).forEach((timer) => window.clearTimeout(timer))
      timerRefs.current = {}
      await Promise.all(prdFiles.map(({ key }) => persist(key, files[key])))
      await persistReviewed(reviewedFiles)
      return lockPrd(project.id, files)
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

  const downloadFile = (fileName: string, content: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
    setFeedback(isThai ? `ดาวน์โหลด ${fileName} แล้ว` : `${fileName} DOWNLOADED`)
  }

  if (source.isError || draft.isError) return <div className="route-loading" role="alert">{isThai ? 'โหลดข้อมูลสำหรับ PRD ไม่สำเร็จ' : 'PRD SOURCE COULD NOT BE LOADED.'}</div>
  if (source.isLoading || draft.isLoading || !hydratedRef.current) return <div className="route-loading" role="status">{isThai ? 'กำลังประกอบชุดส่งต่องาน…' : 'ASSEMBLING PRD…'}</div>

  const descriptions: Record<PrdFileKey, string> = {
    handoff: isThai ? 'การตัดสินใจเกี่ยวกับ Product และขอบเขตงาน' : 'Product decisions and scope',
    contentPack: isThai ? 'เนื้อหา แบบฝึก และการบันทึกครบ 21 วัน' : 'All 21 days of content and exercises',
    experienceDirection: isThai ? 'Theme ที่เลือกและแนวทางกำกับการออกแบบ' : 'Selected theme and design guardrails',
  }
  const activeFile = prdFiles.find((file) => file.key === selectedFile) ?? prdFiles[0]
  const activeContent = files[selectedFile]
  const checklist = isThai
    ? ['เข้าใจบริบทแล้ว', 'สำรวจทางเลือกแล้ว', 'ท้าทายสมมติฐานแล้ว', 'ยืนยันขอบเขตแล้ว', 'กำหนดเส้นทางแล้ว', 'เนื้อหาพร้อมแล้ว', 'กำหนดประสบการณ์แล้ว', 'มีเกณฑ์ตรวจรับแล้ว']
    : ['CONTEXT', 'OPTIONS EXPLORED', 'ASSUMPTIONS CHALLENGED', 'SCOPE LOCKED', 'FLOW DEFINED', 'CONTENT READY', 'EXPERIENCE DEFINED', 'ACCEPTANCE CRITERIA']

  return (
    <JourneyLayout project={project} phase="PRD" phaseName="FINAL HANDOFF" chatContext={files} saveState={saveState}>
      <PhaseSection step="01" title={isThai ? 'ไฟล์หลักที่ต้องตรวจให้ตรงกัน' : 'THE THREE SOURCE FILES'} description={isThai ? 'CODESIGN ประกอบการตัดสินใจจากขั้นก่อนหน้าเป็น 3 ไฟล์หลัก ก่อนส่งให้ Codex ต้องตรวจว่าเนื้อหา Product เนื้อหา 21 วัน และประสบการณ์สอดคล้องกัน' : 'CODESIGN assembles earlier decisions into three source files. Review product, content, and experience for consistency before sending them to Codex.'}>
        <div className="prd-checklist" aria-label={isThai ? 'รายการตรวจความพร้อมของ Product' : 'Product definition checklist'}>{checklist.map((item) => <span key={item}><Check size={16} aria-hidden="true" /> {item}</span>)}</div>
      </PhaseSection>

      <PhaseSection step="02" title={isThai ? 'ตรวจร่วมกับ Chat แล้วนำไฟล์กลับมา' : 'REVIEW WITH CHAT, THEN BRING THE FILES BACK'} description={isThai ? 'ใช้ชุดคำสั่งของขั้นนี้คุยกับ AI ภายนอกให้จบ ยืนยัน Exact edits แล้วให้ AI สร้างไฟล์ฉบับเต็มตามชื่อเดิมทั้ง 3 ไฟล์' : 'Finish the external AI review, approve the exact edits, then ask it to return all three complete files with the exact filenames.'}>
        <div className="prd-chat-flow" aria-label={isThai ? 'ขั้นตอนตรวจไฟล์กับ Chat' : 'Chat review steps'}>
          {(isThai ? ['คัดลอกชุดคำสั่งไปคุยกับ Chat', 'ตอบคำถามทีละข้อและยืนยันสิ่งที่แก้', 'สั่ง UPDATE HANDOFF FILES เพื่อรับไฟล์เต็ม 3 ไฟล์', 'อัปโหลดพร้อมกันเพื่อตรวจ Preview ก่อนแทนที่'] : ['Copy the prompt into Chat', 'Answer one question at a time and approve edits', 'Say UPDATE HANDOFF FILES to receive three full files', 'Upload them together and preview before replacing']).map((item, index) => <span key={item}><strong>{String(index + 1).padStart(2, '0')}</strong>{item}</span>)}
        </div>
        <PrdPackageImport current={files} onApply={applyImportedPackage} />
      </PhaseSection>

      <PhaseSection step="03" title={isThai ? 'ตรวจและแก้ไขไฟล์หลัก 3 ฉบับ' : 'REVIEW THE THREE SOURCE FILES'} description={isThai ? 'เปิดตรวจทุกไฟล์อย่างน้อยหนึ่งครั้ง คุณยังแก้ไขเองได้ และทุกการเปลี่ยนแปลงจะบันทึกอัตโนมัติ' : 'Open every file at least once. You can still edit manually, and changes autosave.'}>
        <div className="handoff-file-grid" aria-label={isThai ? 'เลือกไฟล์เพื่อตรวจสอบ' : 'Choose a file to review'}>
          {prdFiles.map((file) => <button type="button" className={selectedFile === file.key ? 'is-active' : ''} aria-pressed={selectedFile === file.key} key={file.key} onClick={() => reviewFile(file.key)}>
            <FileCode2 size={21} />
            <span><strong>{file.fileName}</strong><small>{descriptions[file.key]}</small><small className={documentChecks[file.key].valid ? 'file-status is-valid' : 'file-status is-error'}>{documentChecks[file.key].valid ? (reviewedFiles.includes(file.key) ? (isThai ? 'ตรวจแล้ว' : 'REVIEWED') : (isThai ? 'รอตรวจ' : 'NOT REVIEWED')) : (isThai ? 'โครงสร้างไม่ครบ' : 'STRUCTURE ERROR')}</small></span>
            <Eye size={18} />
          </button>)}
        </div>
        <section className="prd-file-workspace" aria-labelledby="active-handoff-file">
          <header>
            <div><span>{isThai ? 'ไฟล์ที่กำลังตรวจ' : 'REVIEWING FILE'}</span><h3 id="active-handoff-file">{activeFile.fileName}</h3><p>{isThai ? 'ใช้ Preview อ่านภาพรวม หรือเลือกแก้ไขเมื่อต้องปรับการตัดสินใจ ข้อความจะบันทึกอัตโนมัติ' : 'Preview the file or edit decisions that need correction. Changes autosave.'}</p></div>
            <div className="prd-view-switch" role="group" aria-label={isThai ? 'เลือกโหมดดูไฟล์' : 'File view mode'}>
              <button type="button" className={viewMode === 'preview' ? 'is-active' : ''} aria-pressed={viewMode === 'preview'} onClick={() => reviewFile(selectedFile, 'preview')}><Eye size={17} /> {isThai ? 'ดูตัวอย่าง' : 'PREVIEW'}</button>
              <button type="button" className={viewMode === 'edit' ? 'is-active' : ''} aria-pressed={viewMode === 'edit'} onClick={() => reviewFile(selectedFile, 'edit')}><PencilLine size={17} /> {isThai ? 'แก้ไข' : 'EDIT'}</button>
            </div>
          </header>
          {documentChecks[selectedFile].errors.length ? <div className="prd-structure-errors" role="alert">{documentChecks[selectedFile].errors.map((error) => <span key={error}>{error}</span>)}</div> : null}
          {viewMode === 'preview' ? <MarkdownPreview markdown={activeContent} /> : <textarea ref={editorRef} className="prd-editor" aria-label={`${isThai ? 'แก้ไข' : 'Edit'} ${activeFile.fileName}`} spellCheck="false" value={activeContent} onChange={(event) => updateFile(selectedFile, event.target.value)} />}
        </section>
        <div className="prd-toolbar">
          <button type="button" onClick={() => void copyFile(activeFile.fileName, activeContent)}><Clipboard size={17} /> {isThai ? 'คัดลอกไฟล์นี้' : 'COPY THIS FILE'}</button>
          <button type="button" onClick={() => downloadFile(activeFile.fileName, activeContent)}><Download size={17} /> {isThai ? 'ดาวน์โหลดไฟล์นี้' : 'DOWNLOAD THIS FILE'}</button>
          {feedback ? <span role="status">{feedback}</span> : null}
        </div>
      </PhaseSection>

      <ReviewGate title={isThai ? 'ยืนยันชุดส่งต่องานฉบับหลัก' : 'LOCK THE SOURCE PACKAGE'} question={isThai ? 'ไฟล์หลักทั้ง 3 ฉบับสะท้อนสิ่งที่คุณตัดสินใจ ตรงกัน และพร้อมนำไปประกอบชุดสำหรับ Codex แล้วหรือยัง?' : 'Do all three source files reflect your decisions, agree with each other, and feel ready for the Codex package?'} actions={<>
        <ArcadeButton variant="secondary" onClick={() => { setFeedback(isThai ? 'เปิดตรวจไฟล์ที่ยังไม่ยืนยัน หรือแก้ข้อความที่ไม่ตรงกับการตัดสินใจของคุณ' : 'REVIEW UNCONFIRMED FILES OR CORRECT TEXT THAT DOES NOT MATCH YOUR DECISIONS'); const first = prdFiles.find(({ key }) => !reviewedFiles.includes(key) || !documentChecks[key].valid); reviewFile(first?.key ?? 'handoff') }}>{isThai ? 'ยัง — ตรวจอีกครั้ง' : 'NOT YET — REVIEW'}</ArcadeButton>
        <ArcadeButton disabled={!allValid || !allReviewed || completion.isPending || saveState === 'saving'} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'พร้อม — Lock ทั้ง 3 ไฟล์' : 'READY — LOCK ALL THREE')}</ArcadeButton>
      </>}>
        <p>{isThai ? `ตรวจแล้ว ${reviewedFiles.length}/3 ไฟล์ เมื่อ Lock ระบบจะเก็บทั้ง 3 ไฟล์เป็นชุด Version เดียวกัน จากนั้น Stage Implement จะสร้าง START_WITH_CODEX.md ตามความพร้อม GitHub ของคุณ` : `${reviewedFiles.length}/3 files reviewed. Locking stores all three as one version. Implement then creates START_WITH_CODEX.md from your GitHub readiness.`}</p>
        {!allValid ? <p className="field-error" role="alert">{isThai ? 'ยัง Lock ไม่ได้ เพราะมีไฟล์ที่โครงสร้างไม่ครบ' : 'LOCKING IS DISABLED UNTIL EVERY FILE PASSES STRUCTURE CHECKS.'}</p> : null}
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'Lock PRD ไม่สำเร็จ ข้อมูลยังคงเป็น Draft' : 'PRD LOCK FAILED. YOUR FILES REMAIN DRAFTS.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
