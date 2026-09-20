import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Copy, Download, ExternalLink, FileCode2, Github, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { CrossStepAlignment } from '../CrossStepAlignment'
import { normalizeAlignmentStatus } from '../crossStepAlignmentModel'
import { getImplementationReadiness, type ImplementationRequirementKey } from '../implementationReadiness'
import { completeImplementation, getLatestPrdSnapshot, getPhaseEntries } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { assembleStartWithCodex, suggestProjectFolderName, type GitHubReadiness } from '../prd/handoffFiles'
import { MarkdownPreview } from '../prd/MarkdownPreview'
import {
  approvedPrototypeBlob,
  parseApprovedPrototypeArtifact,
  verifyApprovedPrototypeArtifact,
  type ApprovedPrototypeArtifact,
} from '../prd/approvedPrototype'
import { usePhaseDraft } from '../usePhaseDraft'

const initialImplement = {
  githubReadiness: 'unsure',
  workingApp: false,
  appUrl: '',
  alignmentStatus: '',
  alignmentNote: '',
  alignmentConfirmed: false,
}

type ImplementPackageFile = {
  fileName: string
  description: string
  kind: 'markdown'
  content: string
} | {
  fileName: string
  description: string
  kind: 'prototype'
  artifact: ApprovedPrototypeArtifact | null
}

