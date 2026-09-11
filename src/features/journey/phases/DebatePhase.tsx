import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { CrossStepAlignment } from '../CrossStepAlignment'
import { alignmentIsReady, entriesToRecord, normalizeAlignmentStatus } from '../crossStepAlignmentModel'
import {
  blankDebateAssumption,
  buildDebateSummary,
  debateOutcomeLabel,
  debateOutcomes,
  debateReason,
  normalizeDebateAssumptions,
  normalizeDebateOutcome,
  type DebateAssumption,
  type DebateStance,
  withDebateReason,
  withDebateStance,
} from '../debateModel'
import { completePhase, getPhaseEntries } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

const MIN_ASSUMPTIONS = 2
const MAX_ASSUMPTIONS = 5
const initialDebate = {
  assumptions: [blankDebateAssumption(), blankDebateAssumption()] as unknown as Json,
  directionResult: '',
  whatChanged: '',
  summaryCustomized: false,
  alignmentStatus: '',
  alignmentNote: '',
  alignmentConfirmed: false,
}

const debateGuide = {
  th: {
    title: 'ตรวจสมมติฐานก่อนตัดสินใจ',
    intro: <>AI ช่วยชี้สิ่งที่ Direction อาจมองข้าม คุณเพียงตัดสินใจทีละข้อว่าจะเดินหน้าต่อชั่วคราว หรือปรับ Direction <span className="keep-together">ก่อนสร้างจริง</span></>,
    steps: [
      ['01 · ให้ AI ท้าทาย', 'ใช้ Prompt Kit เพื่อหา 3–5 สมมติฐาน แล้วอ่าน Evidence, Failure\u00a0mode และ Impact เพื่อเข้าใจความเสี่ยง'],
      ['02 · เลือกอย่างน้อย 2 ข้อ', 'เริ่มจาก ASSUMPTION สถานะ ASSUMED หรือ UNKNOWN ที่สำคัญที่สุด 2 ข้อ และเพิ่มได้ถึง 5 ข้อเมื่อจำเป็น โดยไม่ต้องคัดลอกบทวิเคราะห์ทั้งหมด'],
      ['03 · ระบบสรุปให้', 'เมื่อให้เหตุผลครบ ระบบจะรวบรวมคำตอบให้อัตโนมัติ คุณเพียงเลือกผลรวมต่อ Direction และตรวจความถูกต้อง'],
    ],
    statusTitle: 'อ่าน STATUS จาก Chat อย่างไร',
    statuses: [
      ['KNOWN', 'มีหลักฐานรองรับแล้ว ใช้เป็น Context ได้ โดยทั่วไปไม่ต้องนำมา Debate'],
      ['ASSUMED', 'ฟังดูเป็นไปได้ แต่ยังไม่มีหลักฐานเพียงพอ เหมาะที่จะนำมาพิจารณา'],
      ['UNKNOWN', 'ข้อมูลยังไม่พอจะรู้ว่าเป็นจริงหรือไม่ เลือกได้ถ้ากระทบ Direction สูง'],
    ],
    mappingTitle: 'จากคำตอบ Chat → ช่องที่ต้องกรอก',
    mapping: [
      ['ASSUMPTION', 'คัดลอกเฉพาะประโยคสมมติฐานลงใน DIRECTION\u00a0ASSUMES\u00a0THAT…'],
      ['EVIDENCE / FAILURE MODE / IMPACT', 'ใช้ประกอบการคิด ไม่ต้องคัดลอกทั้งหมด'],
      ['QUESTION FOR OWNER', 'ตอบคำถามนี้ แล้วเลือกว่าจะเดินหน้าต่อชั่วคราวหรือปรับ Direction'],
      ['OWNER REASON / WHAT SHOULD CHANGE', 'บันทึกเหตุผลหนึ่งครั้ง และระบุสิ่งที่จะเปลี่ยนเฉพาะเมื่อเลือกปรับ Direction'],
    ],
    agree: 'ความเสี่ยงนี้ยอมรับได้ในตอนนี้ จึงสร้างและทดสอบต่อได้ โดยยังไม่ถือว่าเป็นข้อเท็จจริง',
    challenge: 'ความเสี่ยงสูงเกินไป จึงต้องปรับ Direction หรือกติกาก่อนสร้างต่อ',
    exampleTitle: 'ตัวอย่างสั้น ๆ',
    example: 'Chat: “ผู้ใช้พร้อมกลับมาทุกวันโดยไม่ต้องมีสิ่งเตือน” → นำประโยคนี้มากรอก → เลือกปรับ Direction → เหตุผล: ผู้ใช้เหนื่อยและเคยเลิกใช้ Habit\u00a0app → เปลี่ยน: ไม่ใช้ Daily\u00a0streak เป็นแกนหลัก',
  },
  en: {
    title: 'Review assumptions before deciding',
    intro: 'AI exposes what the direction may be overlooking. For each item, decide whether to proceed for now or adjust the direction before building.',
    steps: [
      ['01 · LET AI CHALLENGE', 'Use the Prompt Kit to find 3–5 assumptions. Read the evidence, failure mode, and impact to understand each risk.'],
      ['02 · CHOOSE AT LEAST 2', 'Start with the 2 most critical ASSUMED or UNKNOWN items. Add up to 5 when needed; do not copy the full analysis.'],
      ['03 · REVIEW THE AUTOMATIC SUMMARY', 'After you explain each decision, choose the overall impact on the direction and verify the summary.'],
    ],
    statusTitle: 'How to read Chat status',
    statuses: [
      ['KNOWN', 'Supported by evidence. Use it as context; it usually does not need debate.'],
      ['ASSUMED', 'Plausible but not sufficiently supported. A strong candidate for debate.'],
      ['UNKNOWN', 'There is not enough information. Select it when it could materially affect the direction.'],
    ],
    mappingTitle: 'Chat response → form field',
    mapping: [
      ['ASSUMPTION', 'Copy only the assumption into DIRECTION ASSUMES THAT…'],
      ['EVIDENCE / FAILURE MODE / IMPACT', 'Use these to think; do not copy the entire analysis.'],
      ['QUESTION FOR OWNER', 'Answer it, then choose whether to proceed for now or adjust the direction.'],
      ['OWNER REASON / WHAT SHOULD CHANGE', 'Record the reason once, and add a change only when you adjust the direction.'],
    ],
    agree: 'The risk is acceptable for now, so build and test without treating it as proven fact.',
    challenge: 'The risk is too high, so adjust the direction or a rule before building.',
    exampleTitle: 'Short example',
    example: 'Chat: “Users will return every day without a reminder” → copy that sentence → choose Adjust direction → reason: tired users have abandoned habit apps → change: do not make a daily streak the core mechanism.',
  },
} as const

