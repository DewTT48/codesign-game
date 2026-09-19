import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clipboard, Download, Eye, FileCode2, LockKeyhole, PencilLine, Save } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { prdFiles, type PrdDrafts, type PrdFileKey, validatePrdDocument } from './prdPackage'
import { UiReviewWorkspace } from './UiReviewWorkspace'
import { applyGuidedUiReview, assembleGuidedUiBrief } from './uiReview'

const fileFieldKeys: Record<PrdFileKey, string> = {
  handoff: 'markdownDraft',
  contentPack: 'contentPackDraft',
  experienceDirection: 'experienceDirectionDraft',
}

const emptyDrafts: PrdDrafts = { handoff: '', contentPack: '', experienceDirection: '' }
// V2 deliberately ignores confirmations created by the old "open means reviewed" behavior.
const reviewFieldKey = 'confirmedFilesV2'
const uiBriefFieldKey = 'uiBriefDraft'
const uiReviewFieldKey = 'uiReviewDraft'
const uiReviewAppliedFieldKey = 'uiReviewApplied'

export function PrdPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLElement>(null)
  const hydratedRef = useRef(false)
  const [files, setFiles] = useState<PrdDrafts>(emptyDrafts)
  const [selectedFile, setSelectedFile] = useState<PrdFileKey>('handoff')
  const [reviewedFiles, setReviewedFiles] = useState<PrdFileKey[]>([])
  const [scrolledFiles, setScrolledFiles] = useState<PrdFileKey[]>([])
  const [dirtyFiles, setDirtyFiles] = useState<PrdFileKey[]>([])
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview')
  const [uiBrief, setUiBrief] = useState('')
  const [uiReview, setUiReview] = useState('')
  const [uiReviewApplied, setUiReviewApplied] = useState(false)
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
      : []
    const savedBrief = draft.data.find((entry) => entry.fieldKey === uiBriefFieldKey)?.content
    const initialBrief = typeof savedBrief === 'string' && savedBrief.trim()
      ? savedBrief
      : assembleGuidedUiBrief(project, source.data, initial)
    const savedUiReview = draft.data.find((entry) => entry.fieldKey === uiReviewFieldKey)?.content
    const initialUiReview = typeof savedUiReview === 'string' ? savedUiReview : ''
    const initialUiReviewApplied = draft.data.find((entry) => entry.fieldKey === uiReviewAppliedFieldKey)?.content === true
    setFiles(initial)
    setReviewedFiles(initialReviewed)
    setUiBrief(initialBrief)
    setUiReview(initialUiReview)
    setUiReviewApplied(initialUiReviewApplied)

    const missing = prdFiles.filter(({ key }) => !draft.data.some((entry) => entry.fieldKey === fileFieldKeys[key]))
    const missingReview = !draft.data.some((entry) => entry.fieldKey === reviewFieldKey)
    const missingBrief = !draft.data.some((entry) => entry.fieldKey === uiBriefFieldKey)
    const missingUiReview = !draft.data.some((entry) => entry.fieldKey === uiReviewFieldKey)
    const missingUiReviewApplied = !draft.data.some((entry) => entry.fieldKey === uiReviewAppliedFieldKey)
    if (missing.length || missingReview || missingBrief || missingUiReview || missingUiReviewApplied) {
      setSaveState('saving')
      void Promise.all([
        ...missing.map(({ key }) => savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'document', fieldKey: fileFieldKeys[key], content: initial[key] })),
        ...(missingReview ? [savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'review', fieldKey: reviewFieldKey, content: initialReviewed })] : []),
        ...(missingBrief ? [savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'ui_review', fieldKey: uiBriefFieldKey, content: initialBrief })] : []),
        ...(missingUiReview ? [savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'ui_review', fieldKey: uiReviewFieldKey, content: initialUiReview })] : []),
        ...(missingUiReviewApplied ? [savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'ui_review', fieldKey: uiReviewAppliedFieldKey, content: initialUiReviewApplied })] : []),
      ]).then(() => setSaveState('saved')).catch(() => setSaveState('error'))
    } else setSaveState('saved')
  }, [draft.data, project, source.data])

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
    setDirtyFiles((current) => current.includes(key) ? current : [...current, key])
    setScrolledFiles((current) => current.filter((value) => value !== key))
    if (reviewedFiles.includes(key)) {
      const next = reviewedFiles.filter((value) => value !== key)
      setReviewedFiles(next)
      void persistReviewed(next).catch(() => undefined)
    }
  }

  const openFile = (key: PrdFileKey, mode: 'preview' | 'edit' = 'preview') => {
    setSelectedFile(key)
    setViewMode(mode)
    setFeedback('')
  }

  const saveFile = async (key: PrdFileKey) => {
    try {
      await persist(key, files[key])
      setDirtyFiles((current) => current.filter((value) => value !== key))
      setFeedback(isThai ? `บันทึก ${prdFiles.find((file) => file.key === key)?.fileName} แล้ว กรุณาดูตัวอย่างและอ่านถึงท้ายไฟล์ก่อนยืนยัน` : 'FILE SAVED. PREVIEW AND READ TO THE END BEFORE CONFIRMING.')
      setViewMode('preview')
    } catch {
      setFeedback(isThai ? 'บันทึกไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง' : 'FILE COULD NOT BE SAVED. TRY AGAIN.')
    }
  }

  const confirmFile = async () => {
    const key = selectedFile
    if (reviewedFiles.includes(key) || dirtyFiles.includes(key) || !scrolledFiles.includes(key) || !validatePrdDocument(key, files[key]).valid) return
    const next = [...reviewedFiles, key]
    setReviewedFiles(next)
    try {
      await persistReviewed(next)
      setFeedback(isThai ? `ยืนยัน ${prdFiles.find((file) => file.key === key)?.fileName} แล้ว` : 'FILE CONFIRMED')
    } catch {
      setReviewedFiles((current) => current.filter((value) => value !== key))
      setFeedback(isThai ? 'ยืนยันไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง' : 'FILE COULD NOT BE CONFIRMED. TRY AGAIN.')
    }
  }

  const markFileRead = (key: PrdFileKey) => {
    setScrolledFiles((current) => current.includes(key) ? current : [...current, key])
  }

  const handlePreviewScroll = (key: PrdFileKey, element: HTMLElement) => {
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 8) markFileRead(key)
  }

  useLayoutEffect(() => {
    if (viewMode !== 'preview') return
    const element = previewRef.current
    if (!element) return
    element.scrollTop = 0
    if (element.scrollHeight <= element.clientHeight + 2) markFileRead(selectedFile)
  }, [selectedFile, viewMode, files])

  const applyUiReview = async (review: string) => {
    const nextFiles = applyGuidedUiReview(files, review)
    const reviewed: PrdFileKey[] = []
    setFiles(nextFiles)
    setReviewedFiles(reviewed)
    setScrolledFiles([])
    setDirtyFiles([])
    setSelectedFile('handoff')
    setViewMode('preview')
    setSaveState('saving')
    try {
      await Promise.all([
        ...prdFiles.map(({ key }) => savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'document', fieldKey: fileFieldKeys[key], content: nextFiles[key] })),
        savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'review', fieldKey: reviewFieldKey, content: reviewed }),
        savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'ui_review', fieldKey: uiBriefFieldKey, content: uiBrief }),
        savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'ui_review', fieldKey: uiReviewFieldKey, content: review }),
        savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'ui_review', fieldKey: uiReviewAppliedFieldKey, content: true }),
      ])
      setUiReview(review)
      setUiReviewApplied(true)
      setSaveState('saved')
      setFeedback(isThai ? 'สร้าง Final PRD แล้ว กรุณาเปิดอ่านและยืนยันไฟล์ฉบับสุดท้ายเพียงรอบนี้' : 'FINAL PRD CREATED. REVIEW AND CONFIRM THIS FINAL PACKAGE ONCE.')
    } catch (error) {
      setSaveState('error')
      throw error
    }
  }

  const saveRevisionReview = async (review: string) => {
    setSaveState('saving')
    try {
      await Promise.all([
        savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'ui_review', fieldKey: uiReviewFieldKey, content: review }),
        savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'ui_review', fieldKey: uiReviewAppliedFieldKey, content: false }),
      ])
      setUiReview(review)
      setUiReviewApplied(false)
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      throw error
    }
  }

  const documentChecks = Object.fromEntries(prdFiles.map(({ key }) => [key, validatePrdDocument(key, files[key])])) as Record<PrdFileKey, ReturnType<typeof validatePrdDocument>>
  const allValid = prdFiles.every(({ key }) => documentChecks[key].valid)
  const allReviewed = prdFiles.every(({ key }) => reviewedFiles.includes(key))

  const completion = useMutation({
    mutationFn: async () => {
      if (!uiReviewApplied) throw new Error('The approved UI Review has not been applied.')
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
    <JourneyLayout project={project} phase="PRD" phaseName="PRODUCT REQUIREMENTS" chatContext={{ ...files, uiBrief }} saveState={saveState}>
      <PhaseSection step="01" title={isThai ? 'CODESIGN เตรียมข้อมูลสำหรับ Prototype แล้ว' : 'CODESIGN PREPARED THE PROTOTYPE INPUT'} description={isThai ? 'ระบบประกอบไฟล์ร่างจาก Decision ที่ยืนยันไว้ C–S ให้ภายใน และสร้าง UI Brief ที่สั้นกว่าสำหรับ Prototype คุณยังไม่ต้องอ่านไฟล์ร่างทั้ง 3 ฉบับในตอนนี้' : 'CODESIGN assembled internal drafts from the locked C–S decisions and created a shorter UI Brief for prototyping. You do not need to review the three draft files yet.'}>
        <div className="prd-checklist" aria-label={isThai ? 'รายการตรวจความพร้อมของ Product' : 'Product definition checklist'}>{checklist.map((item) => <span key={item}><Check size={16} aria-hidden="true" /> {item}</span>)}</div>
        <p className="prd-checklist-note">{isThai ? 'รอบแรกนี้ใช้ข้อมูลเพื่อให้เห็นหน้าตาและ UX/UI ก่อน หลังจบ UI Review ระบบจึงจะสร้าง Final PRD ให้คุณอ่านและยืนยันเพียงรอบเดียว' : 'This first pass is for seeing the likely UI/UX. After UI Review, CODESIGN creates the final PRD for one owner review.'}</p>
      </PhaseSection>

      <PhaseSection step="02" title={isThai ? 'ดู Prototype และปรับจนได้ UI/UX ที่ต้องการ' : 'PROTOTYPE AND REFINE THE UI/UX'} description={isThai ? 'คัดลอก Prompt ไปใช้ใน ChatGPT หรือ Chat ที่รองรับการสร้างภาพ/หน้าเว็บ ทดลองปรับจนพอใจ แล้วสั่ง FINALIZE UI REVIEW เพื่อนำผลกลับมา CODESIGN' : 'Use the prepared prompt in ChatGPT or another Chat that can create visual artifacts. Iterate until satisfied, then request FINALIZE UI REVIEW and bring the result back.'}>
        <UiReviewWorkspace
          mode="guided"
          projectId={project.id}
          uiBrief={uiBrief}
          storedReview={uiReview}
          applied={uiReviewApplied}
          onApply={async ({ review }) => applyUiReview(review)}
          onRevision={async ({ review }) => saveRevisionReview(review)}
        />
      </PhaseSection>

      <div id="prd-file-review">
      <PhaseSection step="03" title={isThai ? 'ตรวจ Final PRD เพียงรอบเดียว' : 'REVIEW THE FINAL PRD ONCE'} description={isThai ? 'หลังนำ UI Review ไปใช้แล้ว เปิดอ่านไฟล์ฉบับสุดท้ายแต่ละฉบับจนจบและยืนยัน CONTENT_PACK.md จะยังเป็นเนื้อหาที่คุณเคยตรวจไว้โดยไม่มีการแก้ไขจาก Prototype' : 'After applying UI Review, read each final file to the end and confirm it. CONTENT_PACK.md remains the content you already approved and is not rewritten by prototyping.'}>
        <div className="handoff-file-grid" aria-label={isThai ? 'เลือกไฟล์เพื่อตรวจสอบ' : 'Choose a file to review'}>
          {prdFiles.map((file) => <button type="button" className={selectedFile === file.key ? 'is-active' : ''} aria-pressed={selectedFile === file.key} key={file.key} onClick={() => openFile(file.key)}>
            <FileCode2 size={21} />
            <span><strong>{file.fileName}</strong><small>{descriptions[file.key]}</small><small className={documentChecks[file.key].valid ? (reviewedFiles.includes(file.key) ? 'file-status is-valid' : 'file-status') : 'file-status is-error'}>{documentChecks[file.key].valid ? (reviewedFiles.includes(file.key) ? (isThai ? 'ยืนยันแล้ว' : 'CONFIRMED') : dirtyFiles.includes(file.key) ? (isThai ? 'มีการแก้ไขที่ยังไม่บันทึก' : 'UNSAVED CHANGES') : (isThai ? 'รอตรวจและยืนยัน' : 'REVIEW REQUIRED')) : (isThai ? 'โครงสร้างไม่ครบ' : 'STRUCTURE ERROR')}</small></span>
            <Eye size={18} />
          </button>)}
        </div>
        <section className="prd-file-workspace" aria-labelledby="active-handoff-file">
          <header>
            <div><span>{isThai ? 'ไฟล์ที่กำลังตรวจ' : 'REVIEWING FILE'}</span><h3 id="active-handoff-file">{activeFile.fileName}</h3><p>{isThai ? 'อ่าน Preview ให้ถึงด้านล่างก่อนยืนยัน หากเลือกแก้ไข กรุณากด “บันทึกไฟล์” เพื่อเก็บการเปลี่ยนแปลง' : 'Read the preview to the end before confirming. In edit mode, choose Save file to keep your changes.'}</p></div>
            <div className="prd-view-switch" role="group" aria-label={isThai ? 'เลือกโหมดดูไฟล์' : 'File view mode'}>
              <button type="button" className={viewMode === 'preview' ? 'is-active' : ''} aria-pressed={viewMode === 'preview'} onClick={() => openFile(selectedFile, 'preview')}><Eye size={17} /> {isThai ? 'ดูตัวอย่าง' : 'PREVIEW'}</button>
              <button type="button" className={viewMode === 'edit' ? 'is-active' : ''} aria-pressed={viewMode === 'edit'} onClick={() => openFile(selectedFile, 'edit')}><PencilLine size={17} /> {isThai ? 'แก้ไข' : 'EDIT'}</button>
              {viewMode === 'edit' ? <button type="button" className="is-save" disabled={!dirtyFiles.includes(selectedFile) || saveState === 'saving'} onClick={() => void saveFile(selectedFile)}><Save size={18} /> {saveState === 'saving' ? (isThai ? 'กำลังบันทึก…' : 'SAVING…') : (isThai ? 'บันทึกไฟล์' : 'SAVE FILE')}</button> : null}
            </div>
          </header>
          {documentChecks[selectedFile].errors.length ? <div className="prd-structure-errors" role="alert">{documentChecks[selectedFile].errors.map((error) => <span key={error}>{error}</span>)}</div> : null}
          {viewMode === 'preview' ? <>
            <MarkdownPreview ref={previewRef} markdown={activeContent} onScroll={(event) => handlePreviewScroll(selectedFile, event.currentTarget)} />
            <div className="prd-file-confirmation">
              <p>{reviewedFiles.includes(selectedFile) ? (isThai ? 'ไฟล์นี้ได้รับการยืนยันแล้ว' : 'THIS FILE IS CONFIRMED') : scrolledFiles.includes(selectedFile) ? (isThai ? 'อ่านถึงท้ายไฟล์แล้ว กรุณากดยืนยันเมื่อเนื้อหาถูกต้อง' : 'YOU REACHED THE END. CONFIRM WHEN THE CONTENT IS CORRECT.') : (isThai ? 'เลื่อนอ่าน Preview ไปจนถึงท้ายไฟล์เพื่อเปิดปุ่มยืนยัน' : 'SCROLL TO THE END OF THE PREVIEW TO ENABLE CONFIRMATION.')}</p>
              <button type="button" disabled={reviewedFiles.includes(selectedFile) || !scrolledFiles.includes(selectedFile) || dirtyFiles.includes(selectedFile) || !documentChecks[selectedFile].valid || saveState === 'saving'} onClick={() => void confirmFile()}><Check size={18} /> {reviewedFiles.includes(selectedFile) ? (isThai ? 'ยืนยันไฟล์นี้แล้ว' : 'FILE CONFIRMED') : (isThai ? 'ยืนยันไฟล์นี้' : 'CONFIRM THIS FILE')}</button>
            </div>
          </> : <textarea ref={editorRef} className="prd-editor" aria-label={`${isThai ? 'แก้ไข' : 'Edit'} ${activeFile.fileName}`} spellCheck="false" value={activeContent} onChange={(event) => updateFile(selectedFile, event.target.value)} />}
        </section>
        <div className="prd-toolbar">
          <button type="button" onClick={() => void copyFile(activeFile.fileName, activeContent)}><Clipboard size={17} /> {isThai ? 'คัดลอกไฟล์นี้' : 'COPY THIS FILE'}</button>
          <button type="button" onClick={() => downloadFile(activeFile.fileName, activeContent)}><Download size={17} /> {isThai ? 'ดาวน์โหลดไฟล์นี้' : 'DOWNLOAD THIS FILE'}</button>
          {feedback ? <span role="status">{feedback}</span> : null}
        </div>
      </PhaseSection>
      </div>

      <ReviewGate title={isThai ? 'ยืนยันชุดส่งต่องานฉบับหลัก' : 'LOCK THE SOURCE PACKAGE'} question={isThai ? 'ไฟล์หลักทั้ง 3 ฉบับสะท้อนสิ่งที่คุณตัดสินใจ ตรงกัน และพร้อมนำไปประกอบชุดสำหรับ Codex แล้วหรือยัง?' : 'Do all three source files reflect your decisions, agree with each other, and feel ready for the Codex package?'} actions={<>
        <ArcadeButton variant="secondary" onClick={() => { setFeedback(isThai ? 'เปิดไฟล์ที่ยังไม่ยืนยัน อ่านถึงด้านล่าง หรือแก้ข้อความที่ไม่ตรงกับการตัดสินใจของคุณ' : 'OPEN AN UNCONFIRMED FILE, READ TO THE END, OR CORRECT IT.'); const first = prdFiles.find(({ key }) => !reviewedFiles.includes(key) || !documentChecks[key].valid); openFile(first?.key ?? 'handoff') }}>{isThai ? 'ยัง — ตรวจอีกครั้ง' : 'NOT YET — REVIEW'}</ArcadeButton>
        <ArcadeButton disabled={!uiReviewApplied || !allValid || !allReviewed || dirtyFiles.length > 0 || completion.isPending || saveState === 'saving'} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'พร้อม — Lock ทั้ง 3 ไฟล์' : 'READY — LOCK ALL THREE')}</ArcadeButton>
      </>}>
        <p>{isThai ? `ยืนยันแล้ว ${reviewedFiles.length}/3 ไฟล์ เมื่อ Lock ระบบจะเก็บทั้ง 3 ไฟล์เป็นชุด Version เดียวกัน จากนั้น Stage Implement จะสร้าง START_WITH_CODEX.md ตามความพร้อม GitHub ของคุณ` : `${reviewedFiles.length}/3 files confirmed. Locking stores all three as one version. Implement then creates START_WITH_CODEX.md from your GitHub readiness.`}</p>
        {!uiReviewApplied ? <p className="field-error" role="alert">{isThai ? 'ยัง Lock ไม่ได้ กรุณาทำ Prototype ให้จบและนำ CODESIGN_UI_REVIEW.md กลับมาใช้สร้าง Final PRD ก่อน' : 'LOCKING IS DISABLED UNTIL CODESIGN_UI_REVIEW.md HAS BEEN APPLIED TO THE FINAL PRD.'}</p> : null}
        {!allValid ? <p className="field-error" role="alert">{isThai ? 'ยัง Lock ไม่ได้ เพราะมีไฟล์ที่โครงสร้างไม่ครบ' : 'LOCKING IS DISABLED UNTIL EVERY FILE PASSES STRUCTURE CHECKS.'}</p> : null}
        {dirtyFiles.length > 0 ? <p className="field-error" role="alert">{isThai ? 'ยัง Lock ไม่ได้ เพราะมีไฟล์ที่แก้ไขแล้วแต่ยังไม่ได้กดบันทึก' : 'LOCKING IS DISABLED WHILE A FILE HAS UNSAVED CHANGES.'}</p> : null}
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'Lock PRD ไม่สำเร็จ ข้อมูลยังคงเป็น Draft' : 'PRD LOCK FAILED. YOUR FILES REMAIN DRAFTS.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
