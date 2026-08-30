import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

type ProductOption = { name: string; coreIdea: string; like: string; tradeoff: string }
const emptyOption = (): ProductOption => ({ name: '', coreIdea: '', like: '', tradeoff: '' })
const initialOptions = { options: [emptyOption(), emptyOption(), emptyOption()] as unknown as Json, favorite: -1 }

export function OptionsPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
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
    <JourneyLayout project={project} phase="O" phaseName="OPTIONS" chatContext={draft.values} saveState={draft.saveState}>
      <PhaseSection step="01" title="EXPAND THE POSSIBILITY SPACE" description={isThai ? 'ใช้ Prompt Kit ขออย่างน้อย 3 Product directions ที่ต่างกันในกลไกหลัก' : 'Use the Prompt Kit to create at least three directions with different core mechanisms.'}>
        <div className="chat-mission-card"><span>CHAT MISSION</span><p>3+ DIRECTIONS · CORE IDEA · BENEFIT · TRADE-OFF</p><strong>EXPLORE BEFORE YOU CHOOSE.</strong></div>
      </PhaseSection>
      <PhaseSection step="02" title="CAPTURE YOUR OPTIONS">
        <div className="option-stack">
          {options.map((option, index) => (
            <article className="option-card" key={index}>
              <header><span>OPTION {String(index + 1).padStart(2, '0')}</span><label><input type="radio" name="favorite" checked={Number(draft.values.favorite) === index} onChange={() => draft.setField('favorite', index)} /> CURRENT FAVORITE</label></header>
              <div className="form-grid form-grid--two">
                <FormField label="OPTION NAME" guideKey="options.name" required><input value={option.name} onChange={(event) => updateOption(index, 'name', event.target.value)} /></FormField>
                <FormField label="CORE IDEA" guideKey="options.coreIdea" required><textarea rows={3} value={option.coreIdea} onChange={(event) => updateOption(index, 'coreIdea', event.target.value)} /></FormField>
                <FormField label="WHAT WE LIKE" guideKey="options.like" required><textarea rows={3} value={option.like} onChange={(event) => updateOption(index, 'like', event.target.value)} /></FormField>
                <FormField label="TRADE-OFF" guideKey="options.tradeoff" required><textarea rows={3} value={option.tradeoff} onChange={(event) => updateOption(index, 'tradeoff', event.target.value)} /></FormField>
              </div>
            </article>
          ))}
        </div>
      </PhaseSection>
      <ReviewGate title="HUMAN REVIEW" question={isThai ? 'ตัวเลือกไหนเหมาะกับ Context ที่ Lock ไว้ที่สุด ไม่ใช่แค่ตัวเลือกที่ดูน่าสนใจที่สุด?' : 'Which option best fits the locked context—not merely the most exciting one?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? 'SAVING…' : 'CONTINUE TO DEBATE'} <ArrowRight aria-hidden="true" size={18} /></ArcadeButton>}>
        {Number(draft.values.favorite) >= 0 ? <div className="favorite-summary"><Check size={18} /> <span><small>CURRENT FAVORITE — NOT YET LOCKED</small><strong>{options[Number(draft.values.favorite)]?.name}</strong></span></div> : <p>{isThai ? 'เลือก Current Favorite หลังเปรียบเทียบ Trade-off ครบแล้ว' : 'Choose a current favorite after comparing every trade-off.'}</p>}
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'บันทึก Options ไม่สำเร็จ กรุณาลองใหม่' : 'Could not save options. Please try again.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
