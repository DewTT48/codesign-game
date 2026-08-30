import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LockKeyhole, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

const basicRules = ['Standalone Web App', 'Browser-based persistence allowed', 'No Auth in learner-built app', 'No Cloud Database', 'No Backend', 'No required paid/external service', 'GitHub Pages deployable']
const initialEstablish = { direction: '', mustHaves: ['', '', ''] as unknown as Json, nonGoals: ['', ''] as unknown as Json }

export function EstablishPhase({ project }: { project: ProjectRow }) {
  const draft = usePhaseDraft({ projectId: project.id, phase: 'E', initialValues: initialEstablish })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mustHaves = draft.values.mustHaves as unknown as string[]
  const nonGoals = draft.values.nonGoals as unknown as string[]
  const completion = useMutation({ mutationFn: async () => { await draft.saveAll(); return completePhase(project.id, 'E') }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['project', project.id] }); navigate(`/projects/${project.id}/S`) } })
  const updateList = (key: 'mustHaves' | 'nonGoals', index: number, value: string) => { const list = key === 'mustHaves' ? mustHaves : nonGoals; draft.setField(key, list.map((item, itemIndex) => itemIndex === index ? value : item) as unknown as Json) }
  const removeItem = (key: 'mustHaves' | 'nonGoals', index: number) => { const list = key === 'mustHaves' ? mustHaves : nonGoals; draft.setField(key, list.filter((_, itemIndex) => itemIndex !== index) as unknown as Json) }
  const addItem = (key: 'mustHaves' | 'nonGoals') => { const list = key === 'mustHaves' ? mustHaves : nonGoals; draft.setField(key, [...list, ''] as unknown as Json) }
  const ready = String(draft.values.direction).trim() && mustHaves.filter((item) => item.trim()).length >= 1 && nonGoals.filter((item) => item.trim()).length >= 2

  return (
    <JourneyLayout project={project} phase="E" phaseName="ESTABLISH" headline="EXPLORATION ENDS HERE." principle="ถึงเวลาหยุดเพิ่ม Option และตัดสินใจว่า Version นี้จะเป็นอะไร" hint="Must Have คือสิ่งที่ขาดแล้ว Product version นี้ไม่สามารถทำ Goal หลักได้ ส่วนสิ่งที่แค่ดูดีหรืออาจมีประโยชน์ยังไม่จำเป็นต้องเข้ามา" chatMove="ช่วยตรวจ scope นี้เทียบกับ Context ที่ Lock ไว้ ชี้ให้เห็นว่าอะไรจำเป็นจริง อะไรควรตัดออกจาก version แรก โดยอย่าเพิ่ม feature ใหม่" saveState={draft.saveState}>
      <PhaseSection step="01" title="DECISION BOARD">
        <FormField label="WE ARE BUILDING" hint="ONE CONCISE PRODUCT DIRECTION" required><textarea rows={4} value={String(draft.values.direction)} onChange={(event) => draft.setField('direction', event.target.value)} /></FormField>
        <div className="scope-columns">
          <ListEditor title="MUST HAVE" items={mustHaves} limit={8} onChange={(index, value) => updateList('mustHaves', index, value)} onRemove={(index) => removeItem('mustHaves', index)} onAdd={() => addItem('mustHaves')} />
          <ListEditor title="NOT IN THIS VERSION" items={nonGoals} onChange={(index, value) => updateList('nonGoals', index, value)} onRemove={(index) => removeItem('nonGoals', index)} onAdd={() => addItem('nonGoals')} />
        </div>
      </PhaseSection>
      <PhaseSection step="02" title="LOCKED BASIC BUILD RULES" description="ข้อจำกัดของ course นี้แก้ไขไม่ได้">
        <ul className="locked-rules">{basicRules.map((rule) => <li key={rule}><LockKeyhole aria-hidden="true" size={16} /> {rule}</li>)}</ul>
      </PhaseSection>
      <ReviewGate title="SCOPE GATE" question="ถ้า Chat เสนอ Feature ใหม่หลังจากนี้ คุณพร้อมจะไม่เพิ่มมันโดยอัตโนมัติหรือยัง?" actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole aria-hidden="true" size={18} /> {completion.isPending ? 'LOCKING…' : 'LOCK PRODUCT SCOPE'}</ArcadeButton>}>
        <dl><div><dt>WE ARE BUILDING</dt><dd>{String(draft.values.direction)}</dd></div><div><dt>MUST HAVE</dt><dd>{mustHaves.filter(Boolean).join(' · ')}</dd></div><div><dt>NOT IN THIS VERSION</dt><dd>{nonGoals.filter(Boolean).join(' · ')}</dd></div></dl>
        {completion.isError ? <p className="field-error" role="alert">Lock scope ไม่สำเร็จ ข้อมูลยังไม่เปลี่ยนสถานะ</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

function ListEditor({ title, items, limit, onChange, onRemove, onAdd }: { title: string; items: string[]; limit?: number; onChange: (index: number, value: string) => void; onRemove: (index: number) => void; onAdd: () => void }) {
  return <section className="list-editor"><h3>{title}</h3><ol>{items.map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span><input value={item} onChange={(event) => onChange(index, event.target.value)} aria-label={`${title} item ${index + 1}`} /><button type="button" onClick={() => onRemove(index)} aria-label={`ลบ ${title} ข้อ ${index + 1}`}><X size={17} /></button></li>)}</ol><button className="add-list-item" type="button" disabled={Boolean(limit && items.length >= limit)} onClick={onAdd}><Plus size={17} /> ADD ITEM {limit ? `(${items.length}/${limit})` : ''}</button></section>
}
