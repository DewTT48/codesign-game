import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  LockKeyhole,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../lib/supabase/database.types'
import { useLanguage } from '../i18n/LanguageContext'
import { savePhaseEntry, startPhaseRevision } from '../journey/journey.service'
import { PhaseSection, ReviewGate } from '../journey/PhaseFormComponents'
import { UiReviewWorkspace } from '../journey/prd/UiReviewWorkspace'
import { assembleOwnUiBrief } from '../journey/prd/uiReview'
import { usePhaseDraft } from '../journey/usePhaseDraft'
import {
  CodesignAiError,
  createAiIdempotencyKey,
  getAiUsageSummary,
  getPendingAiProposal,
  invokeCodesignAi,
  reviewAiProposal,
  type AiProposalView,
} from './ai/codesignAi.service'
import type { AiProposalEnvelope } from './ai/aiProposal.schemas'
import { completeOwnJourneyPhase } from './ownJourney.service'
import {
  getOwnJourneyInitialValues,
  nextOwnJourneyPhase,
  ownJourneyDefinitions,
  ownJourneyPhases,
  validateOwnJourneyValues,
  type OwnJourneyPhase,
} from './ownJourneyContent'

function localizedText(value: { th: string; en: string }, isThai: boolean) {
  return isThai ? value.th : value.en
}

function aiErrorMessage(error: unknown, isThai: boolean) {
  const code = error instanceof CodesignAiError ? error.code : ''
  const messages: Record<string, { th: string; en: string }> = {
    AI_ALLOWANCE_REQUIRED: { th: 'Admin ยังไม่ได้เปิด AI test allowance ให้ Project นี้', en: 'An admin has not enabled the AI test allowance for this project.' },
    AI_ALLOWANCE_EXHAUSTED: { th: 'Project นี้ใช้ AI allowance ครบแล้ว', en: 'This project has exhausted its AI allowance.' },
    AI_LIMIT_REACHED: { th: 'คำขอนี้จะเกินขีดจำกัด AI ของ Project', en: 'This request would exceed the project AI limit.' },
    AI_REQUEST_IN_PROGRESS: { th: 'มี AI request ของ Project นี้กำลังทำงานอยู่', en: 'Another AI request is already active for this project.' },
    AI_RECONCILIATION_REQUIRED: { th: 'ผลลัพธ์ยังไม่แน่นอน ระบบหยุดเพื่อป้องกันการคิดซ้ำ กรุณาให้ Admin ตรวจสอบ', en: 'The result is uncertain. The system stopped to prevent duplicate spend; ask an admin to review it.' },
    AUTH_REQUIRED: { th: 'กรุณาเข้าสู่ระบบใหม่ก่อนใช้ AI', en: 'Please sign in again before using AI.' },
    PROJECT_ACCESS_DENIED: { th: 'บัญชีนี้ไม่มีสิทธิ์ใช้ AI กับ Project นี้', en: 'This account cannot use AI for this project.' },
  }
  const known = messages[code]
  if (known) return localizedText(known, isThai)
  return error instanceof Error ? error.message : (isThai ? 'เรียก CODESIGN AI ไม่สำเร็จ' : 'CODESIGN AI request failed.')
}

