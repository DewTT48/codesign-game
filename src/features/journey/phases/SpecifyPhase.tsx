import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { ReorderableList } from '../ReorderableList'
import { DailyContentEditor } from '../specify/DailyContentEditor'
import { ExperienceSelector } from '../specify/ExperienceSelector'
import { SpecifyImportPanel } from '../specify/SpecifyImportPanel'
import {
  countCompleteDays,
  createDailyContent,
  mergeDailyContent,
  normalizeContentArcs,
  normalizeDailyContent,
  normalizeExperienceOptions,
  starterContentArcs,
  starterExperienceOptions,
  type ContentArc,
  type DailyContent,
  type ExperienceOption,
} from '../specify/specifyModel'
import { usePhaseDraft } from '../usePhaseDraft'

type ScreenSpec = { name: string; sees: string; actions: string; next: string }

const initialSpecify = {
  specificationVersion: 2,
  productLanguage: 'th',
  brandCopy: '21 DAYS OF',
  journeySummary: '',
  dailyCompletionRule: '',
  returnRule: 'allow-edit',
  sequenceRule: 'sequential',
  storageRule: 'browser-device',
  dailyDuration: '5–10 นาที',
  contentArcs: starterContentArcs as unknown as Json,
  contentPattern: '',
  exercisePattern: '',
  recordPattern: '',
  dailyContent: createDailyContent() as unknown as Json,
  contentOwnerConfirmed: false,
  experienceOptions: starterExperienceOptions as unknown as Json,
  selectedExperience: '',
  experienceOwnerConfirmed: false,
  advancedNotes: '',
  acceptanceCriteria: [] as unknown as Json,
  // Legacy fields remain readable so existing projects keep their work.
  flowSteps: ['START', '', 'RESULT'] as unknown as Json,
  screens: [] as unknown as Json,
  contentReadiness: 'need',
  dayFields: ['Day Number', 'Title', 'Activity'] as unknown as Json,
  contentImplementationReady: '',
  browserState: ['Completed days'] as unknown as Json,
  feelWords: [] as unknown as Json,
  customFeel: '',
  visualStyle: '',
  primaryColorRole: '',
  accentColorRole: '',
  background: '',
  surface: '',
  interactionTone: '',
  typography: '',
  visualRationale: '',
  persistenceRule: '',
  revisitRule: '',
  skipRule: '',
  emptyRule: '',
  editRule: '',
  resetRule: '',
  mobileRule: '',
}

