import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, FileText, FileUp, Flag, LockKeyhole, RotateCcw, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { buildUpdateIsReady, buildUpdateLimits, buildUpdatePrompt, mergeBuildUpdateDocuments, normalizeBuildUpdateDocuments } from '../buildUpdateModel'
import { completeNextIteration, getPhaseEntries } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { MarkdownPreview } from '../prd/MarkdownPreview'
import { usePhaseDraft } from '../usePhaseDraft'

type ChangeRoute = '' | 'implementation' | 'PRD' | 'S' | 'E' | 'C'

const initialNext = {
  buildUpdateFiles: [] as Json,
  buildUpdatePrimaryFile: '',
  buildUpdateConfirmed: false,
  change: '',
  because: '',
  expectedResult: '',
  changeRoute: '',
  routeConfirmed: false,
}

export function NextPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'N', initialValues: initialNext })
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [activeBuildUpdateFile, setActiveBuildUpdateFile] = useState('')
  const [buildUpdateMessage, setBuildUpdateMessage] = useState('')
  const [promptCopyState, setPromptCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const feedback = useQuery({ queryKey: ['phase-entries', project.id, 'G'], queryFn: () => getPhaseEntries(project.id, 'G') })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mostImportant = feedback.data?.find((entry) => entry.fieldKey === 'mostImportant')?.content
  const feedbackAlignment = feedback.data?.find((entry) => entry.fieldKey === 'alignmentStatus')?.content
  const feedbackAlignmentNote = feedback.data?.find((entry) => entry.fieldKey === 'alignmentNote')?.content
  const buildUpdateDocuments = normalizeBuildUpdateDocuments(draft.values.buildUpdateFiles)
  const savedPrimaryFile = String(draft.values.buildUpdatePrimaryFile)
  const primaryFile = buildUpdateDocuments.some((file) => file.name === savedPrimaryFile) ? savedPrimaryFile : (buildUpdateDocuments[0]?.name ?? '')
  const previewFile = buildUpdateDocuments.find((file) => file.name === activeBuildUpdateFile)
    ?? buildUpdateDocuments.find((file) => file.name === primaryFile)
    ?? buildUpdateDocuments[0]
  const buildUpdateReady = buildUpdateIsReady(buildUpdateDocuments, primaryFile, Boolean(draft.values.buildUpdateConfirmed))
  const codexBuildUpdatePrompt = buildUpdatePrompt(project.title, isThai)
  const changeRoute = normalizeChangeRoute(draft.values.changeRoute)
  const resetRouteConfirmation = () => draft.setField('routeConfirmed', false)
  const ready = buildUpdateReady && [draft.values.change, draft.values.because, draft.values.expectedResult].every((value) => String(value).trim()) && changeRoute === 'implementation' && Boolean(draft.values.routeConfirmed)

  const copyBuildUpdatePrompt = async () => {
    try {
      await navigator.clipboard.writeText(codexBuildUpdatePrompt)
      setPromptCopyState('copied')
    } catch {
      setPromptCopyState('failed')
    }
    window.setTimeout(() => setPromptCopyState('idle'), 1800)
  }

  const readBuildUpdateFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const selected = Array.from(files)
    if (uploadInputRef.current) uploadInputRef.current.value = ''
    const invalidNames = selected.filter((file) => !/\.md$/i.test(file.name)).map((file) => file.name)
    const oversizedNames = selected.filter((file) => file.size > buildUpdateLimits.maxFileBytes).map((file) => file.name)
    if (invalidNames.length || oversizedNames.length) {
      const messages = [
        invalidNames.length ? `${isThai ? 'รองรับเฉพาะไฟล์ .md' : 'ONLY .MD FILES ARE SUPPORTED'}: ${invalidNames.join(', ')}` : '',
        oversizedNames.length ? `${isThai ? 'ไฟล์ใหญ่เกิน 300 KB' : 'FILES OVER 300 KB'}: ${oversizedNames.join(', ')}` : '',
      ].filter(Boolean)
      setBuildUpdateMessage(messages.join(' · '))
      return
    }

    const incoming = await Promise.all(selected.map(async (file) => ({ name: file.name, content: await file.text(), size: file.size })))
    const merged = mergeBuildUpdateDocuments(buildUpdateDocuments, incoming)
    const totalBytes = merged.reduce((total, file) => total + file.size, 0)
    if (merged.length > buildUpdateLimits.maxFiles || totalBytes > buildUpdateLimits.maxTotalBytes) {
      setBuildUpdateMessage(isThai ? 'เลือกได้สูงสุด 12 ไฟล์ และขนาดรวมไม่เกิน 1 MB' : 'SELECT UP TO 12 FILES WITH A 1 MB TOTAL LIMIT')
      return
    }

    const nextPrimaryFile = merged.find((file) => file.name.toLocaleLowerCase() === primaryFile.toLocaleLowerCase())?.name
      ?? incoming[0]?.name
      ?? ''
    draft.setField('buildUpdateFiles', merged as Json)
    draft.setField('buildUpdatePrimaryFile', nextPrimaryFile)
    draft.setField('buildUpdateConfirmed', false)
    setActiveBuildUpdateFile(incoming[0]?.name ?? nextPrimaryFile)
    setBuildUpdateMessage(isThai ? `เพิ่มเอกสาร ${incoming.length} ไฟล์แล้ว กรุณาเลือกและตรวจไฟล์สรุปหลัก` : `${incoming.length} DOCUMENT(S) ADDED. REVIEW AND SELECT THE PRIMARY SUMMARY.`)
  }

  const removeBuildUpdateFile = (name: string) => {
    const nextDocuments = buildUpdateDocuments.filter((file) => file.name !== name)
    const nextPrimaryFile = primaryFile === name ? (nextDocuments[0]?.name ?? '') : primaryFile
    draft.setField('buildUpdateFiles', nextDocuments as Json)
    draft.setField('buildUpdatePrimaryFile', nextPrimaryFile)
    draft.setField('buildUpdateConfirmed', false)
    if (activeBuildUpdateFile === name) setActiveBuildUpdateFile(nextPrimaryFile)
    setBuildUpdateMessage(isThai ? `นำ ${name} ออกจากรายการแล้ว` : `${name} REMOVED`)
  }
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      return completeNextIteration(project.id, {
        change: draft.values.change,
        because: draft.values.because,
        expectedResult: draft.values.expectedResult,
        changeRoute,
        sourceFeedbackAlignment: feedbackAlignment,
        sourceFeedbackAlignmentNote: feedbackAlignmentNote,
        buildUpdate: {
          provided: buildUpdateDocuments.length > 0,
          primaryFile: primaryFile || null,
          files: buildUpdateDocuments.map((file) => file.name),
        },
      } as Json)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/COMPLETE`)
    },
  })

  return (
    <JourneyLayout project={project} phase="N" phaseName="NEXT ITERATION" chatContext={{ ...draft.values, mostImportant }} saveState={draft.saveState}>
      <PhaseSection step="01" title={isThai ? 'สิ่งที่การทดสอบเปิดเผย' : 'WHAT THE TEST REVEALED'}>
        <blockquote className="feedback-quote">{typeof mostImportant === 'string' ? mostImportant : (isThai ? 'กำลังโหลดข้อเสนอแนะ…' : 'Loading feedback…')}</blockquote>
      </PhaseSection>
      <PhaseSection step="02" title={isThai ? 'บันทึกสิ่งที่สร้างจริง (ไม่บังคับ)' : 'CURRENT BUILD UPDATE · OPTIONAL'} description={isThai ? 'ใช้เมื่อ App ปัจจุบันเปลี่ยนจาก PRD ระหว่างการสร้าง หากไม่ต้องการเก็บเอกสารเพิ่มเติม สามารถข้ามส่วนนี้และไปต่อได้' : 'Use this when the current app changed during implementation. You can skip this section without blocking the next step.'}>
        <div className="build-update-intro">
          <FileText size={25} aria-hidden="true" />
          <div><strong>{isThai ? 'เอกสารนี้เป็นหลักฐานประกอบ ไม่ใช่คำตัดสินแทนคุณ' : 'THIS IS SUPPORTING EVIDENCE, NOT A DECISION FOR YOU'}</strong><p>{isThai ? 'ใช้ Task เดิมใน Codex ให้ตรวจ App ปัจจุบัน แล้วนำไฟล์ Markdown กลับมาเก็บเป็น Snapshot แยกจาก PRD เดิม' : 'Use the existing Codex task to review the current app, then bring Markdown documents back as a snapshot separate from the original PRD.'}</p></div>
        </div>
        <div className="build-update-actions">
          <button type="button" onClick={() => void copyBuildUpdatePrompt()}><Copy size={18} /> {promptCopyState === 'copied' ? (isThai ? 'คัดลอก Prompt แล้ว' : 'PROMPT COPIED') : promptCopyState === 'failed' ? (isThai ? 'คัดลอกไม่สำเร็จ' : 'COPY FAILED') : (isThai ? 'คัดลอก Prompt สำหรับ Codex' : 'COPY PROMPT FOR CODEX')}</button>
          <label><FileUp size={18} /> {isThai ? 'เลือกไฟล์ Markdown' : 'CHOOSE MARKDOWN FILES'}<input ref={uploadInputRef} type="file" accept=".md,text/markdown,text/plain" multiple onChange={(event) => void readBuildUpdateFiles(event.target.files)} /></label>
        </div>
        <details className="build-update-prompt"><summary>{isThai ? 'ดู Prompt ก่อนคัดลอก' : 'PREVIEW THE PROMPT'}</summary><pre>{codexBuildUpdatePrompt}</pre></details>
        <p className="build-update-privacy"><strong>{isThai ? 'ตรวจความปลอดภัยก่อนอัปโหลด:' : 'CHECK BEFORE UPLOADING:'}</strong> {isThai ? 'อย่าใส่ Password, Token, API Key, ค่า Environment, ข้อมูลส่วนบุคคล หรือ URL ของ Private Repository' : 'Remove passwords, tokens, API keys, environment values, personal data, and private repository URLs.'}</p>

        {buildUpdateDocuments.length ? <div className="build-update-workspace">
          <div className="build-update-file-list">
            {buildUpdateDocuments.map((file) => <article className={previewFile?.name === file.name ? 'is-active' : ''} key={file.name}>
              <button type="button" onClick={() => setActiveBuildUpdateFile(file.name)}><FileText size={18} /><span><strong>{file.name}</strong><small>{Math.max(1, Math.round(file.size / 1024))} KB</small></span></button>
              <label><input type="radio" name="build-update-primary" checked={primaryFile === file.name} onChange={() => { draft.setField('buildUpdatePrimaryFile', file.name); draft.setField('buildUpdateConfirmed', false); setActiveBuildUpdateFile(file.name) }} /> {isThai ? 'สรุปหลัก' : 'PRIMARY'}</label>
              <button type="button" aria-label={`${isThai ? 'นำออก' : 'Remove'} ${file.name}`} onClick={() => removeBuildUpdateFile(file.name)}><Trash2 size={17} /></button>
            </article>)}
          </div>
          {previewFile ? <div className="build-update-preview"><header><span>{isThai ? 'ตัวอย่างไฟล์' : 'FILE PREVIEW'}</span><strong>{previewFile.name}</strong></header><MarkdownPreview markdown={previewFile.content} /></div> : null}
          <label className={draft.values.buildUpdateConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}><input type="checkbox" checked={Boolean(draft.values.buildUpdateConfirmed)} onChange={(event) => draft.setField('buildUpdateConfirmed', event.target.checked)} /><Check size={19} /><span><strong>{isThai ? 'ฉันอ่านไฟล์สรุปหลักและต้องการเก็บ Snapshot นี้' : 'I REVIEWED THE PRIMARY SUMMARY AND WANT TO SAVE THIS SNAPSHOT'}</strong><small>{isThai ? 'CODESIGN จะเก็บไฟล์ทั้งหมดแยกจาก PRD เดิม และไม่ใช้ข้อความนี้ตัดสินใจแทนคุณ' : 'CODESIGN stores these files separately from the original PRD and does not treat them as your decision.'}</small></span></label>
        </div> : <p className="build-update-empty">{isThai ? 'ยังไม่ได้เพิ่มไฟล์ — ข้ามได้โดยไม่กระทบการไปต่อ' : 'NO FILES ADDED — YOU MAY CONTINUE WITHOUT THEM'}</p>}
        {buildUpdateMessage ? <p className="build-update-message" role="status">{buildUpdateMessage}</p> : null}
      </PhaseSection>
      <PhaseSection step="03" title={isThai ? 'เลือกการเปลี่ยนแปลงหนึ่งเรื่อง' : 'LOCK ONE CHANGE'} description={isThai ? 'ถ้าแก้ได้หนึ่งเรื่องก่อน อะไรจะทำให้ Product เข้าใกล้ Goal มากที่สุด?' : 'If you could change one thing first, what would move the product closest to its goal?'}>
        <FormField label={isThai ? 'สิ่งที่จะเปลี่ยน' : 'CHANGE'} guideKey="next.change" required><textarea rows={4} value={String(draft.values.change)} onChange={(event) => { draft.setField('change', event.target.value); resetRouteConfirmation() }} /></FormField>
        <FormField label={isThai ? 'เพราะอะไร' : 'BECAUSE'} guideKey="next.because" required><textarea rows={4} value={String(draft.values.because)} onChange={(event) => { draft.setField('because', event.target.value); resetRouteConfirmation() }} /></FormField>
        <FormField label={isThai ? 'ผลลัพธ์ที่คาดหวัง' : 'EXPECTED RESULT'} guideKey="next.expected" required><textarea rows={4} value={String(draft.values.expectedResult)} onChange={(event) => { draft.setField('expectedResult', event.target.value); resetRouteConfirmation() }} /></FormField>
      </PhaseSection>
      <PhaseSection step="04" title={isThai ? 'เลือกเจ้าของการเปลี่ยนแปลง' : 'ROUTE THE CHANGE'} description={isThai ? 'ระบุว่าเรื่องนี้แก้ที่การสร้างได้เลย หรือต้องย้อนกลับไปแก้คำตัดสินต้นทาง' : 'Decide whether this is an implementation change or requires a revision of an earlier decision.'}>
        <div className="alignment-contract alignment-contract--2">
          <article><span>{isThai ? 'ผลจาก Step G' : 'STEP G RESULT'}</span><p>{typeof mostImportant === 'string' ? mostImportant : '—'}</p></article>
          <article><span>{isThai ? 'ความสัมพันธ์ที่บันทึกไว้' : 'RECORDED RELATIONSHIP'}</span><p>{[String(feedbackAlignment ?? ''), String(feedbackAlignmentNote ?? '')].filter(Boolean).join(' — ') || '—'}</p></article>
        </div>
        <div className="alignment-choices iteration-route-choices" role="radiogroup" aria-label={isThai ? 'เลือก Step ที่ต้องแก้ไข' : 'Choose the owner of the change'}>
          {([
            ['implementation', isThai ? 'แก้ที่ App' : 'IMPLEMENTATION', isThai ? 'แก้ Code, UI หรือ Bug โดยไม่เปลี่ยน Product decision' : 'Fix code, UI, or a bug without changing a product decision.'],
            ['PRD', isThai ? 'แก้ชุดส่งต่องาน' : 'PRD PACKAGE', isThai ? 'ไฟล์หรือเกณฑ์ตรวจรับประกอบผิดจากข้อมูลที่ยืนยันไว้' : 'The files or acceptance criteria were assembled incorrectly.'],
            ['S', isThai ? 'แก้รายละเอียด' : 'STEP S', isThai ? 'เปลี่ยน Journey เนื้อหา กติกา การบันทึก หรือ Theme' : 'Change the journey, content, rules, records, or theme.'],
            ['E', isThai ? 'แก้ขอบเขต' : 'STEP E', isThai ? 'เปลี่ยน Direction, Must Have หรือ Non-goal' : 'Change direction, must-haves, or non-goals.'],
            ['C', isThai ? 'แก้บริบท' : 'STEP C', isThai ? 'เปลี่ยนผู้ใช้ Goal Success บริบท หรือข้อจำกัด' : 'Change the user, goal, success, context, or constraints.'],
          ] as const).map(([value, title, description]) => <label key={value} className={changeRoute === value ? `is-active ${value === 'implementation' ? '' : 'is-revision'}` : value === 'implementation' ? '' : 'is-revision'}><input type="radio" name="change-route" checked={changeRoute === value} onChange={() => { draft.setField('changeRoute', value); resetRouteConfirmation() }} /><span><strong>{title}</strong><small>{description}</small></span></label>)}
        </div>
        {changeRoute && changeRoute !== 'implementation' ? <div className="alignment-revision-route"><RotateCcw size={22} /><div><strong>{isThai ? `เริ่ม Revision ที่ Step ${changeRoute}` : `START A REVISION AT STEP ${changeRoute}`}</strong><p>{isThai ? 'ระบบจะเก็บฉบับเดิมไว้ และเปิด Step ที่ได้รับผลกระทบให้ตรวจยืนยันใหม่ตามลำดับ' : 'The prior version will be preserved and affected downstream steps will reopen for review.'}</p><Link to={`/projects/${project.id}/${changeRoute}`}>{isThai ? `ไปที่ Step ${changeRoute}` : `GO TO STEP ${changeRoute}`}</Link></div></div> : null}
        {changeRoute === 'implementation' ? <label className={draft.values.routeConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}><input type="checkbox" checked={Boolean(draft.values.routeConfirmed)} onChange={(event) => draft.setField('routeConfirmed', event.target.checked)} /><Flag size={19} /><span><strong>{isThai ? 'การเปลี่ยนแปลงนี้ไม่เปลี่ยน Product decision' : 'THIS CHANGE DOES NOT ALTER A PRODUCT DECISION'}</strong><small>{isThai ? 'สามารถบันทึกเป็นงานรอบถัดไปโดยไม่ย้อน Revision' : 'It can be recorded as the next implementation iteration without revising an earlier step.'}</small></span></label> : null}
      </PhaseSection>
      <ReviewGate title={isThai ? 'ตรวจการเปลี่ยนแปลงรอบถัดไป' : 'NEXT ITERATION GATE'} question={isThai ? 'นี่คือการเปลี่ยนแปลงที่สำคัญที่สุด ไม่ใช่แค่สิ่งที่แก้ง่ายที่สุด ใช่หรือไม่?' : 'Is this the most important change—not merely the easiest one?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'ยืนยันการเปลี่ยนแปลงรอบถัดไป' : 'LOCK NEXT ITERATION')}</ArcadeButton>}>
        <p><Flag size={17} /> {!buildUpdateReady ? (isThai ? 'เลือกไฟล์สรุปหลักและยืนยัน Snapshot ที่เพิ่มไว้ หรือเอาไฟล์ทั้งหมดออกเพื่อข้าม' : 'CONFIRM THE UPLOADED SNAPSHOT OR REMOVE ALL FILES TO SKIP IT.') : changeRoute && changeRoute !== 'implementation' ? (isThai ? `เรื่องนี้ต้องเริ่ม Revision ที่ Step ${changeRoute} ก่อน จึงยังปิดรอบไม่ได้` : `START A STEP ${changeRoute} REVISION BEFORE CLOSING THIS ITERATION.`) : (isThai ? 'การตัดสินใจนี้จะถูกเก็บใน Decision History และปิด Guided Build รอบแรก' : 'This decision will enter Decision History and complete the first Guided Build.')}</p>
        {completion.isError ? <p className="field-error" role="alert">Lock Next Iteration ไม่สำเร็จ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

function normalizeChangeRoute(value: Json | undefined): ChangeRoute {
  return value === 'implementation' || value === 'PRD' || value === 'S' || value === 'E' || value === 'C' ? value : ''
}