function ProposalContent({ envelope, isThai }: { envelope: AiProposalEnvelope; isThai: boolean }) {
  if (envelope.action === 'frame_context') {
    return <>
      <p className="own-ai-proposal__lead">{envelope.proposal.framing}</p>
      <ProposalList title={isThai ? 'ช่องว่างของหลักฐาน' : 'EVIDENCE GAPS'} items={envelope.proposal.evidenceGaps} />
    </>
  }
  if (envelope.action === 'generate_options') {
    return <div className="own-ai-option-grid">{envelope.proposal.options.map((option, index) => (
      <article key={`${option.title}-${index}`}>
        <span>OPTION {String(index + 1).padStart(2, '0')}</span>
        <h4>{option.title}</h4>
        <p>{option.description}</p>
        <ProposalList title="TRADE-OFFS" items={option.tradeoffs} />
      </article>
    ))}</div>
  }
  if (envelope.action === 'challenge_assumptions') {
    return <div className="own-ai-assumption-list">{envelope.proposal.assumptions.map((assumption, index) => (
      <article key={`${assumption.statement}-${index}`}>
        <div><span>{assumption.status.toUpperCase()}</span><span>{assumption.impact.toUpperCase()} IMPACT</span></div>
        <h4>{assumption.statement}</h4>
        <p><strong>{isThai ? 'ถ้าผิด:' : 'FAILURE MODE:'}</strong> {assumption.failureMode}</p>
        <p><strong>{isThai ? 'คำถามถึงเจ้าของ:' : 'OWNER QUESTION:'}</strong> {assumption.ownerQuestion}</p>
      </article>
    ))}</div>
  }
  if (envelope.action === 'check_alignment') {
    return <>
      <p className="own-ai-proposal__lead">{envelope.proposal.summary}</p>
      {envelope.proposal.conflicts.length ? <div className="own-ai-conflict-list">
        {envelope.proposal.conflicts.map((conflict, index) => <article key={`${conflict.issue}-${index}`}>
          <span>{conflict.sourcePhase} → {conflict.targetPhase}</span>
          <p>{conflict.issue}</p>
          <small>{isThai ? `ย้อนตรวจ Step ${conflict.routeBackTo}` : `ROUTE BACK TO STEP ${conflict.routeBackTo}`}</small>
        </article>)}
      </div> : <p className="own-ai-aligned"><CheckCircle2 size={18} /> {isThai ? 'ไม่พบ Conflict ที่ต้องย้อนแก้' : 'NO CONFLICT REQUIRES A REVISION'}</p>}
    </>
  }
  return <pre className="own-ai-prd-preview">{envelope.proposal.markdown}</pre>
}

function ProposalList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return <section className="own-ai-list"><strong>{title}</strong><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>
}