export function ImplementPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'I', initialValues: initialImplement })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState('')
  const [folderCopyState, setFolderCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [selectedPackageFile, setSelectedPackageFile] = useState('START_WITH_CODEX.md')
  const [prototypeIntegrity, setPrototypeIntegrity] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const snapshot = useQuery({ queryKey: ['prd-snapshot', project.id], queryFn: () => getLatestPrdSnapshot(project.id) })
  const prdEntries = useQuery({ queryKey: ['phase-entries', project.id, 'PRD'], queryFn: () => getPhaseEntries(project.id, 'PRD') })
  const specifyEntries = useQuery({ queryKey: ['phase-entries', project.id, 'S'], queryFn: () => getPhaseEntries(project.id, 'S') })
  const readiness = String(draft.values.githubReadiness) as GitHubReadiness
  const specifyValue = (fieldKey: string) => specifyEntries.data?.find((entry) => entry.fieldKey === fieldKey)?.content
  const startWithCodex = assembleStartWithCodex(project, readiness, {
    productLanguage: specifyValue('productLanguage'),
    returnRule: specifyValue('returnRule'),
    sequenceRule: specifyValue('sequenceRule'),
    storageRule: specifyValue('storageRule'),
  })
  const suggestedFolderName = suggestProjectFolderName(project.title, project.id)
  const alignmentStatus = normalizeAlignmentStatus(draft.values.alignmentStatus)
  const alignmentNote = String(draft.values.alignmentNote)
  const resetAlignment = () => draft.setField('alignmentConfirmed', false)
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      return completeImplementation({
        projectId: project.id,
        appUrl: String(draft.values.appUrl),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/G`)
    },
  })

  const fallbackEntry = (fieldKey: string) => {
    const content = prdEntries.data?.find((entry) => entry.fieldKey === fieldKey)?.content
    return typeof content === 'string' ? content : ''
  }
  const approvedPrototype = parseApprovedPrototypeArtifact(prdEntries.data?.find((entry) => entry.fieldKey === 'approvedPrototypeArtifact')?.content)
  useEffect(() => {
    let cancelled = false
    if (!approvedPrototype) {
      setPrototypeIntegrity('invalid')
      return () => { cancelled = true }
    }
    setPrototypeIntegrity('checking')
    void verifyApprovedPrototypeArtifact(approvedPrototype).then((valid) => {
      if (!cancelled) setPrototypeIntegrity(valid ? 'valid' : 'invalid')
    })
    return () => { cancelled = true }
  }, [approvedPrototype])
  const packageFiles: ImplementPackageFile[] = [
    { fileName: 'CODESIGN_HANDOFF.md', description: isThai ? 'Product decisions และขอบเขตงานที่ Lock แล้ว' : 'Locked product decisions and scope', kind: 'markdown', content: snapshot.data?.markdown_content || fallbackEntry('markdownDraft') },
    { fileName: 'CONTENT_PACK.md', description: isThai ? 'เนื้อหา แบบฝึก และการบันทึกครบ 21 วัน' : 'All 21 days of content, exercises, and records', kind: 'markdown', content: snapshot.data?.content_pack || fallbackEntry('contentPackDraft') },
    { fileName: 'EXPERIENCE_DIRECTION.md', description: isThai ? 'Theme และแนวทางกำกับประสบการณ์' : 'Theme and experience guardrails', kind: 'markdown', content: snapshot.data?.experience_direction || fallbackEntry('experienceDirectionDraft') },
    { fileName: 'APPROVED_PROTOTYPE.html', description: isThai ? 'ต้นแบบที่อนุมัติและตรวจ SHA-256 แล้ว ใช้อ้างอิงหน้าตาและ Interaction' : 'SHA-256-verified visual and interaction reference', kind: 'prototype', artifact: approvedPrototype },
    { fileName: 'START_WITH_CODEX.md', description: isThai ? 'คำสั่งเริ่มงาน กติกา Authority และขั้นตรวจ Conformance' : 'Starting instructions, authority rules, and conformance checks', kind: 'markdown', content: startWithCodex },
  ]
  const activePackageFile = packageFiles.find((file) => file.fileName === selectedPackageFile) ?? packageFiles[4]
  const packageReady = packageFiles.every((file) => file.kind === 'prototype' ? Boolean(file.artifact) && prototypeIntegrity === 'valid' : Boolean(file.content.trim()))
  const packageLoadError = snapshot.isError || prdEntries.isError || specifyEntries.isError || (!snapshot.isLoading && !prdEntries.isLoading && !specifyEntries.isLoading && prototypeIntegrity !== 'checking' && !packageReady)
  const prdReviewOutcome = prdEntries.data?.find((entry) => entry.fieldKey === 'reviewOutcomeV2')?.content
  const implementationReadiness = getImplementationReadiness({
    workingApp: Boolean(draft.values.workingApp),
    appUrl: String(draft.values.appUrl),
    alignmentStatus,
    alignmentNote,
    alignmentConfirmed: Boolean(draft.values.alignmentConfirmed),
  })
  const ready = !draft.loading && implementationReadiness.ready
  const completionRequirementLabels: Record<ImplementationRequirementKey, string> = isThai ? {
    workingApp: 'ยืนยันใน I4 ว่าทดสอบเส้นทางหลัก ตรวจ PROTOTYPE_CONFORMANCE.md แล้ว และไม่มี Material mismatch ค้างอยู่',
    appUrl: 'ใส่ Public URL ของ App ใน I4',
    alignmentStatus: alignmentStatus === 'revision' ? 'กลับไปแก้ Product decision ที่เปลี่ยนก่อน' : 'เลือกผลการส่งต่อ PRD → I ใน I5',
    alignmentNote: 'อธิบายรายละเอียดที่ทำให้ PRD ชัดขึ้นใน I5',
    alignmentConfirmed: 'ยืนยันว่าตรวจ Step PRD และ I พร้อมกันแล้วใน I5',
  } : {
    workingApp: 'Confirm in I4 that the primary journey works and PROTOTYPE_CONFORMANCE.md has no unresolved material mismatch',
    appUrl: 'Enter the public app URL in I4',
    alignmentStatus: alignmentStatus === 'revision' ? 'Revise the changed product decision first' : 'Select the PRD → I handoff result in I5',
    alignmentNote: 'Explain the clarification in I5',
    alignmentConfirmed: 'Confirm the joint PRD and I review in I5',
  }
  const visibleRequirementKeys: ImplementationRequirementKey[] = [
    'workingApp',
    'appUrl',
    'alignmentStatus',
    ...(alignmentStatus === 'clarifies' ? ['alignmentNote' as const] : []),
    'alignmentConfirmed',
  ]

  const downloadPackageFile = (file: ImplementPackageFile) => {
    let blob: Blob
    if (file.kind === 'prototype') {
      if (!file.artifact || prototypeIntegrity !== 'valid') return
      blob = approvedPrototypeBlob(file.artifact)
    } else {
      blob = new Blob([file.content], { type: 'text/markdown;charset=utf-8' })
    }
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    anchor.click()
    URL.revokeObjectURL(url)
    setFeedback(isThai ? `ดาวน์โหลด ${file.fileName} แล้ว` : `${file.fileName} DOWNLOADED`)
  }

  const copySuggestedFolderName = async () => {
    try {
      await navigator.clipboard.writeText(suggestedFolderName)
      setFolderCopyState('copied')
    } catch {
      setFolderCopyState('failed')
    }
    window.setTimeout(() => setFolderCopyState('idle'), 1800)
  }

  const readinessChoices: Array<{ value: GitHubReadiness; title: string; description: string }> = [
    { value: 'ready', title: isThai ? 'มีบัญชี GitHub และเข้าใช้ได้' : 'I HAVE A GITHUB ACCOUNT', description: isThai ? 'Codex จะพาสร้าง Repository และตั้งค่า Publish' : 'Codex will guide repository creation and publishing.' },
    { value: 'need-account', title: isThai ? 'ยังไม่มีบัญชี GitHub' : 'I NEED AN ACCOUNT', description: isThai ? 'Codex จะอธิบายและพาเปิดบัญชีทีละขั้น' : 'Codex will explain and guide account setup.' },
    { value: 'unsure', title: isThai ? 'ไม่แน่ใจ หรือไม่เคยใช้' : 'I AM NOT SURE', description: isThai ? 'Codex จะเริ่มจากตรวจความพร้อมและอธิบายคำสำคัญ' : 'Codex will check readiness and explain the key terms first.' },
  ]

  const folderSteps = isThai ? [
    `สร้าง Folder ใหม่สำหรับ App นี้ ใช้ชื่อแนะนำ “${suggestedFolderName}” หรือชื่ออื่นที่คุณจำได้ง่าย`,
    'ดาวน์โหลดไฟล์ทั้ง 5 ฉบับ แล้วนำจาก Downloads ไปไว้ใน Folder นี้โดยคงชื่อไฟล์ตามเดิม',
    'เปิด Codex แล้วเพิ่ม Folder นี้เป็น Local Project',
  ] : [
    `Create a new app folder. Use “${suggestedFolderName}” or any memorable name`,
    'Download all five files, then move them from Downloads into that folder without renaming them',
    'Open Codex and add that folder as a local project',
  ]
  const codexSteps = isThai ? [
    'เปิด Task ใหม่ภายใน Local Project',
    'กลับมาที่ CODESIGN กด “เริ่มสร้าง App กับ Codex” แล้วกด “คัดลอก Prompt เปิดงาน”',
    'กลับไปที่ Codex วาง Prompt ใน Task แล้วส่ง โดยไม่ต้องแนบไฟล์ซ้ำ',
    'ตรวจสรุปความเข้าใจ และตอบเฉพาะ Product decision ที่ยังขาดจริง',
    'ให้ Codex ตรวจ SHA-256 สร้าง App และเปรียบเทียบกับ Approved Prototype ทีละหน้าจอทั้ง Mobile และ Desktop',
    'ตรวจ PROTOTYPE_CONFORMANCE.md แล้วจึงให้ Codex สร้าง Repository และ Publish ผ่าน GitHub Pages',
  ] : [
    'Start a new task inside the local project',
    'Return to CODESIGN, select “Start building with Codex,” then copy the starting prompt',
    'Return to Codex, paste and send the prompt without attaching the files again',
    'Ask Codex to summarize and flag only genuine product-decision gaps',
    'Let Codex verify SHA-256, build the app, and compare every screen with the Approved Prototype on mobile and desktop',
    'Review PROTOTYPE_CONFORMANCE.md, then let Codex create the repository and publish through GitHub Pages',
  ]

  return (
    <JourneyLayout project={project} phase="I" phaseName="IMPLEMENT" chatContext={draft.values} saveState={draft.saveState} completionItems={visibleRequirementKeys.map((key) => ({ label: completionRequirementLabels[key], complete: implementationReadiness.requirements[key] }))}>
      <PhaseSection step="I1" title={isThai ? 'ทำความเข้าใจ GitHub แบบง่าย ๆ' : 'GITHUB IN PLAIN LANGUAGE'} description={isThai ? 'สิ่งที่ต้องรู้ก่อนเริ่มมีเพียงหน้าที่ของเครื่องมือแต่ละชิ้น' : 'Before starting, you only need to understand what each tool does.'}>
        <div className="github-basics">
          <article><Github size={29} /><strong>GITHUB</strong><p>{isThai ? 'บ้านออนไลน์ของไฟล์ App และประวัติการเปลี่ยนแปลง' : 'The online home for app files and change history.'}</p></article>
          <article><span aria-hidden="true">R</span><strong>REPOSITORY</strong><p>{isThai ? 'Folder หลักของหนึ่งโครงการบน GitHub' : 'The main project folder on GitHub.'}</p></article>
          <article><ExternalLink size={29} /><strong>GITHUB PAGES</strong><p>{isThai ? 'บริการที่นำไฟล์ใน Repository ไปเปิดเป็น Public URL' : 'The service that publishes repository files at a public URL.'}</p></article>
        </div>
        <div className="security-boundary"><ShieldCheck size={22} /><p>{isThai ? 'Codex ช่วยนำทางและทำขั้นตอนทางเทคนิคได้ แต่คุณต้องกรอก Password, OTP, CAPTCHA และยืนยันความปลอดภัยด้วยตัวเอง ห้ามส่งข้อมูลเหล่านี้ให้ AI' : 'Codex can guide and perform technical steps, but you must enter passwords, OTPs, CAPTCHAs, and security confirmations yourself. Never send them to AI.'}</p></div>
      </PhaseSection>

      <PhaseSection step="I2" title={isThai ? 'ความพร้อมในการใช้ GitHub' : 'YOUR GITHUB STARTING POINT'} description={isThai ? 'เลือกข้อที่ตรงที่สุด ไม่มีคำตอบไหนทำให้เริ่มสร้างไม่ได้' : 'Choose the closest match. None of these prevents you from building.'}>
        <div className="github-readiness-options">
          {readinessChoices.map((choice) => (
            <label key={choice.value} className={readiness === choice.value ? 'is-active' : ''}>
              <input type="radio" name="github-readiness" checked={readiness === choice.value} onChange={() => { draft.setField('githubReadiness', choice.value); resetAlignment() }} />
              <Check size={19} />
              <span><strong>{choice.title}</strong><small>{choice.description}</small></span>
            </label>
          ))}
        </div>
      </PhaseSection>

      <PhaseSection step="I3" title={isThai ? 'ประกอบชุด 5 ไฟล์สำหรับ Codex' : 'ASSEMBLE THE FIVE-FILE CODEX PACKAGE'} description={isThai ? 'สามไฟล์แรกคือ Final PRD ตามด้วย Approved Prototype ที่ตรวจ SHA-256 แล้ว และ START_WITH_CODEX.md ซึ่งกำหนด Authority กับขั้นตรวจ Conformance' : 'The package combines the three Final PRD files, the SHA-256-verified Approved Prototype, and START_WITH_CODEX.md with authority and conformance rules.'}>
        {(snapshot.isLoading || prdEntries.isLoading || specifyEntries.isLoading || prototypeIntegrity === 'checking') ? <p>{isThai ? 'กำลังโหลดไฟล์ที่ Lock ไว้และตรวจ SHA-256…' : 'LOADING LOCKED FILES AND VERIFYING SHA-256…'}</p> : null}
        {packageLoadError ? <p className="field-error" role="alert">{isThai ? 'โหลดชุดไฟล์หลักไม่ครบ กรุณากลับไปตรวจ PRD ก่อนส่งต่อ' : 'THE LOCKED SOURCE PACKAGE COULD NOT BE LOADED COMPLETELY.'}</p> : null}
        <div className="codex-folder-plan">
          <dl className="codex-project-terms">
            <div><dt>FOLDER</dt><dd>{isThai ? 'ที่เก็บไฟล์และ App จริงในเครื่องของคุณ' : 'Where the files and app live on your computer'}</dd></div>
            <div><dt>LOCAL PROJECT</dt><dd>{isThai ? 'การเปิด Folder ให้ Codex อ่านและแก้ไขไฟล์ได้' : 'Gives Codex access to read and change that folder'}</dd></div>
            <div><dt>TASK</dt><dd>{isThai ? 'บทสนทนาที่คุณส่ง Prompt เพื่อเริ่มสร้าง App' : 'The conversation where you paste the prompt to start building'}</dd></div>
          </dl>
          <div className="codex-folder-plan__name">
            <div>
              <span>{isThai ? 'ชื่อ Folder แนะนำ' : 'SUGGESTED FOLDER NAME'}</span>
              <code>{suggestedFolderName}</code>
            </div>
            <button type="button" onClick={copySuggestedFolderName}>
              {folderCopyState === 'copied' ? <Check size={17} /> : <Copy size={17} />}
              {folderCopyState === 'copied'
                ? (isThai ? 'คัดลอกแล้ว' : 'COPIED')
                : folderCopyState === 'failed'
                  ? (isThai ? 'คัดลอกไม่สำเร็จ' : 'COPY FAILED')
                  : (isThai ? 'คัดลอกชื่อแนะนำ' : 'COPY SUGGESTION')}
            </button>
          </div>
          <p><strong>{isThai ? 'ชื่อ Folder เปลี่ยนได้' : 'THE FOLDER NAME IS FLEXIBLE'}</strong>{isThai ? ' ใช้ชื่ออะไรก็ได้ที่จำง่ายและเหมาะกับ App ของคุณ แต่กรุณาคงชื่อไฟล์ทั้ง 5 ฉบับด้านล่างไว้ตามเดิม' : ' Use any memorable name that fits your app, but keep the five filenames below unchanged.'}</p>
        </div>
        <div className="implement-package-grid" aria-label={isThai ? 'ชุดไฟล์สำหรับ Codex' : 'Codex package files'}>
          {packageFiles.map((file) => <div key={file.fileName} className={selectedPackageFile === file.fileName ? 'is-active' : ''}>
            <button type="button" className="implement-package-grid__preview" onClick={() => setSelectedPackageFile(file.fileName)}><FileCode2 size={20} /><span><strong>{file.fileName}</strong><small>{file.description}</small></span></button>
            <button type="button" className="implement-package-grid__download" disabled={file.kind === 'prototype' ? !file.artifact || prototypeIntegrity !== 'valid' : !file.content.trim()} aria-label={`${isThai ? 'ดาวน์โหลด' : 'Download'} ${file.fileName}`} onClick={() => downloadPackageFile(file)}><Download size={19} /></button>
          </div>)}
        </div>
        <div className="implement-package-preview">
          <h3>{activePackageFile.fileName}</h3>
          {activePackageFile.kind === 'prototype'
            ? activePackageFile.artifact
              ? <div className="security-boundary"><ShieldCheck size={22} /><p><strong>{prototypeIntegrity === 'valid' ? (isThai ? 'ยืนยันตัวตนแล้ว' : 'IDENTITY VERIFIED') : prototypeIntegrity === 'invalid' ? (isThai ? 'ข้อมูลไฟล์ไม่ตรงกับ SHA-256' : 'STORED BYTES FAILED SHA-256') : (isThai ? 'กำลังตรวจ SHA-256…' : 'VERIFYING SHA-256…')}</strong><br />{activePackageFile.artifact.originalFileName} · {activePackageFile.artifact.sizeBytes.toLocaleString()} bytes<br /><code>SHA-256 {activePackageFile.artifact.sha256}</code><br />{isThai ? 'CODESIGN ไม่รัน HTML นี้ในหน้า App ไฟล์จะถูกส่งให้ Codex เป็น Visual/Interaction Reference เท่านั้น' : 'CODESIGN does not execute this HTML in the app. It is handed to Codex only as the visual and interaction reference.'}</p></div>
              : <p className="field-error">{isThai ? 'ไม่พบ Approved Prototype ที่ Lock ไว้' : 'THE LOCKED APPROVED PROTOTYPE IS MISSING.'}</p>
            : <MarkdownPreview markdown={activePackageFile.content} />}
        </div>
        {feedback ? <div className="codex-handoff-actions"><span role="status">{feedback}</span></div> : null}
        <div className="implementation-guide">
          <section>
            <h3>{isThai ? 'ก่อนเปิด Codex' : 'BEFORE OPENING CODEX'}</h3>
            <ol className="implementation-steps">
              {folderSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
            </ol>
          </section>
          <section>
            <h3>{isThai ? 'เริ่มงานใน Codex' : 'START WORKING IN CODEX'}</h3>
            <ol className="implementation-steps">
              {codexSteps.map((step, index) => <li key={step}><span>{String(index + folderSteps.length + 1).padStart(2, '0')}</span>{step}</li>)}
            </ol>
          </section>
        </div>
        <p className="codex-repository-note">{isThai ? 'ยังไม่ต้องสร้าง Repository เองในตอนนี้ Codex จะพาทำหลังจากคุณตรวจ Preview แล้ว' : 'You do not need to create a repository yet. Codex will guide you after you review the preview.'}</p>
      </PhaseSection>

      <PhaseSection step="I4" title={isThai ? 'บันทึกแอปที่ใช้งานได้จริง' : 'RECORD THE WORKING BUILD'} description={isThai ? 'กลับมาหลังจากตรวจ App และ PROTOTYPE_CONFORMANCE.md แล้ว บันทึก Public URL เมื่อไม่มี Material mismatch ค้างอยู่' : 'Return after reviewing the app and PROTOTYPE_CONFORMANCE.md. Record the public URL only when no material mismatch remains.'}>
        <label className={draft.values.workingApp ? 'build-confirm is-active' : 'build-confirm'}>
          <input type="checkbox" checked={Boolean(draft.values.workingApp)} onChange={(event) => { draft.setField('workingApp', event.target.checked); resetAlignment() }} />
          <Check size={20} /> {isThai ? 'ฉันทดสอบเส้นทางหลัก ตรวจ PROTOTYPE_CONFORMANCE.md แล้ว App ใช้งานได้และไม่มี Material mismatch ค้างอยู่' : 'I TESTED THE PRIMARY JOURNEY, REVIEWED PROTOTYPE_CONFORMANCE.md, AND NO MATERIAL MISMATCH REMAINS'}
        </label>
        <FormField label={isThai ? 'URL สาธารณะของ App' : 'PUBLIC APP URL'} required><input type="url" value={String(draft.values.appUrl)} onChange={(event) => { draft.setField('appUrl', event.target.value); resetAlignment() }} placeholder="https://username.github.io/project/" /></FormField>
        <p className="repository-privacy-note">{isThai ? 'เพื่อความเป็นส่วนตัว CODESIGN จะไม่ขอและไม่บันทึก URL ของ GitHub Repository' : 'For privacy, CODESIGN does not request or store the GitHub repository URL.'}</p>
      </PhaseSection>

      <CrossStepAlignment
        step="I5"
        sourceStep="PRD"
        targetStep="I"
        loading={snapshot.isLoading || prdEntries.isLoading || specifyEntries.isLoading}
        loadError={packageLoadError}
        items={[
          { label: isThai ? 'ชุดส่งต่องานที่ใช้สร้าง' : 'SOURCE PACKAGE', value: [`PRD v${snapshot.data?.version ?? '—'}`, 'CODESIGN_HANDOFF.md', 'CONTENT_PACK.md', 'EXPERIENCE_DIRECTION.md', 'APPROVED_PROTOTYPE.html', 'START_WITH_CODEX.md'] },
          { label: isThai ? 'ผลการตรวจ PRD' : 'PRD REVIEW RESULT', value: String(prdReviewOutcome ?? '') },
          { label: isThai ? 'หลักฐานการสร้าง' : 'BUILD EVIDENCE', value: [String(draft.values.appUrl).trim(), draft.values.workingApp ? 'PROTOTYPE_CONFORMANCE.md · NO MATERIAL MISMATCH CONFIRMED' : 'BUILD AND CONFORMANCE NOT CONFIRMED'].filter(Boolean) },
        ]}
        status={alignmentStatus}
        note={alignmentNote}
        confirmed={Boolean(draft.values.alignmentConfirmed)}
        revisionAction={<div className="alignment-revision-links"><Link to={`/projects/${project.id}/PRD`}>PRD</Link><Link to={`/projects/${project.id}/S`}>STEP S</Link><Link to={`/projects/${project.id}/E`}>STEP E</Link></div>}
        onStatusChange={(status) => { draft.setField('alignmentStatus', status); draft.setField('alignmentConfirmed', false) }}
        onNoteChange={(note) => { draft.setField('alignmentNote', note); resetAlignment() }}
        onConfirmedChange={(confirmed) => draft.setField('alignmentConfirmed', confirmed)}
      />

      <ReviewGate title={isThai ? 'ตรวจสอบแอปที่สร้าง' : 'BUILD CHECK'} question={isThai ? 'App ทำงานจาก Public URL และผ่านการทดสอบเส้นทางหลักแล้วหรือยัง?' : 'Does the app work from its public URL and pass the primary-journey test?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? (isThai ? 'กำลังบันทึก…' : 'SAVING…') : (isThai ? 'ไปต่อสู่ Feedback' : 'CONTINUE TO FEEDBACK')} <ArrowRight size={18} /></ArcadeButton>}>
        <p>{ready ? (isThai ? 'ข้อมูลครบแล้ว พร้อมบันทึก Build และไปต่อสู่ Feedback' : 'Everything is complete. Save the build and continue to feedback.') : (isThai ? 'ปุ่มจะเปิดเมื่อรายการด้านล่างครบ โดยไม่ขึ้นกับการโหลดไฟล์เบื้องหลังซ้ำ' : 'The button unlocks when the visible requirements below are complete; it does not depend on reloading the source files.')}</p>
        <ul className="implementation-completion-checklist" aria-live="polite">
          {visibleRequirementKeys.map((key) => {
            const complete = implementationReadiness.requirements[key]
            return <li key={key} className={complete ? 'is-complete' : 'is-incomplete'}><Check size={18} aria-hidden="true" /><span>{completionRequirementLabels[key]}</span></li>
          })}
        </ul>
        {completion.isError ? <p className="field-error" role="alert">บันทึก Build ไม่สำเร็จ กรุณาลองอีกครั้ง</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