export function SpecifyPhase({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'S', initialValues: initialSpecify })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const arcs = normalizeContentArcs(draft.values.contentArcs)
  const days = normalizeDailyContent(draft.values.dailyContent)
  const experienceOptions = normalizeExperienceOptions(draft.values.experienceOptions)
  const completeDays = countCompleteDays(days)
  const legacyFlow = asStringList(draft.values.flowSteps).filter((item) => item && !['START', 'RESULT'].includes(item))
  const journeySummary = String(draft.values.journeySummary).trim() || legacyFlow.join(' → ')
  const selectedExperience = String(draft.values.selectedExperience)
  const acceptanceCriteria = asStringList(draft.values.acceptanceCriteria)

  const issues = [
    !journeySummary && (isThai ? 'อธิบายเส้นทางหลักของผู้ใช้' : 'Describe the primary user journey'),
    !String(draft.values.dailyCompletionRule).trim() && (isThai ? 'กำหนดว่าอะไรทำให้หนึ่งวันสำเร็จ' : 'Define what completes one day'),
    arcs.some((arc) => !arc.title.trim() || !arc.goal.trim()) && (isThai ? 'ตั้งชื่อและเป้าหมายของ Content ทั้ง 3 ช่วง' : 'Name and define all three content arcs'),
    !String(draft.values.contentPattern).trim() && (isThai ? 'กำหนดรูปแบบเนื้อหาประจำวัน' : 'Define the daily content pattern'),
    !String(draft.values.exercisePattern).trim() && (isThai ? 'กำหนดรูปแบบแบบฝึก' : 'Define the exercise pattern'),
    !String(draft.values.recordPattern).trim() && (isThai ? 'กำหนดสิ่งที่ผู้ใช้ต้องบันทึก' : 'Define what the user records'),
    completeDays < 21 && (isThai ? `เติม Daily Content ให้ครบ — ตอนนี้พร้อม ${completeDays}/21 วัน` : `Complete the Daily Content Pack — ${completeDays}/21 days ready`),
    !draft.values.contentOwnerConfirmed && (isThai ? 'ยืนยันว่าได้ตรวจ Content Pack แล้ว' : 'Confirm that the Content Pack has been reviewed'),
    !selectedExperience && (isThai ? 'เลือก Experience Direction' : 'Choose an Experience Direction'),
    !draft.values.experienceOwnerConfirmed && (isThai ? 'ยืนยัน Experience Direction' : 'Confirm the Experience Direction'),
  ].filter((issue): issue is string => Boolean(issue))

  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll()
      return completePhase(project.id, 'S')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/PRD`)
    },
  })

  const updateArc = (index: number, key: keyof ContentArc, value: string) => {
    draft.setField('contentArcs', arcs.map((arc, itemIndex) => itemIndex === index ? { ...arc, [key]: value } : arc) as unknown as Json)
  }

  const updateDays = (next: DailyContent[]) => {
    draft.setField('dailyContent', next as unknown as Json)
    draft.setField('contentOwnerConfirmed', false)
  }

  const updateExperience = (next: ExperienceOption[]) => {
    draft.setField('experienceOptions', next as unknown as Json)
    draft.setField('experienceOwnerConfirmed', false)
  }

  return (
    <JourneyLayout project={project} phase="S" phaseName="SPECIFY" chatContext={draft.values} saveState={draft.saveState}>
      <section className="specify-intro">
        <span>HOW THIS MISSION WORKS</span>
        <h2>{isThai ? 'คุณกำหนดทิศทาง ส่วนรายละเอียดจำนวนมากให้ Chat ช่วยร่าง' : 'You set the direction. Let Chat draft the detail.'}</h2>
        <ol>
          <li><strong>01</strong>{isThai ? 'ตัดสินใจเฉพาะกติกาที่เปลี่ยน Product' : 'Decide only the rules that change the product.'}</li>
          <li><strong>02</strong>{isThai ? 'ใช้ Prompt Kit คุยกับ AI ภายนอก' : 'Use the Prompt Kit with an external AI.'}</li>
          <li><strong>03</strong>{isThai ? 'นำ Markdown กลับมาตรวจและยืนยันด้วยตัวเอง' : 'Bring Markdown back, review it, and decide.'}</li>
        </ol>
        <p>{isThai ? 'CODESIGN ไม่ได้ส่งข้อมูลไปหา AI และจะไม่เลือกแทนคุณ' : 'CODESIGN does not send data to AI and will not choose for you.'}</p>
      </section>

      <PhaseSection step="S1" title="JOURNEY & PRODUCT RULES" description={isThai ? 'กำหนดเฉพาะกติกาที่มีผลต่อประสบการณ์จริง รายละเอียดเชิงเทคนิคให้ Codex ตัดสินใจได้' : 'Define only rules that change the real experience. Codex can decide implementation details.'}>
        <FormField label="PRODUCT LANGUAGE" required hint={isThai ? 'ภาษาที่ผู้ใช้ปลายทางจะเห็นใน Product นี้' : 'The language shown in the product you are building'}>
          <div className="choice-grid choice-grid--three">
            {[
              ['th', 'ภาษาไทย', 'THAI'],
              ['en', 'ภาษาอังกฤษ', 'ENGLISH'],
              ['bilingual', 'สองภาษา', 'BILINGUAL'],
            ].map(([value, thaiLabel, englishLabel]) => (
              <label className={draft.values.productLanguage === value ? 'simple-choice is-active' : 'simple-choice'} key={value}>
                <input type="radio" name="product-language" checked={draft.values.productLanguage === value} onChange={() => draft.setField('productLanguage', value)} />
                {isThai ? thaiLabel : englishLabel}
              </label>
            ))}
          </div>
        </FormField>
        <div className="form-grid form-grid--two">
          <FormField label="BRAND COPY" hint={isThai ? 'ข้อความที่ต้องคงรูปเดิมและไม่แปล' : 'Copy that must remain unchanged'}><input value={String(draft.values.brandCopy)} onChange={(event) => draft.setField('brandCopy', event.target.value)} /></FormField>
          <FormField label="TIME PER DAY" required hint={isThai ? 'เวลาที่เหมาะกับบริบทของผู้ใช้' : 'A duration that fits the user context'}><input value={String(draft.values.dailyDuration)} onChange={(event) => draft.setField('dailyDuration', event.target.value)} /></FormField>
        </div>
        <FormField label="PRIMARY JOURNEY" required hint={isThai ? 'เขียนเป็นเส้นทางสั้น ๆ ตั้งแต่เปิด App จนเห็นความคืบหน้า' : 'Describe the short path from opening the app to seeing progress'}>
          <textarea rows={4} value={String(draft.values.journeySummary) || legacyFlow.join(' → ')} onChange={(event) => draft.setField('journeySummary', event.target.value)} />
        </FormField>
        <FormField label="ONE DAY IS COMPLETE WHEN…" required hint={isThai ? 'ระบุการกระทำที่สังเกตและตรวจได้' : 'Use an observable, testable action'}>
          <textarea rows={3} value={String(draft.values.dailyCompletionRule)} onChange={(event) => draft.setField('dailyCompletionRule', event.target.value)} />
        </FormField>
        <div className="form-grid form-grid--three rule-select-grid">
          <label><span>{isThai ? 'ย้อนกลับมาแก้คำตอบ' : 'RETURN TO EARLIER DAYS'}</span><select value={String(draft.values.returnRule)} onChange={(event) => draft.setField('returnRule', event.target.value)}><option value="allow-edit">{isThai ? 'กลับมาอ่านและแก้ได้' : 'READ AND EDIT'}</option><option value="read-only">{isThai ? 'กลับมาอ่านได้อย่างเดียว' : 'READ ONLY'}</option><option value="no-revisit">{isThai ? 'ย้อนกลับไม่ได้' : 'NO REVISIT'}</option></select></label>
          <label><span>{isThai ? 'ลำดับการทำ' : 'DAY SEQUENCE'}</span><select value={String(draft.values.sequenceRule)} onChange={(event) => draft.setField('sequenceRule', event.target.value)}><option value="sequential">{isThai ? 'ทำตามลำดับ' : 'IN ORDER'}</option><option value="allow-skip">{isThai ? 'เลือกหรือข้ามวันได้' : 'ALLOW SKIPPING'}</option></select></label>
          <label><span>{isThai ? 'การจำข้อมูล' : 'SAVE BEHAVIOR'}</span><select value={String(draft.values.storageRule)} onChange={(event) => draft.setField('storageRule', event.target.value)}><option value="browser-device">{isThai ? 'จำไว้ใน Browser เครื่องนี้' : 'SAVE IN THIS BROWSER'}</option><option value="session-only">{isThai ? 'เก็บเฉพาะตอนเปิดใช้งาน' : 'THIS SESSION ONLY'}</option></select></label>
        </div>
      </PhaseSection>

      <PhaseSection step="S2" title="CONTENT BLUEPRINT" description={isThai ? 'วางเส้นทางการเรียนรู้ก่อนให้ Chat ช่วยร่างเนื้อหา 21 วัน' : 'Set the learning progression before Chat drafts all 21 days.'}>
        <div className="content-arc-grid">
          {arcs.map((arc, index) => (
            <article key={arc.range}>
              <span>{arc.range}</span>
              <label><strong>{isThai ? 'ชื่อช่วง' : 'ARC NAME'}</strong><input value={arc.title} onChange={(event) => updateArc(index, 'title', event.target.value)} /></label>
              <label><strong>{isThai ? 'เป้าหมายของช่วงนี้' : 'ARC GOAL'}</strong><textarea rows={3} value={arc.goal} onChange={(event) => updateArc(index, 'goal', event.target.value)} /></label>
            </article>
          ))}
        </div>
        <div className="form-grid form-grid--three content-pattern-grid">
          <FormField label="DAILY CONTENT" required hint={isThai ? 'เนื้อหาประจำวันควรสั้นและมีรูปแบบอย่างไร' : 'How short daily content should work'}><textarea rows={4} value={String(draft.values.contentPattern)} onChange={(event) => draft.setField('contentPattern', event.target.value)} /></FormField>
          <FormField label="DAILY EXERCISE" required hint={isThai ? 'ผู้ใช้จะคิด เลือก หรือทำอะไร' : 'What the user will think, choose, or do'}><textarea rows={4} value={String(draft.values.exercisePattern)} onChange={(event) => draft.setField('exercisePattern', event.target.value)} /></FormField>
          <FormField label="DAILY RECORD" required hint={isThai ? 'แต่ละวันต้องบันทึกคำตอบหรือหลักฐานอะไร' : 'What answer or evidence is saved each day'}><textarea rows={4} value={String(draft.values.recordPattern)} onChange={(event) => draft.setField('recordPattern', event.target.value)} /></FormField>
        </div>
      </PhaseSection>

      <PhaseSection step="S3" title="DAILY CONTENT PACK" description={isThai ? 'ใช้ Prompt Kit ให้ AI ภายนอกร่าง จากนั้นนำ Markdown กลับมาตรวจ เนื้อหาจะไม่ถูกส่งออกจาก CODESIGN อัตโนมัติ' : 'Let an external AI draft it with the Prompt Kit, then bring Markdown back for review. CODESIGN never sends it automatically.'}>
        <SpecifyImportPanel
          onApplyDays={(incoming, mode) => updateDays(mergeDailyContent(days, incoming, mode))}
          onApplyExperience={(incoming) => {
            updateExperience(incoming)
            draft.setField('selectedExperience', '')
          }}
        />
        <div className="content-pack-progress"><span>{isThai ? 'CONTENT พร้อม' : 'CONTENT READY'}</span><strong>{completeDays}/21</strong><div><i style={{ width: `${(completeDays / 21) * 100}%` }} /></div></div>
        <DailyContentEditor days={days} onChange={updateDays} />
        <label className={draft.values.contentOwnerConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}>
          <input type="checkbox" disabled={completeDays < 21} checked={Boolean(draft.values.contentOwnerConfirmed)} onChange={(event) => draft.setField('contentOwnerConfirmed', event.target.checked)} />
          <Check size={19} />
          <span><strong>{isThai ? 'ฉันตรวจ Content Pack แล้ว' : 'I REVIEWED THE CONTENT PACK'}</strong><small>{isThai ? 'ยืนยันว่าเนื้อหา แบบฝึก และแบบบันทึกตรงกับ Product ที่ต้องการ' : 'The content, exercises, and records match the intended product.'}</small></span>
        </label>
      </PhaseSection>

      <PhaseSection step="S4" title="EXPERIENCE DIRECTION" description={isThai ? 'เลือกจากภาพรวมที่เห็นจริง คุณกำลังกำหนดทิศทาง ไม่ได้ออกแบบทุกหน้าด้วยตัวเอง' : 'Choose from a visible preview. You are setting a direction, not designing every screen.'}>
        <ExperienceSelector options={experienceOptions} selectedName={selectedExperience} onSelect={(name) => { draft.setField('selectedExperience', name); draft.setField('experienceOwnerConfirmed', false) }} onChange={updateExperience} />
        <label className={draft.values.experienceOwnerConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}>
          <input type="checkbox" disabled={!selectedExperience} checked={Boolean(draft.values.experienceOwnerConfirmed)} onChange={(event) => draft.setField('experienceOwnerConfirmed', event.target.checked)} />
          <Check size={19} />
          <span><strong>{isThai ? 'ฉันเลือก Experience Direction นี้' : 'I CHOOSE THIS EXPERIENCE DIRECTION'}</strong><small>{isThai ? 'Theme นี้เป็นการตัดสินใจของฉัน ไม่ใช่สิ่งที่ AI เลือกแทน' : 'This theme is my decision, not a choice made for me by AI.'}</small></span>
        </label>
        <details className="advanced-specification">
          <summary>{isThai ? 'Advanced Specification — เปิดเมื่ออยากกำหนดรายละเอียดเพิ่ม' : 'ADVANCED SPECIFICATION — OPTIONAL DETAILS'}</summary>
          <p>{isThai ? 'หากปล่อยว่าง Codex สามารถตัดสินใจรายละเอียดการจัดหน้าจอ การรองรับ Mobile, Empty state และ Error state ภายใน Product Rules ที่ Lock แล้วได้' : 'If left blank, Codex may decide screens, mobile layout, empty states, and error states within the locked product rules.'}</p>
          <FormField label="ADDITIONAL BUILD NOTES"><textarea rows={5} value={String(draft.values.advancedNotes)} onChange={(event) => draft.setField('advancedNotes', event.target.value)} /></FormField>
          <ReorderableList title="OWNER-WRITTEN ACCEPTANCE CRITERIA — OPTIONAL" guideKey="spec.acceptance" items={acceptanceCriteria} minimum={0} maximum={8} placeholder="User can… / App remembers…" onChange={(items) => draft.setField('acceptanceCriteria', items as unknown as Json)} />
        </details>
      </PhaseSection>

      <ReviewGate
        title="SPECIFICATION QUALITY GATE"
        question={isThai ? <>เนื้อหาและ Experience พร้อมส่งต่อ<br />โดยไม่ให้ Codex เดา Product decision แล้วหรือยัง?</> : <>Are the content and experience ready<br />without making Codex guess product decisions?</>}
        actions={<ArcadeButton disabled={issues.length > 0 || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? 'SOLIDIFYING…' : 'SOLIDIFY SPECIFICATION'}</ArcadeButton>}
      >
        {issues.length ? <><p>{isThai ? `ยังเหลือ ${issues.length} เรื่องก่อนส่งต่อ` : `${issues.length} items remain before handoff`}</p><ul className="spec-quality-list">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></> : <p>{isThai ? 'Journey, Content และ Experience พร้อมสำหรับ Final Handoff' : 'Journey, content, and experience are ready for Final Handoff.'}</p>}
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'Solidify ไม่สำเร็จ ข้อมูลยังไม่ถูก Lock' : 'Solidify failed. Your data remains unlocked.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

function asStringList(value: Json | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export type { ScreenSpec }