function AiProposalPanel({
  project,
  phase,
  values,
  onAccepted,
  disabled,
}: {
  project: ProjectRow
  phase: OwnJourneyPhase
  values: Record<string, string>
  onAccepted: (content: Json) => Promise<void>
  disabled: boolean
}) {
  const { language, isThai } = useLanguage()
  const queryClient = useQueryClient()
  const definition = ownJourneyDefinitions[phase]
  const action = definition.aiAction!
  const [generatedProposal, setGeneratedProposal] = useState<AiProposalView | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')

  const usage = useQuery({
    queryKey: ['ai-usage', project.id],
    queryFn: () => getAiUsageSummary(project.id),
    retry: false,
  })
  const pendingProposal = useQuery({
    queryKey: ['ai-proposal', project.id, action],
    queryFn: () => getPendingAiProposal(project.id, action),
    retry: false,
  })
  const activeProposal = generatedProposal ?? pendingProposal.data ?? null

  const generation = useMutation({
    mutationFn: () => invokeCodesignAi({
      projectId: project.id,
      action,
      userDraft: values,
      locale: language,
      idempotencyKey: createAiIdempotencyKey(project.id, action),
    }),
    async onSuccess(result) {
      setGeneratedProposal(result.proposal)
      setEditing(false)
      setEditError('')
      await queryClient.invalidateQueries({ queryKey: ['ai-usage', project.id] })
    },
  })

  const review = useMutation({
    mutationFn: async (input: { action: 'accepted' | 'rejected'; content?: Json }) => {
      if (!activeProposal) throw new Error('No AI proposal is ready for review.')
      const result = await reviewAiProposal({
        proposalId: activeProposal.id,
        reviewAction: input.action,
        reviewContent: input.action === 'accepted' ? input.content ?? null : null,
      })
      if (input.action === 'accepted' && input.content) await onAccepted(input.content)
      return result
    },
    async onSuccess() {
      setGeneratedProposal(null)
      setEditing(false)
      setEditError('')
      await queryClient.invalidateQueries({ queryKey: ['ai-proposal', project.id, action] })
    },
  })

  const regeneration = useMutation({
    mutationFn: async () => {
      if (activeProposal) {
        await reviewAiProposal({ proposalId: activeProposal.id, reviewAction: 'rejected' })
      }
      return invokeCodesignAi({
        projectId: project.id,
        action,
        userDraft: values,
        locale: language,
        idempotencyKey: createAiIdempotencyKey(project.id, action),
      })
    },
    async onSuccess(result) {
      setGeneratedProposal(result.proposal)
      setEditing(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ai-proposal', project.id, action] }),
        queryClient.invalidateQueries({ queryKey: ['ai-usage', project.id] }),
      ])
    },
  })

  function startEditing() {
    if (!activeProposal) return
    setEditValue(JSON.stringify(activeProposal.envelope.proposal, null, 2))
    setEditing(true)
    setEditError('')
  }

  function acceptEdited() {
    try {
      const content = JSON.parse(editValue) as Json
      if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error()
      review.mutate({ action: 'accepted', content })
    } catch {
      setEditError(isThai ? 'รูปแบบ Structured draft ไม่ถูกต้อง กรุณาตรวจ JSON อีกครั้ง' : 'The structured draft is not valid JSON.')
    }
  }

  const enabled = usage.data?.status === 'enabled'
  const usedRequests = usage.data?.used_requests ?? 0
  const maxRequests = usage.data?.max_requests ?? 0
  const busy = generation.isPending || review.isPending || regeneration.isPending
  const error = generation.error ?? review.error ?? regeneration.error

  return (
    <section className="own-ai-panel" aria-labelledby={`ai-${phase}-title`}>
      <header>
        <div className="own-ai-panel__icon"><Bot aria-hidden="true" size={28} /></div>
        <div>
          <span>CODESIGN AI · PROPOSAL ONLY</span>
          <h2 id={`ai-${phase}-title`}>{localizedText(definition.aiTitle!, isThai)}</h2>
          <p>{localizedText(definition.aiDescription!, isThai)}</p>
        </div>
        <div className={`own-ai-allowance own-ai-allowance--${usage.data?.status ?? 'unknown'}`}>
          <ShieldCheck aria-hidden="true" size={17} />
          {usage.isLoading
            ? 'CHECKING…'
            : enabled
              ? `${usedRequests}/${maxRequests} REQUESTS USED`
              : isThai ? 'AI ยังไม่เปิด' : 'AI NOT ENABLED'}
        </div>
      </header>

      {!activeProposal ? (
        <div className="own-ai-start">
          <p>{isThai
            ? 'ระบบจะส่ง Draft ในหน้านี้พร้อม Decision ที่ Lock จากหน้าก่อนหน้า โดยไม่ส่ง API Key ไปยัง Browser'
            : 'The system sends this page draft plus prior locked decisions. The API key never reaches the browser.'}</p>
          <button type="button" disabled={disabled || !enabled || busy} onClick={() => generation.mutate()}>
            <Sparkles aria-hidden="true" size={18} />
            {generation.isPending
              ? (isThai ? 'AI กำลังวิเคราะห์…' : 'AI IS THINKING…')
              : (isThai ? 'สร้างข้อเสนอ AI' : 'GENERATE AI PROPOSAL')}
          </button>
          {!enabled && !usage.isLoading ? <small>{isThai
            ? 'กรอกและจบหน้านี้ได้ตามปกติ หากต้องการใช้ AI ให้ Admin เปิด Internal allowance ให้ Project ก่อน'
            : 'You can complete this page without AI. Ask an admin to enable the internal allowance to generate proposals.'}</small> : null}
        </div>
      ) : (
        <div className="own-ai-proposal">
          <div className="own-ai-proposal__status"><Circle size={12} fill="currentColor" /> {isThai ? 'รอการตัดสินใจจากคุณ' : 'AWAITING YOUR REVIEW'}</div>
          <ProposalContent envelope={activeProposal.envelope} isThai={isThai} />

          {activeProposal.envelope.questions.length ? <ProposalList title={isThai ? 'คำถามที่ควรตอบต่อ' : 'OWNER QUESTIONS'} items={activeProposal.envelope.questions} /> : null}
          {activeProposal.envelope.warnings.length ? <div className="own-ai-warnings">
            {activeProposal.envelope.warnings.map((warning) => <p key={`${warning.code}-${warning.message}`}><AlertTriangle size={17} /> {warning.message}</p>)}
          </div> : null}

          {editing ? <div className="own-ai-editor">
            <label htmlFor={`ai-edit-${phase}`}>{isThai ? 'แก้ไข Structured proposal ก่อน Accept' : 'EDIT THE STRUCTURED PROPOSAL BEFORE ACCEPTING'}</label>
            <p>{isThai ? 'แก้เฉพาะข้อความหรือรายการภายใน โดยคงเครื่องหมาย { } [ ] และชื่อ field เดิมไว้' : 'Edit text or list items while preserving the existing field names and JSON structure.'}</p>
            <textarea id={`ai-edit-${phase}`} spellCheck="false" value={editValue} onChange={(event) => setEditValue(event.target.value)} />
            {editError ? <span className="field-error" role="alert">{editError}</span> : null}
            <div>
              <button type="button" onClick={() => { setEditing(false); setEditError('') }}><X size={17} /> {isThai ? 'ยกเลิกแก้ไข' : 'CANCEL EDIT'}</button>
              <button type="button" disabled={review.isPending} onClick={acceptEdited}><Check size={17} /> {isThai ? 'Accept ฉบับแก้ไข' : 'ACCEPT EDITED VERSION'}</button>
            </div>
          </div> : <div className="own-ai-review-actions">
            <button type="button" disabled={busy} onClick={() => review.mutate({ action: 'rejected' })}><X size={17} /> {isThai ? 'ปฏิเสธ' : 'REJECT'}</button>
            <button type="button" disabled={busy} onClick={() => regeneration.mutate()}><RefreshCw size={17} /> {isThai ? 'สร้างใหม่' : 'REGENERATE'}</button>
            <button type="button" disabled={busy} onClick={startEditing}><PencilLine size={17} /> {isThai ? 'แก้ไขก่อน Accept' : 'EDIT & ACCEPT'}</button>
            <button className="is-accept" type="button" disabled={busy} onClick={() => review.mutate({ action: 'accepted', content: activeProposal.envelope.proposal as Json })}><Check size={17} /> {isThai ? 'Accept ข้อเสนอ' : 'ACCEPT PROPOSAL'}</button>
          </div>}
        </div>
      )}

      {error ? <p className="own-ai-error" role="alert"><AlertTriangle size={17} /> {aiErrorMessage(error, isThai)}</p> : null}
    </section>
  )
}

