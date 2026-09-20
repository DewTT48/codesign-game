import { AlertTriangle, Check, Clipboard, Download, ExternalLink, FileUp, RotateCcw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { MarkdownPreview } from './MarkdownPreview'
import {
  APPROVED_PROTOTYPE_FILE_NAME,
  approvedPrototypeBlob,
  createApprovedPrototypeArtifact,
  validateApprovedPrototype,
  type ApprovedPrototypeArtifact,
} from './approvedPrototype'
import {
  OWN_FINAL_PRD_FILE_NAME,
  UI_REVIEW_FILE_NAME,
  assemblePrototypePrompt,
  assembleUiReviewResolution,
  getUiReviewForwardPlan,
  getUiReviewResolutionAnswers,
  validateOwnFinalPrd,
  validateUiReviewDocument,
  validateUiReviewResolution,
} from './uiReview'

type UiReviewWorkspaceProps = {
  mode: 'guided' | 'own'
  uiBrief: string
  storedReview?: string
  storedFinalPrd?: string
  storedResolution?: string
  storedPrototype?: ApprovedPrototypeArtifact | null
  applied: boolean
  disabled?: boolean
  onApply: (input: { review: string; finalPrd?: string; resolution?: string; prototype: ApprovedPrototypeArtifact }) => Promise<void>
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
  uiBrief,
  storedReview = '',
  storedFinalPrd = '',
  storedResolution = '',
  storedPrototype = null,
  applied,
  disabled = false,
  onApply,
}: UiReviewWorkspaceProps) {
  const { language, isThai } = useLanguage()
  const reviewInputRef = useRef<HTMLInputElement>(null)
  const finalPrdInputRef = useRef<HTMLInputElement>(null)
  const prototypeInputRef = useRef<HTMLInputElement>(null)
  const [review, setReview] = useState(storedReview)
  const [finalPrd, setFinalPrd] = useState(storedFinalPrd)
  const [prototype, setPrototype] = useState<ApprovedPrototypeArtifact | null>(storedPrototype)
  const [prototypeError, setPrototypeError] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [applyState, setApplyState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [forwardConfirmed, setForwardConfirmed] = useState(false)
  const prompt = assemblePrototypePrompt(uiBrief, mode, language)
  const reviewCheck = validateUiReviewDocument(review)
  const finalPrdCheck = validateOwnFinalPrd(finalPrd)
  const prototypeCheck = validateApprovedPrototype(review, prototype)
  const forwardPlan = getUiReviewForwardPlan(review)
  const ownerAnswersReady = forwardPlan.ownerQuestions.every((item) => Boolean(answers[item.id]?.trim()))
  const resolution = reviewCheck.route === 'confirmation-needed'
    ? assembleUiReviewResolution(review, answers, language)
    : ''
  const hasChanges = review !== storedReview
    || (mode === 'own' && finalPrd !== storedFinalPrd)
    || (resolution && resolution !== storedResolution)
    || prototype?.sha256 !== storedPrototype?.sha256
  const reviewReady = reviewCheck.route === 'approved'
    || (reviewCheck.route === 'confirmation-needed' && forwardConfirmed && ownerAnswersReady)
  const canApply = reviewCheck.valid
    && reviewReady
    && prototypeCheck.valid
    && (mode === 'guided' || finalPrdCheck.valid)
    && (!applied || hasChanges)
    && !disabled
    && applyState !== 'saving'

  useEffect(() => {
    setReview(storedReview)
    setAnswers(getUiReviewResolutionAnswers(storedReview, storedResolution))
    setForwardConfirmed(validateUiReviewResolution(storedReview, storedResolution))
  }, [storedResolution, storedReview])
  useEffect(() => setFinalPrd(storedFinalPrd), [storedFinalPrd])
  useEffect(() => setPrototype(storedPrototype), [storedPrototype])

  function replaceReview(content: string) {
    setReview(content)
    setAnswers({})
    setForwardConfirmed(false)
  }

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

  async function readPrototype(file: File | undefined) {
    if (!file) return
    setPrototypeError('')
    try {
      setPrototype(await createApprovedPrototypeArtifact(file))
      setApplyState('idle')
    } catch (error) {
      setPrototype(null)
      const tooLarge = error instanceof Error && error.message === 'APPROVED_PROTOTYPE_TOO_LARGE'
      setPrototypeError(tooLarge
        ? (isThai ? 'ไฟล์ Prototype ต้องมีขนาดไม่เกิน 5 MB' : 'THE APPROVED PROTOTYPE MUST NOT EXCEED 5 MB.')
        : (isThai ? 'อ่านไฟล์ Prototype ไม่สำเร็จ กรุณาเลือกไฟล์ .html ฉบับที่อนุมัติ' : 'THE APPROVED PROTOTYPE MUST BE A READABLE .HTML FILE.'))
    }
  }

  function downloadPrototype() {
    if (!prototype || !prototypeCheck.valid) return
    const url = URL.createObjectURL(approvedPrototypeBlob(prototype))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = APPROVED_PROTOTYPE_FILE_NAME
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function apply() {
    if (!canApply || !prototype) return
    setApplyState('saving')
    try {
      await onApply({
        review,
        finalPrd: mode === 'own' ? finalPrd : undefined,
        resolution: reviewCheck.route === 'confirmation-needed' ? resolution : undefined,
        prototype,
      })
      setApplyState('saved')
    } catch {
      setApplyState('failed')
    }
  }

  return <div className={`ui-review-workspace ui-review-workspace--${mode}`}>
    <ol className="ui-review-steps" aria-label={isThai ? 'ขั้นตอน Prototype และ UI Review' : 'Prototype and UI Review steps'}>
      <li className="is-complete"><span>1</span><div><strong>{isThai ? 'CODESIGN เตรียม UI Brief' : 'CODESIGN PREPARES THE UI BRIEF'}</strong><small>{isThai ? 'ใช้ Decision ที่ยืนยันแล้วและตัวอย่าง Content เพียงส่วนที่จำเป็น' : 'Uses locked decisions and only the representative content needed for UI review.'}</small></div></li>
      <li className={reviewCheck.valid ? 'is-complete' : 'is-active'}><span>2</span><div><strong>{isThai ? 'ทำ Prototype และปรับใน Chat' : 'PROTOTYPE AND ITERATE IN CHAT'}</strong><small>{isThai ? 'ดูหน้าตาจริง ลอง Flow และปรับจนพอใจก่อนสั่ง Finalize' : 'Inspect visible screens and flow, then iterate before finalizing.'}</small></div></li>
      <li className={applied ? 'is-complete' : review ? 'is-active' : ''}><span>3</span><div><strong>{isThai ? 'นำ UI Review และ HTML กลับมาสร้าง Final PRD' : 'BRING THE REVIEW AND HTML BACK'}</strong><small>{mode === 'guided' ? (isThai ? 'CODESIGN ตรวจ SHA-256 และผสาน Review โดยไม่แก้ Content Pack' : 'CODESIGN verifies SHA-256 and applies the review without changing the Content Pack.') : (isThai ? 'นำ UI Review, Approved Prototype และ Final PRD ที่ Chat ช่วยปรับกลับมาตรวจ' : 'Bring back the UI Review, Approved Prototype, and Chat-assisted final PRD.')}</small></div></li>
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
        <div><span>{isThai ? 'ผลลัพธ์หลัง FINALIZE UI REVIEW' : 'RESULT AFTER FINALIZE UI REVIEW'}</span><h3>{isThai ? 'นำ Review และ HTML ที่อนุมัติกลับเข้า CODESIGN' : 'BRING BACK THE REVIEW AND APPROVED HTML'}</h3><p>{isThai ? 'ระบบตรวจโครงสร้าง คำยืนยันของเจ้าของ และ SHA-256 ของ HTML ก่อนสร้าง Final PRD' : 'CODESIGN validates structure, owner approval, and the HTML SHA-256 before creating the final PRD.'}</p></div>
        {applied ? <span className="ui-review-applied"><Check size={18} /> {isThai ? 'นำ Review ไปใช้แล้ว' : 'REVIEW APPLIED'}</span> : null}
      </header>

      <div className="ui-review-import__files">
        <article className={reviewCheck.valid ? 'is-valid' : review ? 'is-error' : ''}>
          <div><strong>{UI_REVIEW_FILE_NAME}</strong><small>{reviewCheck.valid ? (isThai ? 'โครงสร้างถูกต้อง' : 'VALID STRUCTURE') : (isThai ? 'จำเป็น' : 'REQUIRED')}</small></div>
          <button type="button" disabled={disabled} onClick={() => reviewInputRef.current?.click()}><FileUp size={17} /> {isThai ? 'เลือกไฟล์' : 'CHOOSE FILE'}</button>
          <input ref={reviewInputRef} hidden type="file" accept=".md,text/markdown,text/plain" onChange={(event) => void readFile(event.target.files?.[0], UI_REVIEW_FILE_NAME, replaceReview)} />
        </article>
        <article className={prototypeCheck.valid ? 'is-valid' : prototype ? 'is-error' : ''}>
          <div>
            <strong>{APPROVED_PROTOTYPE_FILE_NAME}</strong>
            <small>{prototypeCheck.valid ? (isThai ? 'SHA-256 ตรงกับ UI Review' : 'SHA-256 MATCHED') : (isThai ? 'จำเป็น' : 'REQUIRED')}</small>
            {prototype ? <small>{prototype.originalFileName} · {prototype.sizeBytes.toLocaleString()} bytes · {prototype.sha256.slice(0, 12)}…</small> : null}
          </div>
          <button type="button" disabled={disabled} onClick={() => prototypeInputRef.current?.click()}><FileUp size={17} /> {isThai ? 'เลือก HTML' : 'CHOOSE HTML'}</button>
          <button type="button" disabled={!prototypeCheck.valid} onClick={downloadPrototype}><Download size={17} /> {isThai ? 'ดาวน์โหลดฉบับตรวจแล้ว' : 'DOWNLOAD VERIFIED COPY'}</button>
          <input ref={prototypeInputRef} hidden type="file" accept=".html,.htm,text/html" onChange={(event) => void readPrototype(event.target.files?.[0])} />
        </article>
        {mode === 'own' ? <article className={finalPrdCheck.valid ? 'is-valid' : finalPrd ? 'is-error' : ''}>
          <div><strong>{OWN_FINAL_PRD_FILE_NAME}</strong><small>{finalPrdCheck.valid ? (isThai ? 'โครงสร้างหลักครบ' : 'CORE STRUCTURE READY') : (isThai ? 'จำเป็นสำหรับ Build Your Own' : 'REQUIRED FOR BUILD YOUR OWN')}</small></div>
          <button type="button" disabled={disabled} onClick={() => finalPrdInputRef.current?.click()}><FileUp size={17} /> {isThai ? 'เลือกไฟล์' : 'CHOOSE FILE'}</button>
          <input ref={finalPrdInputRef} hidden type="file" accept=".md,text/markdown,text/plain" onChange={(event) => void readFile(event.target.files?.[0], OWN_FINAL_PRD_FILE_NAME, setFinalPrd)} />
        </article> : null}
      </div>

      <details className="ui-review-paste">
        <summary>{isThai ? 'ถ้าดาวน์โหลดไฟล์ไม่ได้ ให้วาง Markdown ที่นี่' : 'PASTE MARKDOWN HERE IF DOWNLOAD IS UNAVAILABLE'}</summary>
        <label><span>{UI_REVIEW_FILE_NAME}</span><textarea disabled={disabled} value={review} onChange={(event) => { replaceReview(event.target.value); setApplyState('idle') }} /></label>
        {mode === 'own' ? <label><span>{OWN_FINAL_PRD_FILE_NAME}</span><textarea disabled={disabled} value={finalPrd} onChange={(event) => { setFinalPrd(event.target.value); setApplyState('idle') }} /></label> : null}
      </details>

      {review && !reviewCheck.valid ? <div className="ui-review-errors" role="alert"><AlertTriangle size={20} /><div><strong>{isThai ? 'UI Review ยังใช้ไม่ได้' : 'UI REVIEW IS NOT READY'}</strong>{reviewCheck.errors.map((error) => <p key={error}>{error}</p>)}</div></div> : null}
      {(prototypeError || (review && !prototypeCheck.valid)) ? <div className="ui-review-errors" role="alert"><AlertTriangle size={20} /><div><strong>{isThai ? 'Prototype ยังยืนยันตัวตนไม่ได้' : 'PROTOTYPE IDENTITY IS NOT VERIFIED'}</strong>{prototypeError ? <p>{prototypeError}</p> : null}{prototypeCheck.errors.map((error) => <p key={error}>{error}</p>)}{prototypeCheck.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></div> : null}
      {prototypeCheck.valid && prototypeCheck.warnings.length ? <div className="ui-review-errors" role="status"><AlertTriangle size={20} /><div><strong>{isThai ? 'ตรวจด้วย SHA-256 ผ่านแล้ว' : 'SHA-256 VERIFIED'}</strong>{prototypeCheck.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></div> : null}
      {mode === 'own' && finalPrd && !finalPrdCheck.valid ? <div className="ui-review-errors" role="alert"><AlertTriangle size={20} /><div><strong>{isThai ? 'Final PRD ยังมีโครงสร้างไม่ครบ' : 'FINAL PRD IS INCOMPLETE'}</strong>{finalPrdCheck.errors.map((error) => <p key={error}>{error}</p>)}</div></div> : null}

      {reviewCheck.valid && reviewCheck.route === 'confirmation-needed' ? <div className="ui-review-forward">
        <div className="ui-review-forward__title"><Check size={22} /><div><strong>{isThai ? 'UI ได้รับอนุมัติแล้ว — Consolidate แล้วเดินหน้าต่อ' : 'UI APPROVED — CONSOLIDATE AND MOVE FORWARD'}</strong><p>{isThai ? 'ไม่ต้องย้อนกลับไปแก้ Step เดิม CODESIGN จะเก็บสิ่งที่เปลี่ยนเป็น Change Log และผสานเข้ากับ Final PRD หลังคุณตอบเฉพาะคำถามที่ยังต้องตัดสินใจ' : 'You do not need to revisit earlier steps. CODESIGN records the delta and merges it into the final PRD after the remaining owner decisions are answered here.'}</p></div></div>

        <details className="ui-review-forward__changes">
          <summary>{isThai ? 'ดูสิ่งที่เปลี่ยนจากข้อมูลเดิม' : 'REVIEW WHAT CHANGED'}</summary>
          {forwardPlan.acceptedChanges ? <section><h4>{isThai ? 'สิ่งที่อนุมัติจาก Prototype' : 'APPROVED FROM THE PROTOTYPE'}</h4><MarkdownPreview markdown={forwardPlan.acceptedChanges} /></section> : null}
          {forwardPlan.impactMap ? <section><h4>{isThai ? 'จุดที่ CODESIGN จะผสานใน Final PRD' : 'FINAL PRD CONSOLIDATION MAP'}</h4><MarkdownPreview markdown={forwardPlan.impactMap} /></section> : null}
        </details>

        {forwardPlan.consolidationItems.length ? <section className="ui-review-forward__automatic"><h4>{isThai ? 'CODESIGN จัดการให้โดยไม่ต้องตอบเพิ่ม' : 'CODESIGN HANDLES THESE AUTOMATICALLY'}</h4><ul>{forwardPlan.consolidationItems.map((item) => <li key={item.id}><Check size={16} /><span><strong>{item.title}</strong><small>{item.prompt}</small></span></li>)}</ul></section> : null}

        {forwardPlan.ownerQuestions.length ? <section className="ui-review-forward__questions"><h4>{isThai ? `ตอบอีก ${forwardPlan.ownerQuestions.length} เรื่องก่อนสร้าง Final PRD` : `ANSWER ${forwardPlan.ownerQuestions.length} OWNER QUESTION(S)`}</h4>{forwardPlan.ownerQuestions.map((item, index) => <label key={item.id}><span><strong>{index + 1}. {item.prompt}</strong><small>{isThai ? 'ตอบด้วยภาษาของคุณได้เลย คำตอบนี้จะถูกบันทึกไว้กับ Final PRD' : 'Answer in your own words. It will be recorded with the final PRD.'}</small></span><textarea rows={3} value={answers[item.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} /></label>)}</section> : <p className="ui-review-forward__ready"><Check size={18} /> {isThai ? 'ไม่มีคำถาม Product Decision ที่ต้องตอบเพิ่ม' : 'NO ADDITIONAL PRODUCT DECISION IS REQUIRED.'}</p>}

        <label className={forwardConfirmed ? 'ui-review-forward__confirm is-active' : 'ui-review-forward__confirm'}><input type="checkbox" checked={forwardConfirmed} onChange={(event) => setForwardConfirmed(event.target.checked)} /><Check size={18} /><span><strong>{isThai ? 'ยืนยันให้ใช้การเปลี่ยนแปลงจาก Prototype สร้าง Final PRD' : 'USE THESE PROTOTYPE-DRIVEN CHANGES IN THE FINAL PRD'}</strong><small>{isThai ? 'ระบบจะเก็บข้อมูลเดิมและ UI Review ไว้ในประวัติ ไม่แก้ CONTENT_PACK.md และไม่ส่งคุณย้อนกลับไปทำ Step เดิม' : 'CODESIGN preserves the prior definition and UI Review in history, leaves CONTENT_PACK.md unchanged, and does not send you back through earlier steps.'}</small></span></label>
      </div> : null}

      {reviewCheck.valid && reviewCheck.route === 'reprototype' ? <div className="ui-review-revision"><RotateCcw size={22} /><div><strong>RE-PROTOTYPE REQUIRED</strong><p>{isThai ? 'คำตัดสินที่ยังไม่จบจะเปลี่ยนหน้าตาหรือ Flow จน Prototype ปัจจุบันใช้เป็นแบบอ้างอิงไม่ได้ กรุณากลับไปตอบคำถามใน Chat และปรับ Prototype เฉพาะกรณีนี้เท่านั้น' : 'An unresolved decision would materially change the visible flow, so the current prototype is no longer a reliable baseline. Return to Chat only for this case.'}</p></div></div> : null}

      {reviewCheck.valid && reviewCheck.route === 'approved' ? <div className="ui-review-preview"><div><Check size={19} /><strong>APPROVED FOR FINAL PRD</strong></div><MarkdownPreview markdown={review} /></div> : null}

      <footer>
        <p>{mode === 'guided' ? (isThai ? `ระบบจะเก็บ ${APPROVED_PROTOTYPE_FILE_NAME} ที่ตรวจ SHA-256 แล้ว เพิ่ม Screen map, Navigation และ UI direction ในไฟล์ที่เกี่ยวข้อง ส่วน CONTENT_PACK.md จะคงเดิมทุกตัวอักษร` : `CODESIGN preserves the SHA-256-verified ${APPROVED_PROTOTYPE_FILE_NAME}, adds the approved screen, navigation, and UI direction details, and keeps CONTENT_PACK.md byte-for-byte unchanged.`) : (isThai ? `ระบบจะเก็บ ${APPROVED_PROTOTYPE_FILE_NAME} ที่ตรวจ SHA-256 แล้วคู่กับ UI Review และ Final PRD เพื่อให้ตรวจย้อนกลับได้` : `CODESIGN stores the SHA-256-verified ${APPROVED_PROTOTYPE_FILE_NAME} with the UI Review and final PRD for traceability.`)}</p>
        <button type="button" disabled={!canApply} onClick={() => void apply()}><Check size={18} /> {applyState === 'saving' ? (isThai ? 'กำลังสร้าง Final PRD…' : 'CREATING FINAL PRD…') : applied ? (isThai ? 'สร้าง Final PRD แล้ว' : 'FINAL PRD CREATED') : reviewCheck.route === 'confirmation-needed' ? (isThai ? 'ยืนยันการเปลี่ยนแปลงและสร้าง Final PRD' : 'CONFIRM CHANGES AND CREATE FINAL PRD') : (isThai ? 'ใช้ UI Review สร้าง Final PRD' : 'CREATE FINAL PRD FROM UI REVIEW')}</button>
        {applyState === 'failed' ? <span role="alert">{isThai ? 'ทำรายการไม่สำเร็จ ตรวจชื่อไฟล์และลองอีกครั้ง' : 'ACTION FAILED. CHECK THE FILENAMES AND TRY AGAIN.'}</span> : null}
      </footer>
    </section>
  </div>
}
