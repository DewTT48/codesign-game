import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, LockKeyhole, Plus, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { CrossStepAlignment } from '../CrossStepAlignment'
import { alignmentIsReady, entriesToRecord, normalizeAlignmentStatus } from '../crossStepAlignmentModel'
import { debateOutcomeLabel, resolveDebateSummary } from '../debateModel'
import { completePhase, getPhaseEntries } from '../journey.service'
import { getFieldGuide } from '../guidanceContent'
import { JourneyLayout } from '../JourneyLayout'
import { FieldGuideDetails, FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import {
  findExactScopeConflicts,
  MAX_MUST_HAVES,
  moveScopeDecision,
  normalizeScopeList,
  type ScopeStatus,
} from '../scopeDecisionModel'
import { usePhaseDraft } from '../usePhaseDraft'

const basicRules = ['Standalone Web App', 'Browser-based persistence allowed', 'No Auth in learner-built app', 'No Cloud Database', 'No Backend', 'No required paid/external service', 'GitHub Pages deployable']
const initialEstablish = {
  direction: '',
  mustHaves: ['', '', ''] as unknown as Json,
  nonGoals: ['', ''] as unknown as Json,
  scopeAlignmentConfirmed: false,
  alignmentStatus: '',
  alignmentNote: '',
  alignmentConfirmed: false,
}

export function EstablishPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'E', initialValues: initialEstablish })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mustHaves = normalizeScopeList(draft.values.mustHaves)
  const nonGoals = normalizeScopeList(draft.values.nonGoals)
  const debateEntries = useQuery({ queryKey: ['phase-entries', project.id, 'D'], queryFn: () => getPhaseEntries(project.id, 'D') })
  const debate = entriesToRecord(debateEntries.data)
  const debateLanguage = isThai ? 'th' : 'en'
  const debateSummary = resolveDebateSummary(debate, debateLanguage)
  const alignmentStatus = normalizeAlignmentStatus(draft.values.alignmentStatus)
  const alignmentNote = String(draft.values.alignmentNote)
  const completion = useMutation({ mutationFn: async () => { await draft.saveAll(); return completePhase(project.id, 'E') }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['project', project.id] }); navigate(`/projects/${project.id}/S`) } })
  const resetValidations = () => { draft.setField('scopeAlignmentConfirmed', false); draft.setField('alignmentConfirmed', false) }
  const updateDirection = (value: string) => { draft.setField('direction', value); resetValidations() }
  const updateScopeItem = (status: ScopeStatus, index: number, value: string) => {
    const key = status === 'must-have' ? 'mustHaves' : 'nonGoals'
    const list = status === 'must-have' ? mustHaves : nonGoals
    draft.setField(key, list.map((item, itemIndex) => itemIndex === index ? value : item) as unknown as Json)
    resetValidations()
  }
  const removeScopeItem = (status: ScopeStatus, index: number) => {
    const key = status === 'must-have' ? 'mustHaves' : 'nonGoals'
    const list = status === 'must-have' ? mustHaves : nonGoals
    draft.setField(key, list.filter((_, itemIndex) => itemIndex !== index) as unknown as Json)
    resetValidations()
  }
  const addScopeItem = (status: ScopeStatus) => {
    const key = status === 'must-have' ? 'mustHaves' : 'nonGoals'
    const list = status === 'must-have' ? mustHaves : nonGoals
    if (status === 'must-have' && list.length >= MAX_MUST_HAVES) return
    draft.setField(key, [...list, ''] as unknown as Json)
    resetValidations()
  }
  const changeScopeStatus = (status: ScopeStatus, index: number, nextStatus: ScopeStatus) => {
    const next = moveScopeDecision({ mustHaves, nonGoals }, status, index, nextStatus)
    if (next.mustHaves === mustHaves && next.nonGoals === nonGoals) return
    draft.setField('mustHaves', next.mustHaves as unknown as Json)
    draft.setField('nonGoals', next.nonGoals as unknown as Json)
    resetValidations()
  }
  const exactConflicts = findExactScopeConflicts(mustHaves, nonGoals)
  const upstreamReady = alignmentIsReady({ status: alignmentStatus, note: alignmentNote, confirmed: Boolean(draft.values.alignmentConfirmed) })
  const ready = String(draft.values.direction).trim() && mustHaves.filter((item) => item.trim()).length >= 1 && nonGoals.filter((item) => item.trim()).length >= 2 && exactConflicts.length === 0 && Boolean(draft.values.scopeAlignmentConfirmed) && debateEntries.isSuccess && upstreamReady
  const displayedRules = isThai ? [
    'เป็น Web App ที่ทำงานได้ด้วยตัวเอง',
    'บันทึกข้อมูลไว้ใน Browser ได้',
    'App ที่ผู้เรียนสร้างไม่ต้องมีระบบเข้าสู่ระบบ',
    'ไม่ใช้ Cloud Database',
    'ไม่มี Backend',
    'ไม่บังคับใช้บริการภายนอกหรือบริการแบบเสียเงิน',
    'Publish ผ่าน GitHub Pages ได้',
  ] : basicRules

  return (
    <JourneyLayout project={project} phase="E" phaseName="ESTABLISH" chatContext={draft.values} saveState={draft.saveState}>
      <PhaseSection step="01" title={isThai ? 'กระดานตัดสินใจ' : 'DECISION BOARD'}>
        <FormField label={isThai ? 'เรากำลังจะสร้าง' : 'WE ARE BUILDING'} guideKey="establish.direction" hint={isThai ? 'สรุป Product direction ให้กระชับในหนึ่งข้อความ' : 'ONE CONCISE PRODUCT DIRECTION'} required><textarea rows={4} value={String(draft.values.direction)} onChange={(event) => updateDirection(event.target.value)} /></FormField>
        <ScopeDecisionBoard
          mustHaves={mustHaves}
          nonGoals={nonGoals}
          onChange={updateScopeItem}
          onRemove={removeScopeItem}
          onAdd={addScopeItem}
          onStatusChange={changeScopeStatus}
        />
      </PhaseSection>
      <PhaseSection step="02" title={isThai ? 'รูปแบบของ Application ในแบบฝึกนี้' : 'BUILD CONDITIONS FOR THIS EXERCISE'} description={isThai ? 'ในแบบฝึกนี้ Application ที่คุณกำลังสร้างจะใช้ขอบเขตทางเทคนิคต่อไปนี้' : 'The application you create in this exercise will use the following technical boundaries.'}>
        <ul className="locked-rules">{displayedRules.map((rule) => <li key={rule}><LockKeyhole aria-hidden="true" size={16} /> {rule}</li>)}</ul>
      </PhaseSection>
      <PhaseSection step="03" title={isThai ? 'ตรวจความสอดคล้องของขอบเขต' : 'SCOPE ALIGNMENT CHECK'} description={isThai ? 'ตรวจด้วยความหมายของแต่ละรายการ ไม่ใช้คำซ้ำเป็นตัวตัดสิน' : 'Review the meaning of each decision; repeated keywords are not used as a verdict.'}>
        <div className="scope-review-points">
          <strong>{isThai ? 'สิ่งที่ต้องยืนยันก่อนส่งต่อ' : 'CONFIRM BEFORE HANDOFF'}</strong>
          <ul>
            <li>{isThai ? 'Must Have ทุกข้อจำเป็นต่อ Goal ของผู้ใช้' : 'Every must-have is necessary for the user goal.'}</li>
            <li>{isThai ? 'Non-goal ทุกข้อคือสิ่งที่ตั้งใจยังไม่สร้างใน Version แรก' : 'Every non-goal is intentionally excluded from version one.'}</li>
            <li>{isThai ? 'แต่ละรายการมีสถานะเดียว และผู้รับงานจะไม่ตีความได้สองแบบ' : 'Each decision has one status and cannot be interpreted both ways.'}</li>
          </ul>
        </div>
        {exactConflicts.length ? <div className="alignment-warning" role="alert">
          <strong>{isThai ? 'พบรายการเดียวกันอยู่ทั้งสองสถานะ' : 'THE SAME DECISION HAS BOTH STATUSES'}</strong>
          <ul>{exactConflicts.map((conflict) => <li key={`${conflict.mustHaveIndex}-${conflict.nonGoalIndex}`}>{isThai ? `“${conflict.text}” อยู่ใน Must Have ข้อ ${conflict.mustHaveIndex + 1} และ Non-goal ข้อ ${conflict.nonGoalIndex + 1}` : `“${conflict.text}” is Must-have ${conflict.mustHaveIndex + 1} and Non-goal ${conflict.nonGoalIndex + 1}.`}</li>)}</ul>
        </div> : null}
        <label className={draft.values.scopeAlignmentConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}>
          <input type="checkbox" disabled={exactConflicts.length > 0} checked={Boolean(draft.values.scopeAlignmentConfirmed)} onChange={(event) => draft.setField('scopeAlignmentConfirmed', event.target.checked)} />
          <Check size={19} />
          <span><strong>{isThai ? 'ฉันตรวจความหมายของ Scope ครบแล้ว' : 'I REVIEWED THE MEANING OF THE SCOPE'}</strong><small>{isThai ? 'Direction, Must Have และ Non-goal ไม่ขัดกัน และพร้อมส่งต่อไป Step S' : 'Direction, must-haves, and non-goals agree and can be handed to Step S.'}</small></span>
        </label>
      </PhaseSection>
      <CrossStepAlignment
        step="04"
        sourceStep="D"
        targetStep="E"
        loading={debateEntries.isLoading}
        loadError={debateEntries.isError}
        items={[
          { label: isThai ? 'ผลต่อ Direction' : 'DIRECTION RESULT', value: debateOutcomeLabel(debate.directionResult, debateLanguage) || String(debate.directionResult ?? '') },
          { label: isThai ? 'สรุปการตัดสินใจและเหตุผล' : 'DECISIONS AND REASONS', value: debateSummary ? debateSummary.split('\n') : [] },
          { label: isThai ? 'การส่งต่อก่อนหน้า O → D' : 'PRIOR O → D HANDOFF', value: [String(debate.alignmentStatus ?? ''), String(debate.alignmentNote ?? '')].filter(Boolean) },
        ]}
        status={alignmentStatus}
        note={alignmentNote}
        confirmed={Boolean(draft.values.alignmentConfirmed)}
        revisionAction={<Link to={`/projects/${project.id}/D`}>{isThai ? 'กลับไปตรวจ Step D' : 'REVIEW STEP D'}</Link>}
        onStatusChange={(status) => { draft.setField('alignmentStatus', status); draft.setField('alignmentConfirmed', false) }}
        onNoteChange={(note) => { draft.setField('alignmentNote', note); draft.setField('alignmentConfirmed', false) }}
        onConfirmedChange={(confirmed) => draft.setField('alignmentConfirmed', confirmed)}
      />
      <ReviewGate title={isThai ? 'ตรวจขอบเขตของ Product' : 'SCOPE GATE'} question={isThai ? 'ถ้า Chat เสนอ Feature ใหม่ คุณจะตรวจ Scope ก่อนเพิ่มหรือไม่?' : 'If Chat suggests a new feature, will you check the scope before adding it?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole aria-hidden="true" size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'ยืนยันขอบเขต Product' : 'LOCK PRODUCT SCOPE')}</ArcadeButton>}>
        <dl><div><dt>{isThai ? 'เรากำลังจะสร้าง' : 'WE ARE BUILDING'}</dt><dd>{String(draft.values.direction)}</dd></div><div><dt>{isThai ? 'สิ่งที่ต้องมี' : 'MUST HAVE'}</dt><dd>{mustHaves.filter(Boolean).join(' · ')}</dd></div><div><dt>{isThai ? 'สิ่งที่ยังไม่ทำใน Version นี้' : 'NOT IN THIS VERSION'}</dt><dd>{nonGoals.filter(Boolean).join(' · ')}</dd></div></dl>
        {completion.isError ? <p className="field-error" role="alert">Lock scope ไม่สำเร็จ ข้อมูลยังไม่เปลี่ยนสถานะ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

function ScopeDecisionBoard({ mustHaves, nonGoals, onChange, onRemove, onAdd, onStatusChange }: {
  mustHaves: string[]
  nonGoals: string[]
  onChange: (status: ScopeStatus, index: number, value: string) => void
  onRemove: (status: ScopeStatus, index: number) => void
  onAdd: (status: ScopeStatus) => void
  onStatusChange: (status: ScopeStatus, index: number, nextStatus: ScopeStatus) => void
}) {
  const { language, isThai } = useLanguage()
  const mustHaveGuide = getFieldGuide(language, 'establish.mustHave')
  const nonGoalGuide = getFieldGuide(language, 'establish.nonGoal')
  const items = [
    ...mustHaves.map((text, index) => ({ text, index, status: 'must-have' as const })),
    ...nonGoals.map((text, index) => ({ text, index, status: 'non-goal' as const })),
  ]

  return <section className="scope-decision-board">
    <header>
      <span>{isThai ? 'หนึ่งรายการ · หนึ่งสถานะ' : 'ONE ITEM · ONE STATUS'}</span>
      <h3>{isThai ? 'รายการตัดสินใจเรื่อง Scope' : 'SCOPE DECISIONS'}</h3>
      <p>{isThai ? 'เขียนเรื่องที่ต้องตัดสินใจหนึ่งครั้ง แล้วเลือกว่าจะสร้างใน Version แรกหรือยังไม่สร้าง หากเปลี่ยนใจให้ย้ายสถานะของรายการเดิม' : 'Write each decision once, then choose whether it belongs in version one or outside it. Move the same item when the decision changes.'}</p>
    </header>
    <div className="scope-decision-board__guides">
      <article>
        <strong>{isThai ? 'ต้องมีใน Version แรก' : 'MUST HAVE'}</strong>
        <p>{mustHaveGuide?.question}</p>
        {mustHaveGuide ? <FieldGuideDetails guide={mustHaveGuide} label={isThai ? 'วิธีตัดสินใจ' : 'How to decide'} isThai={isThai} /> : null}
      </article>
      <article>
        <strong>{isThai ? 'ยังไม่ทำใน Version นี้' : 'NOT IN THIS VERSION'}</strong>
        <p>{nonGoalGuide?.question}</p>
        {nonGoalGuide ? <FieldGuideDetails guide={nonGoalGuide} label={isThai ? 'วิธีตัดสินใจ' : 'How to decide'} isThai={isThai} /> : null}
      </article>
    </div>
    <ol className="scope-decision-list">
      {items.map((item, position) => <li className={`scope-decision-item scope-decision-item--${item.status}`} key={`${item.status}-${item.index}`}>
        <span className="scope-decision-item__number">{String(position + 1).padStart(2, '0')}</span>
        <div className="scope-decision-item__main">
          <input value={item.text} onChange={(event) => onChange(item.status, item.index, event.target.value)} aria-label={`${isThai ? 'รายการ Scope' : 'Scope item'} ${position + 1}`} />
          <div className="scope-status-buttons" role="group" aria-label={`${isThai ? 'สถานะของรายการ' : 'Status for item'} ${position + 1}`}>
            <button type="button" className={item.status === 'must-have' ? 'is-active' : ''} aria-pressed={item.status === 'must-have'} disabled={item.status === 'non-goal' && mustHaves.length >= MAX_MUST_HAVES} onClick={() => onStatusChange(item.status, item.index, 'must-have')}>{isThai ? 'ต้องมีใน Version แรก' : 'MUST HAVE'}</button>
            <button type="button" className={item.status === 'non-goal' ? 'is-active' : ''} aria-pressed={item.status === 'non-goal'} onClick={() => onStatusChange(item.status, item.index, 'non-goal')}>{isThai ? 'ยังไม่ทำใน Version นี้' : 'NOT IN THIS VERSION'}</button>
          </div>
        </div>
        <button className="scope-decision-item__remove" type="button" onClick={() => onRemove(item.status, item.index)} aria-label={`${isThai ? 'ลบรายการ Scope' : 'Remove scope item'} ${position + 1}`}><X size={17} /> {isThai ? 'ลบ' : 'REMOVE'}</button>
      </li>)}
    </ol>
    <footer>
      <div><strong>{isThai ? 'สถานะปัจจุบัน' : 'CURRENT STATUS'}</strong><span>{isThai ? `ต้องมี ${mustHaves.filter((item) => item.trim()).length} · ยังไม่ทำ ${nonGoals.filter((item) => item.trim()).length}` : `${mustHaves.filter((item) => item.trim()).length} must-have · ${nonGoals.filter((item) => item.trim()).length} not in this version`}</span></div>
      <div className="scope-add-actions">
        <button type="button" disabled={mustHaves.length >= MAX_MUST_HAVES} onClick={() => onAdd('must-have')}><Plus size={17} /> {isThai ? 'เพิ่ม Must Have' : 'ADD MUST-HAVE'} ({mustHaves.length}/{MAX_MUST_HAVES})</button>
        <button type="button" onClick={() => onAdd('non-goal')}><Plus size={17} /> {isThai ? 'เพิ่ม Non-goal' : 'ADD NON-GOAL'}</button>
      </div>
    </footer>
  </section>
}