function OwnJourneyMap({ project, viewedPhase }: { project: ProjectRow; viewedPhase: OwnJourneyPhase }) {
  const { isThai } = useLanguage()
  const currentIndex = project.current_phase === 'COMPLETE'
    ? ownJourneyPhases.length
    : ownJourneyPhases.indexOf(project.current_phase as OwnJourneyPhase)

  return <nav className="own-journey-map" aria-label={isThai ? 'ขั้นตอน Build Your Own' : 'Build Your Own steps'}>
    {ownJourneyPhases.map((phase, index) => {
      const completed = index < currentIndex
      const active = phase === viewedPhase
      const available = completed || index === currentIndex
      const content: ReactNode = <>
        <span>{completed ? <Check size={15} /> : phase}</span>
        <small>{ownJourneyDefinitions[phase].name}</small>
      </>
      return available
        ? <Link className={`${completed ? 'is-complete' : ''} ${active ? 'is-active' : ''}`} key={phase} to={`/own-projects/${project.id}/${phase}`}>{content}</Link>
        : <span className="is-locked" key={phase}>{content}</span>
    })}
  </nav>
}

export function OwnJourneyPage({
  project,
  phase,
  readOnly = false,
}: {
  project: ProjectRow
  phase: OwnJourneyPhase
  readOnly?: boolean
}) {
  const { isThai } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const definition = ownJourneyDefinitions[phase]
  const nextPhase = nextOwnJourneyPhase(phase)
  const initialValues = useMemo(() => ({
    ...getOwnJourneyInitialValues(definition),
    ...(phase === 'PRD' ? {
      uiBriefDraft: '',
      uiReviewMarkdown: '',
      uiReviewApplied: '',
    } : {}),
  }), [definition, phase])
  const draft = usePhaseDraft<Record<string, string>>({
    projectId: project.id,
    phase,
    initialValues,
  })
  const [attempted, setAttempted] = useState(false)
  const [acceptedNotice, setAcceptedNotice] = useState(false)
  const [prdExportState, setPrdExportState] = useState<'idle' | 'copied' | 'downloaded' | 'failed'>('idle')
  const validationErrors = validateOwnJourneyValues(definition, draft.values)
  const errorByField = new Map(validationErrors.map((error) => [error.fieldKey, localizedText(error.message, isThai)]))
  const requiredFields = definition.sections.flatMap((section) => section.fields).filter((field) => field.required)
  const answeredRequired = requiredFields.filter((field) => (draft.values[field.key]?.trim().length ?? 0) >= field.minLength).length
  const ownUiBrief = phase === 'PRD'
    ? draft.values.uiBriefDraft?.trim() || assembleOwnUiBrief(project, draft.values.prdMarkdown ?? '')
    : ''
  const uiReviewReady = phase !== 'PRD' || draft.values.uiReviewApplied === 'yes'

  const completion = useMutation({
    mutationFn: async () => {
      setAttempted(true)
      if (validationErrors.length) throw new Error('VALIDATION_REQUIRED')
      if (!uiReviewReady) throw new Error('UI_REVIEW_REQUIRED')
      await draft.saveAll()
      return completeOwnJourneyPhase(project.id, phase)
    },
    async onSuccess(nextProject) {
      queryClient.setQueryData(['project', project.id], nextProject)
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate(nextPhase === 'COMPLETE'
        ? `/own-projects/${project.id}`
        : `/own-projects/${project.id}/${nextPhase}`)
    },
  })

  async function storeAcceptedAiProposal(content: Json) {
    await savePhaseEntry({
      projectId: project.id,
      phase,
      section: 'ai_review',
      fieldKey: 'accepted_ai_proposal',
      content,
    })
    if (
      phase === 'PRD'
      && content
      && typeof content === 'object'
      && !Array.isArray(content)
      && typeof content.markdown === 'string'
    ) {
      await draft.saveAll({
        prdMarkdown: content.markdown,
        uiBriefDraft: '',
        uiReviewMarkdown: '',
        uiReviewApplied: '',
      })
    }
    setAcceptedNotice(true)
  }

  async function copyPrd() {
    try {
      await navigator.clipboard.writeText(draft.values.prdMarkdown ?? '')
      setPrdExportState('copied')
    } catch {
      setPrdExportState('failed')
    }
    window.setTimeout(() => setPrdExportState('idle'), 1800)
  }

  function downloadPrd() {
    try {
      const blob = new Blob([draft.values.prdMarkdown ?? ''], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'PRODUCT_REQUIREMENTS.md'
      anchor.click()
      URL.revokeObjectURL(url)
      setPrdExportState('downloaded')
    } catch {
      setPrdExportState('failed')
    }
    window.setTimeout(() => setPrdExportState('idle'), 1800)
  }

  function complete() {
    setAttempted(true)
    if (validationErrors.length) {
      document.getElementById(`own-field-${validationErrors[0].fieldKey}`)?.focus()
      return
    }
    if (!uiReviewReady) {
      document.getElementById('own-ui-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    completion.mutate()
  }

  if (draft.loading) return <div className="route-loading" role="status">{isThai ? 'กำลังโหลด Draft…' : 'LOADING DRAFT…'}</div>

  return (
    <div className={`content-page own-journey-page own-journey-page--${phase.toLowerCase()}`}>
      <div className="journey-utility-row">
        <Link className="back-link" to="/dashboard"><ArrowLeft size={18} /> {isThai ? 'แดชบอร์ด' : 'DASHBOARD'}</Link>
        <span className={`save-indicator save-indicator--${draft.saveState}`}>
          {readOnly
            ? (isThai ? 'LOCKED DECISION' : 'LOCKED DECISION')
            : draft.saveState === 'saving'
              ? (isThai ? 'กำลังบันทึก…' : 'SAVING…')
              : draft.saveState === 'saved'
                ? (isThai ? 'บันทึกแล้ว' : 'SAVED')
                : draft.saveState === 'error'
                  ? (isThai ? 'บันทึกไม่สำเร็จ' : 'SAVE FAILED')
                  : (isThai ? 'Draft ยังไม่ Lock' : 'DRAFT NOT LOCKED')}
        </span>
      </div>

      <header className="own-journey-heading">
        <div className={`phase-token${phase.length > 1 ? ' phase-token--wide' : ''}`}>{phase}</div>
        <div>
          <span className="chapter-code">BUILD YOUR OWN · {definition.name}</span>
          <h1>{localizedText(definition.headline, isThai)}</h1>
          <p>{localizedText(definition.principle, isThai)}</p>
        </div>
      </header>

      <OwnJourneyMap project={project} viewedPhase={phase} />
      <div className="own-journey-status">
        <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
        <div>
          <span>{isThai ? 'ผลลัพธ์ของหน้านี้' : 'PAGE OUTCOME'}</span>
          <p>{localizedText(definition.outcome, isThai)}</p>
        </div>
      </div>

      {readOnly ? <aside className="own-readonly-banner"><LockKeyhole size={20} /><div><strong>{isThai ? 'หน้านี้ Lock แล้ว' : 'THIS PAGE IS LOCKED'}</strong><p>{isThai ? 'คุณกำลังดู Decision ที่ใช้เป็นบริบทของหน้าถัดไป' : 'You are viewing the decision used as context by later steps.'}</p></div></aside> : null}
      {draft.loadError ? <p className="field-error" role="alert">{isThai ? 'โหลด Draft ไม่สำเร็จ กรุณากลับ Dashboard แล้วลองใหม่' : 'Could not load the draft. Return to the dashboard and try again.'}</p> : null}

      {definition.sections.map((section, sectionIndex) => (
        <PhaseSection
          key={section.title.en}
          step={String(sectionIndex + 1).padStart(2, '0')}
          title={localizedText(section.title, isThai)}
          description={localizedText(section.description, isThai)}
        >
          <div className="own-field-grid">
            {section.fields.map((field) => <label className="own-field" key={field.key} htmlFor={`own-field-${field.key}`}>
              <span>{localizedText(field.label, isThai)} {field.required ? <em>{isThai ? 'จำเป็น' : 'REQUIRED'}</em> : <small>{isThai ? 'ไม่บังคับ' : 'OPTIONAL'}</small>}</span>
              <p>{localizedText(field.question, isThai)}</p>
              <textarea
                id={`own-field-${field.key}`}
                disabled={readOnly}
                rows={field.rows ?? 4}
                value={draft.values[field.key] ?? ''}
                placeholder={localizedText(field.placeholder, isThai)}
                aria-invalid={attempted && errorByField.has(field.key)}
                aria-describedby={attempted && errorByField.has(field.key) ? `own-error-${field.key}` : undefined}
                onChange={(event) => draft.setField(field.key, event.target.value)}
              />
              {attempted && errorByField.has(field.key) ? <span className="field-error" id={`own-error-${field.key}`} role="alert">{errorByField.get(field.key)}</span> : null}
            </label>)}
          </div>
        </PhaseSection>
      ))}

      {phase === 'PRD' ? <div className="own-prd-tools">
        <div><strong>{isThai ? 'PRD ฉบับปัจจุบัน' : 'CURRENT PRD'}</strong><p>{isThai ? 'ฉบับนี้ยังเป็น Draft จนกว่าจะผ่าน Prototype, UI Review และการตรวจ Final PRD' : 'This remains a draft until prototyping, UI Review, and final PRD review are complete.'}</p></div>
        <button type="button" disabled={!draft.values.prdMarkdown} onClick={() => void copyPrd()}><Copy size={17} /> {isThai ? 'คัดลอก Markdown' : 'COPY MARKDOWN'}</button>
        <button type="button" disabled={!draft.values.prdMarkdown} onClick={downloadPrd}><Download size={17} /> {isThai ? 'ดาวน์โหลด .md' : 'DOWNLOAD .MD'}</button>
        {prdExportState !== 'idle' ? <span role="status">{prdExportState === 'copied'
          ? (isThai ? 'คัดลอกแล้ว' : 'COPIED')
          : prdExportState === 'downloaded'
            ? (isThai ? 'ดาวน์โหลดแล้ว' : 'DOWNLOADED')
            : (isThai ? 'ทำรายการไม่สำเร็จ' : 'ACTION FAILED')}</span> : null}
      </div> : null}

      {!readOnly && definition.aiAction && definition.aiTitle && definition.aiDescription ? <AiProposalPanel
        project={project}
        phase={phase}
        values={draft.values}
        onAccepted={storeAcceptedAiProposal}
        disabled={draft.loading || draft.loadError}
      /> : null}

      {!readOnly && !definition.aiAction ? <aside className="own-evidence-boundary">
        <ShieldCheck aria-hidden="true" size={22} />
        <div>
          <strong>{isThai ? 'HUMAN EVIDENCE PHASE' : 'HUMAN EVIDENCE PHASE'}</strong>
          <p>{isThai
            ? 'Step นี้ไม่ให้ AI สร้างหลักฐาน การสังเกต Feedback หรือคำตัดสินรอบถัดไปแทนคุณ กรุณาบันทึกจาก Build และการทดสอบที่เกิดขึ้นจริง'
            : 'AI does not generate evidence, observations, feedback, or the next-iteration decision in this step. Record what actually happened in the build and user test.'}</p>
        </div>
      </aside> : null}

      {acceptedNotice ? <div className="own-accepted-notice" role="status"><CheckCircle2 size={19} /> {isThai ? 'เก็บ AI proposal ที่ Accept แล้วไว้กับ Draft ของหน้านี้ คุณยังแก้คำตอบก่อน Lock ได้' : 'The accepted AI proposal is attached to this page draft. You can still refine your answers before locking.'}</div> : null}

      {phase === 'PRD' ? <section id="own-ui-review" className="own-ui-review-stage" aria-labelledby="own-ui-review-title">
        <header><span>PRD · CODESIGN UI REVIEW</span><h2 id="own-ui-review-title">{isThai ? 'เห็นหน้าตาก่อน แล้วให้ Chat ช่วยทำ Final PRD' : 'SEE THE UI FIRST, THEN LET CHAT COMPLETE THE FINAL PRD'}</h2><p>{isThai ? 'Build Your Own มีความเป็นไปได้หลากหลาย จึงให้ Chat ใช้ UI Review ที่คุณอนุมัติเป็นหลักฐานในการปรับ PRD ฉบับเต็ม โดย CODESIGN จะตรวจโครงสร้างก่อนให้ Lock' : 'Build Your Own can vary widely, so Chat uses your approved UI Review as evidence when updating the complete PRD. CODESIGN validates both files before locking.'}</p></header>
        {(draft.values.prdMarkdown?.trim().length ?? 0) < 300 ? <p className="field-error" role="status">{isThai ? 'สร้างและตรวจ PRD Draft ด้านบนให้พร้อมก่อนเริ่ม Prototype' : 'CREATE AND REVIEW THE PRD DRAFT ABOVE BEFORE PROTOTYPING.'}</p> : null}
        <UiReviewWorkspace
          mode="own"
          projectId={project.id}
          uiBrief={ownUiBrief}
          storedReview={draft.values.uiReviewMarkdown}
          storedFinalPrd={uiReviewReady ? draft.values.prdMarkdown : ''}
          applied={uiReviewReady}
          disabled={readOnly || (draft.values.prdMarkdown?.trim().length ?? 0) < 300}
          onApply={async ({ review, finalPrd }) => {
            await draft.saveAll({
              prdMarkdown: finalPrd ?? draft.values.prdMarkdown,
              uiBriefDraft: ownUiBrief,
              uiReviewMarkdown: review,
              uiReviewApplied: 'yes',
            })
          }}
          onRevision={async ({ review, route }) => {
            await draft.saveAll({
              uiBriefDraft: ownUiBrief,
              uiReviewMarkdown: review,
              uiReviewApplied: '',
            })
            const targetPhase = route === 'revision-e' ? 'E' : 'S'
            const nextProject = await startPhaseRevision({
              projectId: project.id,
              targetPhase,
              reason: isThai
                ? `CODESIGN UI Review พบว่าต้องทบทวน Product Decision ที่ Step ${targetPhase} ก่อนสร้าง Final PRD`
                : `CODESIGN UI Review requires the Step ${targetPhase} Product Decision to be revised before creating the final PRD.`,
            })
            queryClient.setQueryData(['project', project.id], nextProject)
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['projects'] }),
              queryClient.invalidateQueries({ queryKey: ['phase-entries', project.id] }),
              queryClient.invalidateQueries({ queryKey: ['phase-entry-history', project.id] }),
            ])
            navigate(`/own-projects/${project.id}/${targetPhase}`)
          }}
        />
      </section> : null}

      {!readOnly ? <ReviewGate
        title={phase === 'PRD'
          ? 'LOCK PRD'
          : phase === 'N'
            ? (isThai ? 'LOCK NEXT ITERATION' : 'LOCK NEXT ITERATION')
            : (isThai ? `LOCK STEP ${phase}` : `LOCK STEP ${phase}`)}
        question={isThai
          ? phase === 'PRD'
            ? 'PRD นี้สะท้อนคำตัดสินทั้งหมดและพร้อมเข้าสู่การสร้างแล้วหรือยัง?'
            : phase === 'N'
              ? 'นี่คือการเปลี่ยนแปลงที่สำคัญที่สุดสำหรับรอบถัดไป และมีหลักฐานเพียงพอให้ Lock แล้วหรือยัง?'
              : 'คำตอบหน้านี้ชัดพอที่จะใช้เป็น Decision ของหน้าถัดไปแล้วหรือยัง?'
          : phase === 'PRD'
            ? 'Does this PRD reflect every decision and feel ready for implementation?'
            : phase === 'N'
              ? 'Is this the most important next change, with enough evidence to lock the iteration?'
              : 'Are these answers clear enough to become the decision context for the next step?'}
        actions={<>
          <ArcadeButton variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{isThai ? 'ยัง — ทบทวนอีกครั้ง' : 'NOT YET — REVIEW'}</ArcadeButton>
          <ArcadeButton disabled={completion.isPending || draft.saveState === 'saving' || !uiReviewReady} onClick={complete}>
            <LockKeyhole size={18} /> {completion.isPending
              ? (isThai ? 'กำลัง Lock…' : 'LOCKING…')
              : phase === 'PRD'
                ? (isThai ? 'พร้อม — Lock PRD และเริ่มสร้าง' : 'READY — LOCK PRD & IMPLEMENT')
                : phase === 'N'
                  ? (isThai ? 'พร้อม — ปิดรอบแรก' : 'READY — COMPLETE FIRST CYCLE')
                  : (isThai ? `พร้อม — ไป Step ${nextPhase}` : `READY — GO TO ${nextPhase}`)}
          </ArcadeButton>
        </>}
      >
        <div className="own-gate-progress">
          <strong>{answeredRequired}/{requiredFields.length}</strong>
          <span>{isThai ? 'คำตอบจำเป็นผ่านเกณฑ์ขั้นต่ำ' : 'required answers meet the minimum detail gate'}</span>
        </div>
        {attempted && validationErrors.length ? <p className="field-error" role="alert">{isThai ? `ยัง Lock ไม่ได้ กรุณาเติม ${validationErrors.length} ช่องที่ระบุ` : `LOCKING IS DISABLED UNTIL ${validationErrors.length} REQUIRED FIELD(S) ARE COMPLETE.`}</p> : null}
        {phase === 'PRD' && !uiReviewReady ? <p className="field-error" role="alert">{isThai ? 'ยัง Lock ไม่ได้ กรุณาทำ Prototype และนำ CODESIGN_UI_REVIEW.md กับ PRODUCT_REQUIREMENTS.md ฉบับ Final กลับมาใช้ก่อน' : 'LOCKING IS DISABLED UNTIL THE APPROVED UI REVIEW AND FINAL PRODUCT_REQUIREMENTS.md ARE APPLIED.'}</p> : null}
        {completion.isError && completion.error.message !== 'VALIDATION_REQUIRED' ? <p className="field-error" role="alert">{isThai ? 'Lock Step ไม่สำเร็จ ข้อมูลยังคงเป็น Draft' : 'Could not lock this step. Your work remains a draft.'}</p> : null}
      </ReviewGate> : <div className="own-readonly-actions"><ArcadeButton to={`/own-projects/${project.id}/${project.current_phase}`}><ArrowRight size={18} /> {isThai ? 'กลับไปหน้าปัจจุบัน' : 'RETURN TO CURRENT STEP'}</ArcadeButton></div>}
    </div>
  )
}
