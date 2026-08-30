import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

type ProductOption = { name: string; coreIdea: string; like: string; tradeoff: string }
const emptyOption = (): ProductOption => ({ name: '', coreIdea: '', like: '', tradeoff: '' })
const initialOptions = { options: [emptyOption(), emptyOption(), emptyOption()] as unknown as Json, favorite: -1 }

export function OptionsPhase({ project }: { project: ProjectRow }) {
  const draft = usePhaseDraft({ projectId: project.id, phase: 'O', initialValues: initialOptions })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const options = draft.values.options as unknown as ProductOption[]
  const completion = useMutation({
    mutationFn: async () => { await draft.saveAll(); return completePhase(project.id, 'O') },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['project', project.id] }); navigate(`/projects/${project.id}/D`) },
  })

  function updateOption(index: number, key: keyof ProductOption, value: string) {
    const next = options.map((option, optionIndex) => optionIndex === index ? { ...option, [key]: value } : option)
    draft.setField('options', next as unknown as Json)
  }

  const ready = options.length >= 3 && options.every((option) => Object.values(option).every((value) => value.trim())) && Number(draft.values.favorite) >= 0

  return (
    <JourneyLayout project={project} phase="O" phaseName="OPTIONS" headline="DON'T FALL IN LOVE WITH THE FIRST IDEA." principle="Problem เดียวสามารถกลายเป็น Product ได้หลายแบบ" hint="ตัวเลือกที่ต่างกันจริงควรเปลี่ยนวิธีที่ผู้ใช้ไปถึง Goal ไม่ใช่แค่เปลี่ยนสี ชื่อ หรือรายละเอียดเล็กน้อย" chatMove="จาก Context ที่เรา Lock ไว้ ช่วยเสนอ Product direction อย่างน้อย 3 แบบที่แตกต่างกันจริง พร้อม trade-off ของแต่ละแบบ" saveState={draft.saveState}>
      <PhaseSection step="01" title="EXPAND THE POSSIBILITY SPACE" description="กลับไปที่ Chat conversation เดิม ขออย่างน้อย 3 Product directions ที่แตกต่างกันจริง">
        <div className="chat-mission-card"><span>CHAT MISSION</span><p>3+ DIRECTIONS · CORE IDEA · BENEFIT · TRADE-OFF</p><strong>EXPLORE BEFORE YOU CHOOSE.</strong></div>
      </PhaseSection>
      <PhaseSection step="02" title="CAPTURE YOUR OPTIONS">
        <div className="option-stack">
          {options.map((option, index) => (
            <article className="option-card" key={index}>
              <header><span>OPTION {String(index + 1).padStart(2, '0')}</span><label><input type="radio" name="favorite" checked={Number(draft.values.favorite) === index} onChange={() => draft.setField('favorite', index)} /> CURRENT FAVORITE</label></header>
              <div className="form-grid form-grid--two">
                <FormField label="OPTION NAME" required><input value={option.name} onChange={(event) => updateOption(index, 'name', event.target.value)} /></FormField>
                <FormField label="CORE IDEA" required><textarea rows={3} value={option.coreIdea} onChange={(event) => updateOption(index, 'coreIdea', event.target.value)} /></FormField>
                <FormField label="WHAT WE LIKE" required><textarea rows={3} value={option.like} onChange={(event) => updateOption(index, 'like', event.target.value)} /></FormField>
                <FormField label="TRADE-OFF" required><textarea rows={3} value={option.tradeoff} onChange={(event) => updateOption(index, 'tradeoff', event.target.value)} /></FormField>
              </div>
            </article>
          ))}
        </div>
      </PhaseSection>
      <ReviewGate title="HUMAN REVIEW" question="ตัวเลือกไหนเหมาะกับ Context ที่ Lock ไว้ที่สุด ไม่ใช่แค่ตัวเลือกที่ดูน่าสนใจที่สุด?" actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? 'SAVING…' : 'CONTINUE TO DEBATE'} <ArrowRight aria-hidden="true" size={18} /></ArcadeButton>}>
        {Number(draft.values.favorite) >= 0 ? <div className="favorite-summary"><Check size={18} /> <span><small>CURRENT FAVORITE — NOT YET LOCKED</small><strong>{options[Number(draft.values.favorite)]?.name}</strong></span></div> : <p>เลือก Current Favorite หลังเปรียบเทียบ trade-off ครบแล้ว</p>}
        {completion.isError ? <p className="field-error" role="alert">บันทึก Options ไม่สำเร็จ กรุณาลองใหม่</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
