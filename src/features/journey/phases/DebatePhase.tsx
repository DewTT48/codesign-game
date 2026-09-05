import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { usePhaseDraft } from '../usePhaseDraft'

type Assumption = { text: string; stance: '' | 'agree' | 'challenge'; why: string; change: string }
const blankAssumption = (): Assumption => ({ text: '', stance: '', why: '', change: '' })
const initialDebate = { assumptions: [blankAssumption(), blankAssumption()] as unknown as Json, directionResult: '', whatChanged: '' }

const debateGuide = {
  th: {
    title: 'ขั้นนี้ไม่ได้ให้ AI เลือกแทนคุณ',
    intro: <>AI มีหน้าที่เปิดเผยมุมที่ Direction อาจมองข้าม ส่วนคุณมีหน้าที่ตัดสินใจว่าจะยอมรับความเสี่ยงนั้น หรือปรับ Direction <span className="keep-together">ก่อนสร้างจริง</span></>,
    steps: [
      ['01 · ให้ AI ท้าทาย', 'ใช้ Prompt Kit เพื่อหา 3–5 สมมติฐาน แล้วอ่าน Evidence, Failure\u00a0mode และ Impact เพื่อเข้าใจความเสี่ยง'],
      ['02 · เลือกเพียง 2 ข้อ', 'เลือกเฉพาะ ASSUMPTION สถานะ ASSUMED หรือ UNKNOWN จำนวน 2 ข้อที่สำคัญต่อ Direction มากที่สุด แล้วนำมากรอกโดยไม่ต้องคัดลอกบทวิเคราะห์ทั้งหมด'],
      ['03 · คุณเป็นคนตัดสินใจ', 'เลือก Agree หรือ Challenge พร้อมเขียนเหตุผลด้วยคำของคุณเอง แล้วสรุปว่า Direction เดิมยังอยู่หรือต้องเปลี่ยน'],
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
      ['QUESTION FOR OWNER', 'ตอบคำถามนี้ แล้วเลือก WE\u00a0AGREE หรือ WE\u00a0CHALLENGE'],
      ['OWNER REASON / WHAT SHOULD CHANGE', 'บันทึกเหตุผลของคุณ และสิ่งที่ต้องเปลี่ยนเมื่อ Challenge'],
    ],
    agree: 'ยอมรับเป็น Working\u00a0assumption เพื่อสร้างและทดสอบต่อ ไม่ได้แปลว่าเป็นข้อเท็จจริง',
    challenge: 'เห็นว่าเสี่ยงหรือไม่เหมาะเป็นฐานของ Product จึงต้องบันทึกเหตุผลและสิ่งที่จะเปลี่ยน',
    exampleTitle: 'ตัวอย่างสั้น ๆ',
    example: 'Chat: “ผู้ใช้พร้อมกลับมาทุกวันโดยไม่ต้องมีสิ่งเตือน” → นำประโยคนี้มากรอก → เลือก Challenge → เหตุผล: ผู้ใช้เหนื่อยและเคยเลิกใช้ Habit\u00a0app → เปลี่ยน: ไม่ใช้ Daily\u00a0streak เป็นแกนหลัก',
  },
  en: {
    title: 'AI does not make the decision in this step',
    intro: 'AI exposes what the direction may be overlooking. You decide whether to accept that risk or revise the direction before building.',
    steps: [
      ['01 · LET AI CHALLENGE', 'Use the Prompt Kit to find 3–5 assumptions. Read the evidence, failure mode, and impact to understand each risk.'],
      ['02 · CHOOSE ONLY 2', 'Bring back only critical ASSUMED or UNKNOWN items. Do not copy the full analysis into the form.'],
      ['03 · MAKE THE HUMAN DECISION', 'Choose Agree or Challenge, explain the reason in your own words, then decide whether the direction stays or changes.'],
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
      ['QUESTION FOR OWNER', 'Answer it, then choose WE AGREE or WE CHALLENGE.'],
      ['OWNER REASON / WHAT SHOULD CHANGE', 'Record your reason and the change when you challenge.'],
    ],
    agree: 'Accept it as a working assumption to build and test—not as a proven fact.',
    challenge: 'It is too risky or unsuitable as a foundation, so record why and what changes.',
    exampleTitle: 'Short example',
    example: 'Chat: “Users will return every day without a reminder” → copy that sentence → choose Challenge → reason: tired users have abandoned habit apps → change: do not make a daily streak the core mechanism.',
  },
} as const