const outcomeDescriptions = {
  th: {
    'OUR DIRECTION STAYED THE SAME': 'ไม่มีคำตอบข้อใดทำให้แนวคิดหลักต้องเปลี่ยน',
    'WE REFINED OUR DIRECTION': 'แนวคิดหลักยังเดิม แต่ต้องปรับกติกาหรือรายละเอียดบางส่วน',
    'WE CHANGED OUR DIRECTION': 'แนวคิดหลักหรือวิธีแก้ปัญหาต้องเปลี่ยน',
  },
  en: {
    'OUR DIRECTION STAYED THE SAME': 'None of the decisions changes the core approach.',
    'WE REFINED OUR DIRECTION': 'The core stays, but a rule or detail must be adjusted.',
    'WE CHANGED OUR DIRECTION': 'The core approach or solution must change.',
  },
} as const

export function DebatePhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'D', initialValues: initialDebate })
  const [summaryEditing, setSummaryEditing] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const language = isThai ? 'th' : 'en'
  const assumptions = normalizeDebateAssumptions(draft.values.assumptions)
  const directionResult = normalizeDebateOutcome(draft.values.directionResult)
  const automaticSummary = buildDebateSummary(assumptions, directionResult, language)
  const summaryCustomized = Boolean(draft.values.summaryCustomized)
  const customSummary = String(draft.values.whatChanged).trim()
  const displayedSummary = summaryCustomized && customSummary ? customSummary : automaticSummary
  const guide = debateGuide[isThai ? 'th' : 'en']
  const optionEntries = useQuery({ queryKey: ['phase-entries', project.id, 'O'], queryFn: () => getPhaseEntries(project.id, 'O') })
  const optionSource = entriesToRecord(optionEntries.data)
  const sourceOptions = Array.isArray(optionSource.options) ? optionSource.options : []
  const favoriteIndex = typeof optionSource.favorite === 'number' ? optionSource.favorite : -1
  const favorite = sourceOptions[favoriteIndex]
  const favoriteRecord = favorite && typeof favorite === 'object' && !Array.isArray(favorite) ? favorite : null
  const alignmentStatus = normalizeAlignmentStatus(draft.values.alignmentStatus)
  const alignmentNote = String(draft.values.alignmentNote)
  const resetAlignment = () => draft.setField('alignmentConfirmed', false)
  const completion = useMutation({ mutationFn: async () => { await draft.saveAll({ whatChanged: displayedSummary }); return completePhase(project.id, 'D') }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['project', project.id] }); navigate(`/projects/${project.id}/E`) } })
  function updateAssumption(index: number, patch: Partial<DebateAssumption>) { draft.setField('assumptions', assumptions.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) as unknown as Json); resetAlignment() }
  function setStance(index: number, stance: DebateStance) {
    const current = assumptions[index]
    if (!current || !stance || current.stance === stance) return
    updateAssumption(index, withDebateStance(current, stance))
  }
  function setReason(index: number, value: string) {
    const current = assumptions[index]
    if (!current?.stance) return
    updateAssumption(index, withDebateReason(current, value))
  }
  function addAssumption() {
    if (assumptions.length >= MAX_ASSUMPTIONS) return
    draft.setField('assumptions', [...assumptions, blankDebateAssumption()] as unknown as Json)
    resetAlignment()
  }
  function removeAssumption(index: number) {
    if (assumptions.length <= MIN_ASSUMPTIONS) return
    draft.setField('assumptions', assumptions.filter((_, itemIndex) => itemIndex !== index) as unknown as Json)
    resetAlignment()
  }
  const alignmentReady = alignmentIsReady({ status: alignmentStatus, note: alignmentNote, confirmed: Boolean(draft.values.alignmentConfirmed) })
  const ready = assumptions.every((item) => item.text.trim() && item.stance && debateReason(item).trim() && (item.stance !== 'challenge' || item.change.trim())) && Boolean(directionResult) && Boolean(displayedSummary) && optionEntries.isSuccess && alignmentReady

  return (
    <JourneyLayout project={project} phase="D" phaseName="DEBATE" chatContext={draft.values} saveState={draft.saveState}>
      <aside className="debate-guide" aria-labelledby="debate-guide-title">
        <header>
          <span>{isThai ? 'ขั้นตอนนี้ทำงานอย่างไร' : 'HOW THIS STEP WORKS'}</span>
          <h2 id="debate-guide-title">{guide.title}</h2>
          <p>{guide.intro}</p>
        </header>
        <div className="debate-guide__steps">
          {guide.steps.map(([title, description]) => <article key={title}><strong>{title}</strong><p>{description}</p></article>)}
        </div>
        <div className="debate-guide__reference">
          <section>
            <h3>{guide.statusTitle}</h3>
            <dl>{guide.statuses.map(([term, description]) => <div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}</dl>
          </section>
          <section>
            <h3>{guide.mappingTitle}</h3>
            <dl>{guide.mapping.map(([term, description]) => <div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}</dl>
          </section>
        </div>
        <details className="debate-guide__example" open>
          <summary>{guide.exampleTitle}</summary>
          <p>{guide.example}</p>
        </details>
      </aside>

      <PhaseSection step="01" title={isThai ? 'เปิดเผยสมมติฐาน' : 'EXPOSE THE ASSUMPTIONS'} description={isThai ? 'ใช้ชุดคำสั่งค้นหาสิ่งที่ข้อเสนอถือว่าเป็นจริงโดยยังไม่มีหลักฐาน' : 'Use the Prompt Kit to expose what the proposal treats as true without evidence.'}>
        <div className="assumption-stack">
          {assumptions.map((assumption, index) => (
            <article className="assumption-card" key={index}>
              {assumptions.length > MIN_ASSUMPTIONS ? <button className="assumption-card__remove" type="button" onClick={() => removeAssumption(index)} aria-label={`${isThai ? 'ลบสมมติฐานข้อที่' : 'Remove assumption'} ${index + 1}`}><X aria-hidden="true" size={17} /> {isThai ? 'ลบ' : 'REMOVE'}</button> : null}
              <FormField label={isThai ? `Direction นี้ตั้งอยู่บนสมมติฐานว่า… ${index + 1}` : `DIRECTION ASSUMES THAT… ${index + 1}`} guideKey="debate.assumption" required><textarea rows={3} value={assumption.text} onChange={(event) => updateAssumption(index, { text: event.target.value })} /></FormField>
              <div className="stance-buttons">
                <button className={assumption.stance === 'agree' ? 'is-active' : ''} type="button" onClick={() => setStance(index, 'agree')}><strong>{isThai ? 'เดินหน้าต่อชั่วคราว' : 'PROCEED FOR NOW'}</strong><small>{guide.agree}</small></button>
                <button className={assumption.stance === 'challenge' ? 'is-active challenge' : ''} type="button" onClick={() => setStance(index, 'challenge')}><strong>{isThai ? 'ปรับ Direction' : 'ADJUST DIRECTION'}</strong><small>{guide.challenge}</small></button>
              </div>
              {assumption.stance ? <div className={`form-grid ${assumption.stance === 'challenge' ? 'form-grid--two' : ''} challenge-fields`}><FormField label={assumption.stance === 'agree' ? (isThai ? 'เหตุผลที่ความเสี่ยงนี้ยอมรับได้' : 'WHY IS THIS RISK ACCEPTABLE FOR NOW?') : (isThai ? 'เหตุผลที่ต้องปรับ Direction' : 'WHY MUST THE DIRECTION BE ADJUSTED?')} guideKey={assumption.stance === 'agree' ? 'debate.agreeReason' : 'debate.challengeReason'} required><textarea rows={3} value={debateReason(assumption)} onChange={(event) => setReason(index, event.target.value)} /></FormField>{assumption.stance === 'challenge' ? <FormField label={isThai ? 'จะเปลี่ยนอะไร?' : 'WHAT WILL CHANGE?'} guideKey="debate.change" required><textarea rows={3} value={assumption.change} onChange={(event) => updateAssumption(index, { change: event.target.value })} /></FormField> : null}</div> : null}
            </article>
          ))}
        </div>
        <button className="add-list-item assumption-add" type="button" disabled={assumptions.length >= MAX_ASSUMPTIONS} onClick={addAssumption}><Plus aria-hidden="true" size={17} /> {isThai ? 'เพิ่มสมมติฐาน' : 'ADD ASSUMPTION'} ({assumptions.length}/{MAX_ASSUMPTIONS})</button>
      </PhaseSection>
      <PhaseSection step="02" title={isThai ? 'ข้อสรุปหลังตรวจสมมติฐาน' : 'DECIDE THE OVERALL IMPACT'} description={isThai ? 'ไม่ต้องเขียนเหตุผลซ้ำ เลือกเพียงว่าคำตอบด้านบนส่งผลต่อ Direction ระดับใด แล้วตรวจสรุปที่ระบบรวบรวมให้' : 'Do not repeat your reasoning. Choose the overall impact on the direction, then verify the automatically assembled summary.'}>
        <div className="choice-grid choice-grid--three">
          {debateOutcomes.map((option) => <label className={directionResult === option ? 'simple-choice debate-outcome-choice is-active' : 'simple-choice debate-outcome-choice'} key={option}><input type="radio" name="direction-result" checked={directionResult === option} onChange={() => { draft.setField('directionResult', option); resetAlignment() }} /><span><strong>{debateOutcomeLabel(option, language)}</strong><small>{outcomeDescriptions[language][option]}</small></span></label>)}
        </div>
        <section className="debate-summary" aria-labelledby="debate-summary-title">
          <header>
            <div><span>{isThai ? 'รวบรวมจากคำตอบด้านบน' : 'ASSEMBLED FROM YOUR DECISIONS'}</span><h3 id="debate-summary-title">{isThai ? 'สรุปอัตโนมัติ' : 'AUTOMATIC SUMMARY'}</h3></div>
            <div className="debate-summary__actions">
              <button type="button" onClick={() => { if (!summaryCustomized) { draft.setField('whatChanged', automaticSummary); draft.setField('summaryCustomized', true) } setSummaryEditing((current) => !current); resetAlignment() }}>{summaryEditing ? (isThai ? 'แก้ไขเสร็จแล้ว' : 'DONE EDITING') : (isThai ? 'แก้ไขสรุป' : 'EDIT SUMMARY')}</button>
              {summaryCustomized ? <button type="button" onClick={() => { draft.setField('summaryCustomized', false); draft.setField('whatChanged', ''); setSummaryEditing(false); resetAlignment() }}>{isThai ? 'ใช้สรุปอัตโนมัติ' : 'USE AUTOMATIC SUMMARY'}</button> : null}
            </div>
          </header>
          {summaryEditing ? <textarea rows={6} value={String(draft.values.whatChanged)} onChange={(event) => { draft.setField('whatChanged', event.target.value); resetAlignment() }} /> : <p>{displayedSummary || (isThai ? 'เลือกผลต่อ Direction เพื่อดูสรุปที่ระบบรวบรวมให้' : 'Choose the direction outcome to see the automatically assembled summary.')}</p>}
          <small>{isThai ? 'ระบบจะส่งสรุปนี้ต่อไปยัง Step E, Journal และ PRD' : 'This summary will flow to Step E, the Journal, and the PRD.'}</small>
        </section>
      </PhaseSection>
      <CrossStepAlignment
        step="03"
        sourceStep="O"
        targetStep="D"
        loading={optionEntries.isLoading}
        loadError={optionEntries.isError}
        items={[
          { label: isThai ? 'ทางเลือกที่นำมาท้าทาย' : 'OPTION UNDER REVIEW', value: typeof favoriteRecord?.name === 'string' ? favoriteRecord.name : '' },
          { label: isThai ? 'แนวคิดหลัก' : 'CORE IDEA', value: typeof favoriteRecord?.coreIdea === 'string' ? favoriteRecord.coreIdea : '' },
          { label: isThai ? 'ประโยชน์ สิ่งที่ต้องแลก และการส่งต่อก่อนหน้า' : 'BENEFIT, TRADE-OFF, AND PRIOR HANDOFF', value: [typeof favoriteRecord?.like === 'string' ? favoriteRecord.like : '', typeof favoriteRecord?.tradeoff === 'string' ? favoriteRecord.tradeoff : '', [String(optionSource.alignmentStatus ?? ''), String(optionSource.alignmentNote ?? '')].filter(Boolean).join(' — ')].filter(Boolean) },
        ]}
        status={alignmentStatus}
        note={alignmentNote}
        confirmed={Boolean(draft.values.alignmentConfirmed)}
        revisionAction={<div className="alignment-revision-links"><Link to={`/projects/${project.id}/O`}>{isThai ? 'กลับไปตรวจ Step O' : 'REVIEW STEP O'}</Link><Link to={`/projects/${project.id}/C`}>{isThai ? 'กลับไปตรวจ Step C' : 'REVIEW STEP C'}</Link></div>}
        onStatusChange={(status) => { draft.setField('alignmentStatus', status); draft.setField('alignmentConfirmed', false) }}
        onNoteChange={(note) => { draft.setField('alignmentNote', note); resetAlignment() }}
        onConfirmedChange={(confirmed) => draft.setField('alignmentConfirmed', confirmed)}
      />
      <ReviewGate title={isThai ? 'ตรวจความพร้อมหลังตรวจสมมติฐาน' : 'DEBATE COMPLETE'} question={isThai ? 'คุณตัดสินใจครบทุกข้อและตรวจสรุปผลต่อ Direction แล้วหรือยัง?' : 'Have you decided every item and reviewed the overall impact on the direction?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'กำหนด Direction' : 'ESTABLISH DIRECTION')} <ArrowRight aria-hidden="true" size={18} /></ArcadeButton>}>
        <p>{isThai ? 'ระบบจะส่งต่อสมมติฐาน การตัดสินใจ เหตุผล และสิ่งที่จะเปลี่ยน โดยไม่ให้คุณเขียนซ้ำ' : 'The app carries forward each assumption, decision, reason, and change without asking you to repeat them.'}</p>
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'บันทึก Debate ไม่สำเร็จ กรุณาลองใหม่' : 'Could not save the debate. Please try again.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
