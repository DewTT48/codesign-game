import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, LockKeyhole, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completePhase } from '../journey.service'
import { getFieldGuide } from '../guidanceContent'
import { JourneyLayout } from '../JourneyLayout'
import { FieldGuideDetails, FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

const basicRules = ['Standalone Web App', 'Browser-based persistence allowed', 'No Auth in learner-built app', 'No Cloud Database', 'No Backend', 'No required paid/external service', 'GitHub Pages deployable']
const initialEstablish = {
  direction: '',
  mustHaves: ['', '', ''] as unknown as Json,
  nonGoals: ['', ''] as unknown as Json,
  scopeAlignmentConfirmed: false,
}

export function EstablishPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'E', initialValues: initialEstablish })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mustHaves = draft.values.mustHaves as unknown as string[]
  const nonGoals = draft.values.nonGoals as unknown as string[]
  const completion = useMutation({ mutationFn: async () => { await draft.saveAll(); return completePhase(project.id, 'E') }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['project', project.id] }); navigate(`/projects/${project.id}/S`) } })
  const resetScopeAlignment = () => draft.setField('scopeAlignmentConfirmed', false)
  const updateDirection = (value: string) => { draft.setField('direction', value); resetScopeAlignment() }
  const updateList = (key: 'mustHaves' | 'nonGoals', index: number, value: string) => { const list = key === 'mustHaves' ? mustHaves : nonGoals; draft.setField(key, list.map((item, itemIndex) => itemIndex === index ? value : item) as unknown as Json); resetScopeAlignment() }
  const removeItem = (key: 'mustHaves' | 'nonGoals', index: number) => { const list = key === 'mustHaves' ? mustHaves : nonGoals; draft.setField(key, list.filter((_, itemIndex) => itemIndex !== index) as unknown as Json); resetScopeAlignment() }
  const addItem = (key: 'mustHaves' | 'nonGoals') => { const list = key === 'mustHaves' ? mustHaves : nonGoals; draft.setField(key, [...list, ''] as unknown as Json); resetScopeAlignment() }
  const overlapTerms = findScopeOverlapTerms(String(draft.values.direction), mustHaves, nonGoals)
  const ready = String(draft.values.direction).trim() && mustHaves.filter((item) => item.trim()).length >= 1 && nonGoals.filter((item) => item.trim()).length >= 2 && Boolean(draft.values.scopeAlignmentConfirmed)
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
        <div className="scope-columns">
          <ListEditor title={isThai ? 'สิ่งที่ต้องมีใน Version แรก' : 'MUST HAVE'} guideKey="establish.mustHave" items={mustHaves} limit={8} onChange={(index, value) => updateList('mustHaves', index, value)} onRemove={(index) => removeItem('mustHaves', index)} onAdd={() => addItem('mustHaves')} />
          <ListEditor title={isThai ? 'สิ่งที่ยังไม่ทำใน Version นี้' : 'NOT IN THIS VERSION'} guideKey="establish.nonGoal" items={nonGoals} onChange={(index, value) => updateList('nonGoals', index, value)} onRemove={(index) => removeItem('nonGoals', index)} onAdd={() => addItem('nonGoals')} />
        </div>
      </PhaseSection>
      <PhaseSection step="02" title={isThai ? 'รูปแบบของ Application ในแบบฝึกนี้' : 'BUILD CONDITIONS FOR THIS EXERCISE'} description={isThai ? 'ในแบบฝึกนี้ Application ที่คุณกำลังสร้างจะใช้ขอบเขตทางเทคนิคต่อไปนี้' : 'The application you create in this exercise will use the following technical boundaries.'}>
        <ul className="locked-rules">{displayedRules.map((rule) => <li key={rule}><LockKeyhole aria-hidden="true" size={16} /> {rule}</li>)}</ul>
      </PhaseSection>
      <PhaseSection step="03" title={isThai ? 'ตรวจความสอดคล้องของขอบเขต' : 'SCOPE ALIGNMENT CHECK'} description={isThai ? 'ตรวจ Direction, Must Have และสิ่งที่ยังไม่ทำพร้อมกัน เพื่อไม่ให้ข้อเดียวกันถูกกำหนดว่า “ต้องมี” และ “ยังไม่ทำ”' : 'Review the direction, must-haves, and non-goals together so the same decision is not both included and excluded.'}>
        {overlapTerms.length ? <div className="alignment-warning" role="note">
          <strong>{isThai ? 'พบคำสำคัญที่ปรากฏทั้งสองฝั่ง' : 'SHARED SCOPE TERMS FOUND'}</strong>
          <p>{isThai ? `โปรดตรวจความหมายของ: ${overlapTerms.join(', ')} — คำที่ซ้ำไม่จำเป็นต้องผิด แต่ต้องไม่ทำให้ Product ตีความได้สองแบบ` : `Review: ${overlapTerms.join(', ')}. Repeated terms are not automatically wrong, but they must not create two interpretations.`}</p>
        </div> : null}
        <label className={draft.values.scopeAlignmentConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}>
          <input type="checkbox" checked={Boolean(draft.values.scopeAlignmentConfirmed)} onChange={(event) => draft.setField('scopeAlignmentConfirmed', event.target.checked)} />
          <Check size={19} />
          <span><strong>{isThai ? 'ฉันตรวจขอบเขตทั้งสามส่วนแล้ว' : 'I REVIEWED ALL THREE SCOPE AREAS'}</strong><small>{isThai ? 'Direction, Must Have และ Non-goal ไม่ขัดกัน และพร้อมส่งต่อไป Step S' : 'Direction, must-haves, and non-goals agree and can be handed to Step S.'}</small></span>
        </label>
      </PhaseSection>
      <ReviewGate title={isThai ? 'ตรวจขอบเขตของ Product' : 'SCOPE GATE'} question={isThai ? 'ถ้า Chat เสนอ Feature ใหม่ คุณจะตรวจ Scope ก่อนเพิ่มหรือไม่?' : 'If Chat suggests a new feature, will you check the scope before adding it?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole aria-hidden="true" size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'LOCKING…') : (isThai ? 'ยืนยันขอบเขต Product' : 'LOCK PRODUCT SCOPE')}</ArcadeButton>}>
        <dl><div><dt>{isThai ? 'เรากำลังจะสร้าง' : 'WE ARE BUILDING'}</dt><dd>{String(draft.values.direction)}</dd></div><div><dt>{isThai ? 'สิ่งที่ต้องมี' : 'MUST HAVE'}</dt><dd>{mustHaves.filter(Boolean).join(' · ')}</dd></div><div><dt>{isThai ? 'สิ่งที่ยังไม่ทำใน Version นี้' : 'NOT IN THIS VERSION'}</dt><dd>{nonGoals.filter(Boolean).join(' · ')}</dd></div></dl>
        {completion.isError ? <p className="field-error" role="alert">Lock scope ไม่สำเร็จ ข้อมูลยังไม่เปลี่ยนสถานะ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

function findScopeOverlapTerms(direction: string, mustHaves: string[], nonGoals: string[]) {
  const included = meaningfulTerms([direction, ...mustHaves].join(' '))
  const excluded = meaningfulTerms(nonGoals.join(' '))
  return [...included].filter((term) => excluded.has(term)).slice(0, 8)
}

function meaningfulTerms(value: string) {
  const ignored = new Set(['product', 'version', 'application', 'ระบบ', 'ผู้ใช้', 'สำหรับ', 'และ', 'หรือ', 'ที่'])
  return new Set((value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((term) => term.length >= 4 && !ignored.has(term)))
}

function ListEditor({ title, guideKey, items, limit, onChange, onRemove, onAdd }: { title: string; guideKey: string; items: string[]; limit?: number; onChange: (index: number, value: string) => void; onRemove: (index: number) => void; onAdd: () => void }) {
  const { language, isThai } = useLanguage()
  const guide = getFieldGuide(language, guideKey)
  return <section className="list-editor"><h3>{title}</h3>{guide ? <><p className="list-editor__question">{guide.question}</p><FieldGuideDetails guide={guide} label={isThai ? 'วิธีตอบและตัวอย่าง' : 'How to answer'} isThai={isThai} /></> : null}<ol>{items.map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span><input value={item} onChange={(event) => onChange(index, event.target.value)} aria-label={`${title} item ${index + 1}`} /><button type="button" onClick={() => onRemove(index)} aria-label={`${isThai ? 'ลบ' : 'Remove'} ${title} ${index + 1}`}><X size={17} /></button></li>)}</ol><button className="add-list-item" type="button" disabled={Boolean(limit && items.length >= limit)} onClick={onAdd}><Plus size={17} /> {isThai ? 'เพิ่มรายการ' : 'ADD ITEM'} {limit ? `(${items.length}/${limit})` : ''}</button></section>
}
