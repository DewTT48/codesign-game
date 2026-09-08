import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Clipboard, Download, ExternalLink, FileCode2, Github, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completeImplementation, getLatestPrdSnapshot, getPhaseEntries } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { assembleStartWithCodex, type GitHubReadiness } from '../prd/handoffFiles'
import { MarkdownPreview } from '../prd/MarkdownPreview'
import { usePhaseDraft } from '../usePhaseDraft'

const initialImplement = { githubReadiness: 'unsure', workingApp: false, appUrl: '', repositoryUrl: '' }

export function ImplementPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'I', initialValues: initialImplement })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState('')
  const [selectedPackageFile, setSelectedPackageFile] = useState('START_WITH_CODEX.md')
  const snapshot = useQuery({ queryKey: ['prd-snapshot', project.id], queryFn: () => getLatestPrdSnapshot(project.id) })
  const prdEntries = useQuery({ queryKey: ['phase-entries', project.id, 'PRD'], queryFn: () => getPhaseEntries(project.id, 'PRD') })
  const readiness = String(draft.values.githubReadiness) as GitHubReadiness
  const startWithCodex = assembleStartWithCodex(project, readiness)
  const ready = Boolean(draft.values.workingApp && String(draft.values.appUrl).trim() && String(draft.values.repositoryUrl).trim())
  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      return completeImplementation({
        projectId: project.id,
        appUrl: String(draft.values.appUrl),
        repositoryUrl: String(draft.values.repositoryUrl),
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
  const packageFiles = [
    { fileName: 'CODESIGN_HANDOFF.md', description: isThai ? 'Product decisions และขอบเขตงานที่ Lock แล้ว' : 'Locked product decisions and scope', content: snapshot.data?.markdown_content || fallbackEntry('markdownDraft') },
    { fileName: 'CONTENT_PACK.md', description: isThai ? 'เนื้อหา แบบฝึก และการบันทึกครบ 21 วัน' : 'All 21 days of content, exercises, and records', content: snapshot.data?.content_pack || fallbackEntry('contentPackDraft') },
    { fileName: 'EXPERIENCE_DIRECTION.md', description: isThai ? 'Theme และแนวทางกำกับประสบการณ์' : 'Theme and experience guardrails', content: snapshot.data?.experience_direction || fallbackEntry('experienceDirectionDraft') },
    { fileName: 'START_WITH_CODEX.md', description: isThai ? 'คำสั่งเริ่มงานที่ปรับตามความพร้อม GitHub ของคุณ' : 'Starting brief adapted to your GitHub readiness', content: startWithCodex },
  ]
  const activePackageFile = packageFiles.find((file) => file.fileName === selectedPackageFile) ?? packageFiles[3]
  const packageReady = packageFiles.every((file) => file.content.trim())

  const downloadPackageFile = (fileName: string, content: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
    setFeedback(isThai ? `ดาวน์โหลด ${fileName} แล้ว` : `${fileName} DOWNLOADED`)
  }

  const copyCodexGuide = async () => {
    try {
      await navigator.clipboard.writeText(startWithCodex)
      setFeedback(isThai ? 'คัดลอกคำสั่งเริ่มงานกับ Codex แล้ว' : 'CODEX STARTING BRIEF COPIED')
    } catch {
      setFeedback(isThai ? 'คัดลอกไม่สำเร็จ — กรุณาดาวน์โหลดไฟล์แทน' : 'COPY FAILED — DOWNLOAD THE FILE INSTEAD')
    }
  }

  const readinessChoices: Array<{ value: GitHubReadiness; title: string; description: string }> = [
    { value: 'ready', title: isThai ? 'มีบัญชี GitHub และเข้าใช้ได้' : 'I HAVE A GITHUB ACCOUNT', description: isThai ? 'Codex จะพาสร้าง Repository และตั้งค่า Publish' : 'Codex will guide repository creation and publishing.' },
    { value: 'need-account', title: isThai ? 'ยังไม่มีบัญชี GitHub' : 'I NEED AN ACCOUNT', description: isThai ? 'Codex จะอธิบายและพาเปิดบัญชีทีละขั้น' : 'Codex will explain and guide account setup.' },
    { value: 'unsure', title: isThai ? 'ไม่แน่ใจ หรือไม่เคยใช้' : 'I AM NOT SURE', description: isThai ? 'Codex จะเริ่มจากตรวจความพร้อมและอธิบายคำสำคัญ' : 'Codex will check readiness and explain the key terms first.' },
  ]

  const steps = isThai ? [
    'เปิด Codex แล้วแนบไฟล์ Handoff ทั้ง 4 ไฟล์',
    'ให้ Codex สรุปความเข้าใจและชี้เฉพาะ Product decision ที่ยังขาดจริง',
    'ให้ Codex สร้าง App และแสดง Preview เพื่อให้คุณตรวจ',
    'แก้ปัญหาการใช้งานและทดสอบ Desktop, Tablet และ Mobile',
    'ให้ Codex สร้าง Repository และ Publish ผ่าน GitHub Pages',
  ] : [
    'Open Codex and attach all four handoff files',
    'Ask Codex to summarize and flag only genuine product-decision gaps',
    'Let Codex build the app and show a preview for your review',
    'Fix usage issues and test desktop, tablet, and mobile',
    'Let Codex create the repository and publish through GitHub Pages',
  ]

  return (
    <JourneyLayout project={project} phase="I" phaseName="IMPLEMENT" chatContext={draft.values} saveState={draft.saveState}>
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
              <input type="radio" name="github-readiness" checked={readiness === choice.value} onChange={() => draft.setField('githubReadiness', choice.value)} />
              <Check size={19} />
              <span><strong>{choice.title}</strong><small>{choice.description}</small></span>
            </label>
          ))}
        </div>
      </PhaseSection>

      <PhaseSection step="I3" title={isThai ? 'ประกอบชุด 4 ไฟล์สำหรับ Codex' : 'ASSEMBLE THE FOUR-FILE CODEX PACKAGE'} description={isThai ? 'สามไฟล์แรกคือ Snapshot ที่ Lock จาก PRD ส่วน START_WITH_CODEX.md ถูกสร้างในขั้นนี้ตามความพร้อม GitHub ที่คุณเลือก' : 'The first three files are the locked PRD snapshot. START_WITH_CODEX.md is generated here from your GitHub readiness.'}>
        {(snapshot.isLoading || prdEntries.isLoading) ? <p>{isThai ? 'กำลังโหลดไฟล์ที่ Lock ไว้…' : 'LOADING LOCKED FILES…'}</p> : null}
        {(snapshot.isError || prdEntries.isError || !packageReady) ? <p className="field-error" role="alert">{isThai ? 'โหลดชุดไฟล์หลักไม่ครบ กรุณากลับไปตรวจ PRD ก่อนส่งต่อ' : 'THE LOCKED SOURCE PACKAGE COULD NOT BE LOADED COMPLETELY.'}</p> : null}
        <div className="implement-package-grid" aria-label={isThai ? 'ชุดไฟล์สำหรับ Codex' : 'Codex package files'}>
          {packageFiles.map((file) => <div key={file.fileName} className={selectedPackageFile === file.fileName ? 'is-active' : ''}>
            <button type="button" className="implement-package-grid__preview" onClick={() => setSelectedPackageFile(file.fileName)}><FileCode2 size={20} /><span><strong>{file.fileName}</strong><small>{file.description}</small></span></button>
            <button type="button" className="implement-package-grid__download" disabled={!file.content.trim()} aria-label={`${isThai ? 'ดาวน์โหลด' : 'Download'} ${file.fileName}`} onClick={() => downloadPackageFile(file.fileName, file.content)}><Download size={19} /></button>
          </div>)}
        </div>
        <div className="implement-package-preview">
          <h3>{activePackageFile.fileName}</h3>
          <MarkdownPreview markdown={activePackageFile.content} />
        </div>
        <div className="codex-handoff-actions">
          <button type="button" onClick={() => void copyCodexGuide()}><Clipboard size={19} /> {isThai ? 'คัดลอกคำสั่งเริ่มงาน' : 'COPY STARTING BRIEF'}</button>
          {feedback ? <span role="status">{feedback}</span> : null}
        </div>
        <ol className="implementation-steps">
          {steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
        </ol>
      </PhaseSection>

      <PhaseSection step="I4" title={isThai ? 'บันทึกแอปที่ใช้งานได้จริง' : 'RECORD THE WORKING BUILD'} description={isThai ? 'กลับมาบันทึก URL หลังจาก Codex สร้าง ทดสอบ และ Publish สำเร็จ' : 'Return after Codex has built, tested, and published the app.'}>
        <label className={draft.values.workingApp ? 'build-confirm is-active' : 'build-confirm'}>
          <input type="checkbox" checked={Boolean(draft.values.workingApp)} onChange={(event) => draft.setField('workingApp', event.target.checked)} />
          <Check size={20} /> {isThai ? 'ฉันทดสอบเส้นทางหลักแล้ว และ App ใช้งานได้จริง' : 'I TESTED THE PRIMARY JOURNEY AND THE APP WORKS'}
        </label>
        <div className="form-grid form-grid--two">
          <FormField label={isThai ? 'URL สาธารณะของ App' : 'PUBLIC APP URL'} required><input type="url" value={String(draft.values.appUrl)} onChange={(event) => draft.setField('appUrl', event.target.value)} placeholder="https://username.github.io/project/" /></FormField>
          <FormField label={isThai ? 'URL ของ GitHub Repository' : 'GITHUB REPOSITORY URL'} required><input type="url" value={String(draft.values.repositoryUrl)} onChange={(event) => draft.setField('repositoryUrl', event.target.value)} placeholder="https://github.com/username/project" /></FormField>
        </div>
      </PhaseSection>

      <ReviewGate title={isThai ? 'ตรวจสอบแอปที่สร้าง' : 'BUILD CHECK'} question={isThai ? 'App ทำงานจาก Public URL และมี Repository ที่กลับมาแก้ไขต่อได้หรือยัง?' : 'Does the app work from its public URL, with a repository you can continue editing?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>{isThai ? 'ทดสอบแอป' : 'TEST THE BUILD'} <ArrowRight size={18} /></ArcadeButton>}>
        <p>{isThai ? 'ต้องยืนยันว่า App ใช้งานได้ และบันทึกทั้ง Public URL กับ Repository URL ก่อนเข้าสู่ Feedback' : 'Confirm the working app and record both the public and repository URLs before feedback.'}</p>
        {completion.isError ? <p className="field-error" role="alert">บันทึก Build ไม่สำเร็จ กรุณาลองอีกครั้ง</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