export function DebatePhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'D', initialValues: initialDebate })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const assumptions = draft.values.assumptions as unknown as Assumption[]
  const guide = debateGuide[isThai ? 'th' : 'en']
  const completion = useMutation({ mutationFn: async () => { await draft.saveAll(); return completePhase(project.id, 'D') }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['project', project.id] }); navigate(`/projects/${project.id}/E`) } })
  function updateAssumption(index: number, patch: Partial<Assumption>) { draft.setField('assumptions', assumptions.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) as unknown as Json) }
  const ready = assumptions.every((item) => item.text.trim() && item.stance && item.why.trim() && (item.stance !== 'challenge' || item.change.trim())) && Boolean(String(draft.values.directionResult)) && Boolean(String(draft.values.whatChanged).trim())

  return (
    <JourneyLayout project={project} phase="D" phaseName="DEBATE" chatContext={draft.values} saveState={draft.saveState}>
      <aside className="debate-guide" aria-labelledby="debate-guide-title">
        <header>
          <span>HOW THIS STEP WORKS</span>
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

      <PhaseSection step="01" title="EXPOSE THE ASSUMPTIONS" description={isThai ? 'ใช้ Prompt Kit ค้นหาสิ่งที่ข้อเสนอถือว่าเป็นจริงโดยยังไม่มีหลักฐาน' : 'Use the Prompt Kit to expose what the proposal treats as true without evidence.'}>
        <div className="assumption-stack">
          {assumptions.map((assumption, index) => (
            <article className="assumption-card" key={index}>
              <FormField label={`DIRECTION ASSUMES THAT… ${index + 1}`} guideKey="debate.assumption" required><textarea rows={3} value={assumption.text} onChange={(event) => updateAssumption(index, { text: event.target.value })} /></FormField>
              <div className="stance-buttons">
                <button className={assumption.stance === 'agree' ? 'is-active' : ''} type="button" onClick={() => updateAssumption(index, { stance: 'agree', change: '' })}><strong>WE AGREE</strong><small>{guide.agree}</small></button>
                <button className={assumption.stance === 'challenge' ? 'is-active challenge' : ''} type="button" onClick={() => updateAssumption(index, { stance: 'challenge' })}><strong>WE CHALLENGE</strong><small>{guide.challenge}</small></button>
              </div>
              {assumption.stance ? <div className={`form-grid ${assumption.stance === 'challenge' ? 'form-grid--two' : ''} challenge-fields`}><FormField label={assumption.stance === 'agree' ? 'WHY ARE YOU ACCEPTING THIS RISK?' : 'WHY DO YOU CHALLENGE IT?'} guideKey={assumption.stance === 'agree' ? 'debate.agreeReason' : 'debate.challengeReason'} required><textarea rows={3} value={assumption.why} onChange={(event) => updateAssumption(index, { why: event.target.value })} /></FormField>{assumption.stance === 'challenge' ? <FormField label="WHAT SHOULD CHANGE?" guideKey="debate.change" required><textarea rows={3} value={assumption.change} onChange={(event) => updateAssumption(index, { change: event.target.value })} /></FormField> : null}</div> : null}
            </article>
          ))}
        </div>
      </PhaseSection>
      <PhaseSection step="02" title="RECONSIDER WITH CHAT" description={isThai ? 'ใช้ Locked Context และคำท้าทายของคุณพิจารณา Direction ใหม่' : 'Reconsider the direction using locked context and your challenges.'}>
        <div className="choice-grid choice-grid--two">
          {['OUR DIRECTION STAYED THE SAME', 'WE CHANGED OUR DIRECTION'].map((option) => <label className={draft.values.directionResult === option ? 'simple-choice is-active' : 'simple-choice'} key={option}><input type="radio" name="direction-result" checked={draft.values.directionResult === option} onChange={() => draft.setField('directionResult', option)} />{option}</label>)}
        </div>
        <FormField label="WHAT CHANGED AND WHY?" guideKey="debate.whatChanged" required><textarea rows={4} value={String(draft.values.whatChanged)} onChange={(event) => draft.setField('whatChanged', event.target.value)} /></FormField>
      </PhaseSection>
      <ReviewGate title="DEBATE COMPLETE" question={isThai ? 'คุณได้ท้าทายสิ่งที่ AI คาดไว้ และบันทึกเหตุผลของมนุษย์แล้วหรือยัง?' : 'Have you challenged AI assumptions and recorded the human reasoning?'} actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}>{completion.isPending ? 'LOCKING…' : 'ESTABLISH DIRECTION'} <ArrowRight aria-hidden="true" size={18} /></ArcadeButton>}>
        <p>{isThai ? 'ข้อเสนอเดิม สมมติฐาน เหตุผล และผลลัพธ์ใหม่จะอยู่ใน Journal โดยไม่เขียนทับกัน' : 'The original proposal, assumptions, reasoning, and revised result remain in the Journal.'}</p>
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'บันทึก Debate ไม่สำเร็จ กรุณาลองใหม่' : 'Could not save the debate. Please try again.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
