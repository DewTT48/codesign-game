import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Clipboard, Download, ExternalLink, Github, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completeImplementation } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { assembleStartWithCodex, type GitHubReadiness } from '../prd/handoffFiles'
import { usePhaseDraft } from '../usePhaseDraft'

const initialImplement = { githubReadiness: 'unsure', workingApp: false, appUrl: '', repositoryUrl: '' }

export function ImplementPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'I', initialValues: initialImplement })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState('')
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

  const downloadCodexGuide = () => {
    const url = URL.createObjectURL(new Blob([startWithCodex], { type: 'text/markdown;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'START_WITH_CODEX.md'
    anchor.click()
    URL.revokeObjectURL(url)
    setFeedback('START_WITH_CODEX.md DOWNLOADED')
  }

  const copyCodexGuide = async () => {
    try {
      await navigator.clipboard.writeText(startWithCodex)
      setFeedback('CODEX STARTING BRIEF COPIED')
    } catch {
      setFeedback('COPY FAILED — DOWNLOAD THE FILE INSTEAD')
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
      <PhaseSection step="I1" title="GITHUB IN PLAIN LANGUAGE" description={isThai ? 'สิ่งที่ต้องรู้ก่อนเริ่มมีเพียงหน้าที่ของเครื่องมือแต่ละชิ้น' : 'Before starting, you only need to understand what each tool does.'}>
        <div className="github-basics">
          <article><Github size={29} /><strong>GITHUB</strong><p>{isThai ? 'บ้านออนไลน์ของไฟล์ App และประวัติการเปลี่ยนแปลง' : 'The online home for app files and change history.'}</p></article>
          <article><span aria-hidden="true">R</span><strong>REPOSITORY</strong><p>{isThai ? 'Folder หลักของหนึ่งโครงการบน GitHub' : 'The main project folder on GitHub.'}</p></article>
          <article><ExternalLink size={29} /><strong>GITHUB PAGES</strong><p>{isThai ? 'บริการที่นำไฟล์ใน Repository ไปเปิดเป็น Public URL' : 'The service that publishes repository files at a public URL.'}</p></article>
        </div>
        <div className="security-boundary"><ShieldCheck size={22} /><p>{isThai ? 'Codex ช่วยนำทางและทำขั้นตอนทางเทคนิคได้ แต่คุณต้องกรอก Password, OTP, CAPTCHA และยืนยันความปลอดภัยด้วยตัวเอง ห้ามส่งข้อมูลเหล่านี้ให้ AI' : 'Codex can guide and perform technical steps, but you must enter passwords, OTPs, CAPTCHAs, and security confirmations yourself. Never send them to AI.'}</p></div>
      </PhaseSection>

      <PhaseSection step="I2" title="YOUR GITHUB STARTING POINT" description={isThai ? 'เลือกข้อที่ตรงที่สุด ไม่มีคำตอบไหนทำให้เริ่มสร้างไม่ได้' : 'Choose the closest match. None of these prevents you from building.'}>
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

      <PhaseSection step="I3" title="HANDOFF TO CODEX" description={isThai ? 'ไฟล์เริ่มงานจะปรับคำแนะนำ GitHub ตามความพร้อมที่คุณเลือก' : 'The starting brief adapts its GitHub guidance to your selected readiness.'}>
        <div className="codex-handoff-actions">
          <button type="button" onClick={downloadCodexGuide}><Download size={19} /> DOWNLOAD START_WITH_CODEX.md</button>
          <button type="button" onClick={() => void copyCodexGuide()}><Clipboard size={19} /> COPY STARTING BRIEF</button>
          {feedback ? <span role="status">{feedback}</span> : null}
        </div>
        <ol className="implementation-steps">
          {steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
        </ol>
      </PhaseSection>

      <PhaseSection step="I4" title="RECORD THE WORKING BUILD" description={isThai ? 'กลับมาบันทึก URL หลังจาก Codex สร้าง ทดสอบ และ Publish สำเร็จ' : 'Return after Codex has built, tested, and published the app.'}>
        <label className={draft.values.workingApp ? 'build-confirm is-active' : 'build-confirm'}>
          <input type="checkbox" checked={Boolean(draft.values.workingApp)} onChange={(event) => draft.setField('workingApp', event.target.checked)} />
          <Check size={20} /> {isThai ? 'ฉันทดสอบเส้นทางหลักแล้ว และ App ใช้งานได้จริง' : 'I TESTED THE PRIMARY JOURNEY AND THE APP WORKS'}
        </label>
        <div className="form-grid form-grid--two">
          <FormField label="PUBLIC APP URL" required><input type="url" value={String(draft.values.appUrl)} onChange={(event) => draft.setField('appUrl', event.target.value)} placeholder="https://username.github.io/project/" /></FormField>
          <FormField label="GITHUB REPOSITORY URL" required><input type="url" value={String(draft.values.repositoryUrl)} onChange={(event) => draft.setField('repositoryUrl', event.target.value)} placeholder="https://github.com/username/project" /></FormField>
        </div>
      </PhaseSection>

      <ReviewGate title="BUILD CHECK" question={isThai ? 'App ทำงานจาก Public URL และมี Repository ที่กลับมาแก้ไขต่อได้หรือยัง?' : 'Does the app work from its public URL, with a repository you can continue editing?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>TEST THE BUILD <ArrowRight size={18} /></ArcadeButton>}>
        <p>{isThai ? 'ต้องยืนยันว่า App ใช้งานได้ และบันทึกทั้ง Public URL กับ Repository URL ก่อนเข้าสู่ Feedback' : 'Confirm the working app and record both the public and repository URLs before feedback.'}</p>
        {completion.isError ? <p className="field-error" role="alert">บันทึก Build ไม่สำเร็จ กรุณาลองอีกครั้ง</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
