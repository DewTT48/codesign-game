import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Clipboard, Download, Eye, FileCode2, FileUp, LockKeyhole, PencilLine, RotateCcw, Save } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
// V2 deliberately ignores confirmations created by the old "open means reviewed" behavior.
const reviewFieldKey = 'confirmedFilesV2'
const reviewOutcomeFieldKey = 'reviewOutcomeV2'
type ReviewOutcome = 'ready' | 'files' | 'revision'

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
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome | null>(null)
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
    const savedOutcome = draft.data.find((entry) => entry.fieldKey === reviewOutcomeFieldKey)?.content
    const initialOutcome: ReviewOutcome | null = savedOutcome === 'ready' || savedOutcome === 'files' || savedOutcome === 'revision' ? savedOutcome : null
    setFiles(initial)
    setReviewedFiles(initialReviewed)
    setReviewOutcome(initialOutcome)

    const missing = prdFiles.filter(({ key }) => !draft.data.some((entry) => entry.fieldKey === fileFieldKeys[key]))
    const missingReview = !draft.data.some((entry) => entry.fieldKey === reviewFieldKey)
    const missingOutcome = !draft.data.some((entry) => entry.fieldKey === reviewOutcomeFieldKey)
    if (missing.length || missingReview || missingOutcome) {
      setSaveState('saving')
      void Promise.all([
        ...missing.map(({ key }) => savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'document', fieldKey: fileFieldKeys[key], content: initial[key] })),
        ...(missingReview ? [savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'review', fieldKey: reviewFieldKey, content: initialReviewed })] : []),
        ...(missingOutcome ? [savePhaseEntry({ projectId: project.id, phase: 'PRD' as const, section: 'review', fieldKey: reviewOutcomeFieldKey, content: initialOutcome ?? '' })] : []),
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

  const chooseReviewOutcome = async (outcome: ReviewOutcome) => {
    setReviewOutcome(outcome)
    setSaveState('saving')
    try {
      await savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'review', fieldKey: reviewOutcomeFieldKey, content: outcome })
      setSaveState('saved')
    } catch {
      setReviewOutcome(null)
      setSaveState('error')
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

  const applyImportedPackage = (nextFiles: PrdDrafts) => {
    const reviewed: PrdFileKey[] = []
    setFiles(nextFiles)
    setReviewedFiles(reviewed)
    setScrolledFiles([])
    setDirtyFiles([])
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
  const reviewResolved = reviewOutcome === 'ready' || reviewOutcome === 'files'

  const completion = useMutation({
    mutationFn: async () => {
      if (!reviewResolved) throw new Error('PRD review outcome is unresolved')
      await Promise.all(prdFiles.map(({ key }) => persist(key, files[key])))
      await persistReviewed(reviewedFiles)
      await savePhaseEntry({ projectId: project.id, phase: 'PRD', section: 'review', fieldKey: reviewOutcomeFieldKey, content: reviewOutcome })
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

      <PhaseSection step="02" title={isThai ? 'ให้ Chat ตรวจ แล้วเลือกทางต่อที่ถูกต้อง' : 'LET CHAT REVIEW, THEN CHOOSE THE RIGHT PATH'} description={isThai ? 'Prompt มีการตัดสินใจที่ Lock แล้วและไฟล์ร่างทั้ง 3 ฉบับอยู่แล้ว Chat ต้องบอกว่าพร้อมยืนยัน ต้องแก้เฉพาะไฟล์ หรือต้องกลับไป Revision' : 'The prompt already contains the locked decisions and all three drafts. Chat must say whether they are ready, need file-only corrections, or require a revision.'}>
        <div className="prd-chat-flow" aria-label={isThai ? 'ขั้นตอนตรวจไฟล์กับ Chat' : 'Chat review steps'}>
          {(isThai ? ['คัดลอก Prompt ซึ่งรวมข้อมูลและไฟล์แล้ว', 'ให้ Chat เลือกสถานะจาก 3 แบบ', 'ตอบเฉพาะคำถามที่เปลี่ยน Product จริง', 'กลับมาเลือกสถานะเดียวกันใน CODESIGN'] : ['Copy the prompt with all inputs included', 'Have Chat choose one of three statuses', 'Answer only material product questions', 'Choose the same status in CODESIGN']).map((item, index) => <span key={item}><strong>{String(index + 1).padStart(2, '0')}</strong>{item}</span>)}
        </div>

        <div className="prd-review-outcomes" role="group" aria-label={isThai ? 'เลือกผลการตรวจจาก Chat' : 'Choose the Chat review result'}>
          <button type="button" className={reviewOutcome === 'ready' ? 'is-active is-ready' : ''} aria-pressed={reviewOutcome === 'ready'} onClick={() => void chooseReviewOutcome('ready')}>
            <Check size={22} /><span><strong>READY TO LOCK</strong><small>{isThai ? 'ไม่พบจุดที่เปลี่ยนการสร้าง ใช้ไฟล์เดิมต่อได้' : 'No build-changing issue; continue with the current files.'}</small></span>
          </button>
          <button type="button" className={reviewOutcome === 'files' ? 'is-active is-files' : ''} aria-pressed={reviewOutcome === 'files'} onClick={() => void chooseReviewOutcome('files')}>
            <FileUp size={22} /><span><strong>FILE UPDATE REQUIRED</strong><small>{isThai ? 'แก้ให้ตรงกับการตัดสินใจเดิม โดยไม่เปลี่ยน Product' : 'Align the files to existing decisions without changing the product.'}</small></span>
          </button>
          <button type="button" className={reviewOutcome === 'revision' ? 'is-active is-revision' : ''} aria-pressed={reviewOutcome === 'revision'} onClick={() => void chooseReviewOutcome('revision')}>
            <RotateCcw size={22} /><span><strong>REVISION REQUIRED</strong><small>{isThai ? 'ต้องเปลี่ยนการตัดสินใจใน Step E หรือ S ก่อน' : 'A decision in Step E or S must change first.'}</small></span>
          </button>
        </div>

        {!reviewOutcome ? <p className="prd-review-outcomes__hint">{isThai ? 'คุยกับ Chat ให้ได้ข้อสรุปก่อน แล้วเลือกหนึ่งสถานะด้านบน' : 'Finish the Chat review, then choose one status above.'}</p> : null}
        {reviewOutcome === 'ready' ? <div className="prd-review-route prd-review-route--ready">
          <Check size={24} /><div><strong>{isThai ? 'ใช้ไฟล์เดิมต่อได้' : 'KEEP THE CURRENT FILES'}</strong><p>{isThai ? 'ไม่ต้องดาวน์โหลดหรืออัปโหลดไฟล์ใหม่ ไปอ่าน Preview และยืนยันไฟล์เดิมทั้ง 3 ฉบับในขั้นถัดไป' : 'No download or upload is needed. Read and confirm all three current files in the next section.'}</p><a href="#prd-file-review">{isThai ? 'ไปตรวจไฟล์ทั้ง 3 ฉบับ' : 'REVIEW THE THREE FILES'} <ArrowRight size={16} /></a></div>
        </div> : null}
        {reviewOutcome === 'files' ? <PrdPackageImport current={files} onApply={applyImportedPackage} /> : null}
        {reviewOutcome === 'revision' ? <div className="prd-review-route prd-review-route--revision">
          <RotateCcw size={24} /><div><strong>{isThai ? 'กลับไปแก้ข้อมูลต้นทางก่อน' : 'REVISE THE SOURCE DECISION FIRST'}</strong><p>{isThai ? 'อย่าอัปโหลดไฟล์ที่ Chat เปลี่ยน Product decision ให้เลือก Step ที่เป็นเจ้าของข้อมูลนั้น ระบบจะเก็บฉบับเดิมและให้ตรวจ Step ถัดไปใหม่' : 'Do not upload files that silently change a product decision. Choose the step that owns that decision; CODESIGN preserves the prior version and reopens downstream review.'}</p>
            <div className="prd-revision-links">
              <Link to={`/projects/${project.id}/E`}><span><strong>{isThai ? 'Step E — ขอบเขต Product' : 'STEP E — PRODUCT SCOPE'}</strong><small>{isThai ? 'ผู้ใช้ Goal Direction Must Have และ Non-goal' : 'User, goal, direction, must-haves, and non-goals'}</small></span><ArrowRight size={17} /></Link>
              <Link to={`/projects/${project.id}/S`}><span><strong>{isThai ? 'Step S — รายละเอียด Product' : 'STEP S — PRODUCT SPECIFICATION'}</strong><small>{isThai ? 'Journey กติกา เนื้อหา แบบฝึก การบันทึก และ Theme' : 'Journey, rules, content, exercises, records, and theme'}</small></span><ArrowRight size={17} /></Link>
            </div>
          </div>
        </div> : null}
      </PhaseSection>

      <div id="prd-file-review">
      <PhaseSection step="03" title={isThai ? 'ตรวจและแก้ไขไฟล์หลัก 3 ฉบับ' : 'REVIEW THE THREE SOURCE FILES'} description={isThai ? 'เลือกไฟล์ อ่าน Preview จนถึงด้านล่าง แล้วกดยืนยันทีละไฟล์ หากแก้ไขต้องกดบันทึกก่อนตรวจฉบับล่าสุดอีกครั้ง' : 'Choose a file, read its preview to the end, then confirm it. Save any edits before reviewing the latest version again.'}>
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
        <ArcadeButton disabled={!reviewResolved || !allValid || !allReviewed || dirtyFiles.length > 0 || completion.isPending || saveState === 'saving'} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'พร้อม — Lock ทั้ง 3 ไฟล์' : 'READY — LOCK ALL THREE')}</ArcadeButton>
      </>}>
        <p>{isThai ? `ยืนยันแล้ว ${reviewedFiles.length}/3 ไฟล์ เมื่อ Lock ระบบจะเก็บทั้ง 3 ไฟล์เป็นชุด Version เดียวกัน จากนั้น Stage Implement จะสร้าง START_WITH_CODEX.md ตามความพร้อม GitHub ของคุณ` : `${reviewedFiles.length}/3 files confirmed. Locking stores all three as one version. Implement then creates START_WITH_CODEX.md from your GitHub readiness.`}</p>
        {!reviewResolved ? <p className="field-error" role="alert">{isThai ? 'ยัง Lock ไม่ได้ กรุณาบันทึกผลตรวจเป็น READY TO LOCK หรือ FILE UPDATE REQUIRED ก่อน' : 'LOCKING IS DISABLED UNTIL THE REVIEW RESULT IS READY TO LOCK OR FILE UPDATE REQUIRED.'}</p> : null}
        {!allValid ? <p className="field-error" role="alert">{isThai ? 'ยัง Lock ไม่ได้ เพราะมีไฟล์ที่โครงสร้างไม่ครบ' : 'LOCKING IS DISABLED UNTIL EVERY FILE PASSES STRUCTURE CHECKS.'}</p> : null}
        {dirtyFiles.length > 0 ? <p className="field-error" role="alert">{isThai ? 'ยัง Lock ไม่ได้ เพราะมีไฟล์ที่แก้ไขแล้วแต่ยังไม่ได้กดบันทึก' : 'LOCKING IS DISABLED WHILE A FILE HAS UNSAVED CHANGES.'}</p> : null}
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'Lock PRD ไม่สำเร็จ ข้อมูลยังคงเป็น Draft' : 'PRD LOCK FAILED. YOUR FILES REMAIN DRAFTS.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
