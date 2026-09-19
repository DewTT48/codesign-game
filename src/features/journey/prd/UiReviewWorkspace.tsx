import { AlertTriangle, Check, Clipboard, Download, ExternalLink, FileUp, RotateCcw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import { MarkdownPreview } from './MarkdownPreview'
import {
  OWN_FINAL_PRD_FILE_NAME,
  UI_REVIEW_FILE_NAME,
  assemblePrototypePrompt,
  validateOwnFinalPrd,
  validateUiReviewDocument,
  type UiReviewRoute,
} from './uiReview'

type UiReviewWorkspaceProps = {
  mode: 'guided' | 'own'
  projectId: string
  uiBrief: string
  storedReview?: string
  storedFinalPrd?: string
  applied: boolean
  disabled?: boolean
  onApply: (input: { review: string; finalPrd?: string }) => Promise<void>
  onRevision?: (input: { review: string; route: Exclude<UiReviewRoute, 'approved'> }) => Promise<void>
}

function downloadMarkdown(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function UiReviewWorkspace({
  mode,
  projectId,
  uiBrief,
  storedReview = '',
  storedFinalPrd = '',
  applied,
  disabled = false,
  onApply,
  onRevision,
}: UiReviewWorkspaceProps) {
  const { language, isThai } = useLanguage()
  const reviewInputRef = useRef<HTMLInputElement>(null)
  const finalPrdInputRef = useRef<HTMLInputElement>(null)
  const [review, setReview] = useState(storedReview)
  const [finalPrd, setFinalPrd] = useState(storedFinalPrd)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [applyState, setApplyState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const prompt = assemblePrototypePrompt(uiBrief, mode, language)
  const reviewCheck = validateUiReviewDocument(review)
  const finalPrdCheck = validateOwnFinalPrd(finalPrd)
  const hasChanges = review !== storedReview || (mode === 'own' && finalPrd !== storedFinalPrd)
  const canApply = reviewCheck.valid
    && reviewCheck.route === 'approved'
    && (mode === 'guided' || finalPrdCheck.valid)
    && (!applied || hasChanges)
    && !disabled
    && applyState !== 'saving'

  useEffect(() => setReview(storedReview), [storedReview])
  useEffect(() => setFinalPrd(storedFinalPrd), [storedFinalPrd])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    window.setTimeout(() => setCopyState('idle'), 1800)
  }

  async function readFile(file: File | undefined, expectedName: string, update: (content: string) => void) {
    if (!file) return
    if (file.name !== expectedName) {
      setApplyState('failed')
      return
    }
    update(await file.text())
    setApplyState('idle')
  }

  async function apply() {
    if (!canApply) return
    setApplyState('saving')
    try {
      await onApply({ review, finalPrd: mode === 'own' ? finalPrd : undefined })
      setApplyState('saved')
    } catch {
      setApplyState('failed')
    }
  }

  async function saveRevision() {
    const route = reviewCheck.route
    if (!reviewCheck.valid || !route || route === 'approved' || !onRevision) return
    setApplyState('saving')
    try {
      await onRevision({ review, route })
      setApplyState('saved')
    } catch {
      setApplyState('failed')
    }
  }

  return <div className={`ui-review-workspace ui-review-workspace--${mode}`}>
    <ol className="ui-review-steps" aria-label={isThai ? 'ขั้นตอน Prototype และ UI Review' : 'Prototype and UI Review steps'}>
      <li className="is-complete"><span>1</span><div><strong>{isThai ? 'CODESIGN เตรียม UI Brief' : 'CODESIGN PREPARES THE UI BRIEF'}</strong><small>{isThai ? 'ใช้ Decision ที่ยืนยันแล้วและตัวอย่าง Content เพียงส่วนที่จำเป็น' : 'Uses locked decisions and only the representative content needed for UI review.'}</small></div></li>
      <li className={reviewCheck.valid ? 'is-complete' : 'is-active'}><span>2</span><div><strong>{isThai ? 'ทำ Prototype และปรับใน Chat' : 'PROTOTYPE AND ITERATE IN CHAT'}</strong><small>{isThai ? 'ดูหน้าตาจริง ลอง Flow และปรับจนพอใจก่อนสั่ง Finalize' : 'Inspect visible screens and flow, then iterate before finalizing.'}</small></div></li>
      <li className={applied ? 'is-complete' : review ? 'is-active' : ''}><span>3</span><div><strong>{isThai ? 'นำ UI Review กลับมาสร้าง Final PRD' : 'BRING THE UI REVIEW BACK'}</strong><small>{mode === 'guided' ? (isThai ? 'CODESIGN ผสาน Review โดยไม่แก้ Content Pack' : 'CODESIGN applies the review without changing the Content Pack.') : (isThai ? 'นำ UI Review และ Final PRD ที่ Chat ช่วยปรับกลับมาตรวจ' : 'Bring back both the UI Review and the Chat-assisted final PRD.')}</small></div></li>
    </ol>

    <section className="ui-review-brief">
      <div>
        <span>CODESIGN UI BRIEF</span>
        <h3>{isThai ? 'พร้อมนำไปทำ Prototype — ไม่ต้องอ่านไฟล์ร่าง 3 ฉบับก่อน' : 'READY FOR PROTOTYPING — NO FIRST-PASS FILE REVIEW'}</h3>
        <p>{isThai ? 'Brief นี้ตัด Content 21 วันฉบับเต็มออก แต่รักษาโครง Content, Product rules, ขอบเขต และ Experience Direction ที่จำเป็นต่อการออกแบบ' : 'The brief omits the complete content set while preserving its shape, product rules, scope, and experience direction.'}</p>
      </div>
      <div className="ui-review-actions">
        <button type="button" disabled={disabled} onClick={() => void copyPrompt()}><Clipboard size={18} /> {copyState === 'copied' ? (isThai ? 'คัดลอก Prompt แล้ว' : 'PROMPT COPIED') : copyState === 'failed' ? (isThai ? 'คัดลอกไม่สำเร็จ' : 'COPY FAILED') : (isThai ? 'คัดลอก Prototype Prompt' : 'COPY PROTOTYPE PROMPT')}</button>
        <a className={disabled ? 'is-disabled' : undefined} aria-disabled={disabled} href="https://chatgpt.com/" target="_blank" rel="noreferrer" onClick={(event) => { if (disabled) event.preventDefault() }}><Sparkles size={18} /> {isThai ? 'เปิด ChatGPT' : 'OPEN CHATGPT'} <ExternalLink size={15} /></a>
        <button type="button" disabled={disabled} onClick={() => downloadMarkdown('CODESIGN_UI_BRIEF.md', uiBrief)}><Download size={18} /> {isThai ? 'ดาวน์โหลด UI Brief' : 'DOWNLOAD UI BRIEF'}</button>
      </div>
      <details>
        <summary>{isThai ? 'ดูข้อมูลที่ส่งไปกับ Prompt' : 'PREVIEW THE PROMPT INPUT'}</summary>
        <MarkdownPreview markdown={uiBrief} />
      </details>
    </section>

    <section className="ui-review-import">
      <header>
        <div><span>{isThai ? 'ผลลัพธ์หลัง FINALIZE UI REVIEW' : 'RESULT AFTER FINALIZE UI REVIEW'}</span><h3>{isThai ? 'นำไฟล์ Markdown กลับเข้า CODESIGN' : 'BRING THE MARKDOWN FILES BACK'}</h3><p>{isThai ? 'ระบบตรวจโครงสร้าง สถานะ คำถามที่ยังเปิด และคำยืนยันของเจ้าของก่อนสร้าง Final PRD' : 'CODESIGN validates structure, review status, open questions, and explicit owner approval before creating the final PRD.'}</p></div>
        {applied ? <span className="ui-review-applied"><Check size={18} /> {isThai ? 'นำ Review ไปใช้แล้ว' : 'REVIEW APPLIED'}</span> : null}
      </header>

      <div className="ui-review-import__files">
        <article className={reviewCheck.valid ? 'is-valid' : review ? 'is-error' : ''}>
          <div><strong>{UI_REVIEW_FILE_NAME}</strong><small>{reviewCheck.valid ? (isThai ? 'โครงสร้างถูกต้อง' : 'VALID STRUCTURE') : (isThai ? 'จำเป็น' : 'REQUIRED')}</small></div>
          <button type="button" disabled={disabled} onClick={() => reviewInputRef.current?.click()}><FileUp size={17} /> {isThai ? 'เลือกไฟล์' : 'CHOOSE FILE'}</button>
          <input ref={reviewInputRef} hidden type="file" accept=".md,text/markdown,text/plain" onChange={(event) => void readFile(event.target.files?.[0], UI_REVIEW_FILE_NAME, setReview)} />
        </article>
        {mode === 'own' ? <article className={finalPrdCheck.valid ? 'is-valid' : finalPrd ? 'is-error' : ''}>
          <div><strong>{OWN_FINAL_PRD_FILE_NAME}</strong><small>{finalPrdCheck.valid ? (isThai ? 'โครงสร้างหลักครบ' : 'CORE STRUCTURE READY') : (isThai ? 'จำเป็นสำหรับ Build Your Own' : 'REQUIRED FOR BUILD YOUR OWN')}</small></div>
          <button type="button" disabled={disabled} onClick={() => finalPrdInputRef.current?.click()}><FileUp size={17} /> {isThai ? 'เลือกไฟล์' : 'CHOOSE FILE'}</button>
          <input ref={finalPrdInputRef} hidden type="file" accept=".md,text/markdown,text/plain" onChange={(event) => void readFile(event.target.files?.[0], OWN_FINAL_PRD_FILE_NAME, setFinalPrd)} />
        </article> : null}
      </div>

      <details className="ui-review-paste">
        <summary>{isThai ? 'ถ้าดาวน์โหลดไฟล์ไม่ได้ ให้วาง Markdown ที่นี่' : 'PASTE MARKDOWN HERE IF DOWNLOAD IS UNAVAILABLE'}</summary>
        <label><span>{UI_REVIEW_FILE_NAME}</span><textarea disabled={disabled} value={review} onChange={(event) => { setReview(event.target.value); setApplyState('idle') }} /></label>
        {mode === 'own' ? <label><span>{OWN_FINAL_PRD_FILE_NAME}</span><textarea disabled={disabled} value={finalPrd} onChange={(event) => { setFinalPrd(event.target.value); setApplyState('idle') }} /></label> : null}
      </details>

      {review && !reviewCheck.valid ? <div className="ui-review-errors" role="alert"><AlertTriangle size={20} /><div><strong>{isThai ? 'UI Review ยังใช้ไม่ได้' : 'UI REVIEW IS NOT READY'}</strong>{reviewCheck.errors.map((error) => <p key={error}>{error}</p>)}</div></div> : null}
      {mode === 'own' && finalPrd && !finalPrdCheck.valid ? <div className="ui-review-errors" role="alert"><AlertTriangle size={20} /><div><strong>{isThai ? 'Final PRD ยังมีโครงสร้างไม่ครบ' : 'FINAL PRD IS INCOMPLETE'}</strong>{finalPrdCheck.errors.map((error) => <p key={error}>{error}</p>)}</div></div> : null}

      {reviewCheck.valid && reviewCheck.route !== 'approved' ? <div className="ui-review-revision">
        <RotateCcw size={22} /><div><strong>{reviewCheck.route === 'revision-e' ? 'REVISION REQUIRED — STEP E' : 'REVISION REQUIRED — STEP S'}</strong><p>{isThai ? 'Prototype พบการเปลี่ยน Product Decision จึงยังห้ามสร้าง Final PRD บันทึกผลนี้ก่อน แล้วกลับไปแก้ Step ที่เป็นเจ้าของการตัดสินใจ' : 'The prototype exposed a changed Product Decision. Save this result and revise the owning step before creating the final PRD.'}</p><div><button type="button" disabled={disabled || applyState === 'saving'} onClick={() => void saveRevision()}>{mode === 'own' ? (isThai ? 'บันทึกและเริ่ม Revision' : 'SAVE AND START REVISION') : (isThai ? 'บันทึกผล Review' : 'SAVE REVIEW RESULT')}</button>{mode === 'guided' ? <Link to={`/projects/${projectId}/${reviewCheck.route === 'revision-e' ? 'E' : 'S'}`}>{isThai ? 'ไปดู Step ที่ต้องแก้' : 'OPEN THE OWNING STEP'}</Link> : null}</div></div>
      </div> : null}

      {reviewCheck.valid && reviewCheck.route === 'approved' ? <div className="ui-review-preview"><div><Check size={19} /><strong>APPROVED FOR FINAL PRD</strong></div><MarkdownPreview markdown={review} /></div> : null}

      <footer>
        <p>{mode === 'guided' ? (isThai ? 'ระบบจะเพิ่ม Screen map, Navigation และ UI direction ที่อนุมัติแล้วในไฟล์ที่เกี่ยวข้อง ส่วน CONTENT_PACK.md จะคงเดิมทุกตัวอักษร' : 'Approved screen, navigation, and UI direction details are added to the relevant files. CONTENT_PACK.md remains byte-for-byte unchanged.') : (isThai ? 'ระบบจะเก็บ UI Review คู่กับ Final PRD เพื่อให้ตรวจย้อนกลับได้ แล้วให้คุณอ่าน Final PRD รอบเดียวก่อน Lock' : 'CODESIGN stores the UI Review with the final PRD for traceability, then asks you to review that final PRD once before locking.')}</p>
        <button type="button" disabled={!canApply} onClick={() => void apply()}><Check size={18} /> {applyState === 'saving' ? (isThai ? 'กำลังสร้าง Final PRD…' : 'CREATING FINAL PRD…') : applied ? (isThai ? 'สร้าง Final PRD แล้ว' : 'FINAL PRD CREATED') : (isThai ? 'ใช้ UI Review สร้าง Final PRD' : 'CREATE FINAL PRD FROM UI REVIEW')}</button>
        {applyState === 'failed' ? <span role="alert">{isThai ? 'ทำรายการไม่สำเร็จ ตรวจชื่อไฟล์และลองอีกครั้ง' : 'ACTION FAILED. CHECK THE FILENAMES AND TRY AGAIN.'}</span> : null}
      </footer>
    </section>
  </div>
}
