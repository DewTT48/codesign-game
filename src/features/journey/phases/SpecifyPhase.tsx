import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { useLanguage } from '../../i18n/LanguageContext'
import { CrossStepAlignment } from '../CrossStepAlignment'
import { normalizeAlignmentStatus } from '../crossStepAlignmentModel'
import { completePhase, getPrdSource } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { ReorderableList } from '../ReorderableList'
import { DailyContentEditor } from '../specify/DailyContentEditor'
import { ExperienceSelector } from '../specify/ExperienceSelector'
import { GuidedRuleField } from '../specify/GuidedRuleField'
import { SpecifyImportPanel } from '../specify/SpecifyImportPanel'
import type { OwnerSpecificationImport, SpecifyMarkdownImport } from '../specify/markdownImport'
import { getProductRuleAdvisory, getProductRulePresets, resolveProductRuleText } from '../specify/productRuleModel'
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
  returnRule: '',
  sequenceRule: '',
  storageRule: '',
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
  alignmentStatus: '',
  alignmentNote: '',
  alignmentConfirmed: false,
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
  const { language, isThai } = useLanguage()
  const draft = usePhaseDraft({ projectId: project.id, phase: 'S', initialValues: initialSpecify })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inherited = useQuery({ queryKey: ['prd-source', project.id], queryFn: () => getPrdSource(project.id) })
  const arcs = normalizeContentArcs(draft.values.contentArcs)
  const days = normalizeDailyContent(draft.values.dailyContent)
  const experienceOptions = normalizeExperienceOptions(draft.values.experienceOptions)
  const completeDays = countCompleteDays(days)
  const legacyFlow = asStringList(draft.values.flowSteps).filter((item) => item && !['START', 'RESULT'].includes(item))
  const journeySummary = String(draft.values.journeySummary).trim() || legacyFlow.join(' → ')
  const selectedExperience = String(draft.values.selectedExperience)
  const acceptanceCriteria = asStringList(draft.values.acceptanceCriteria)
  const alignmentStatus = normalizeAlignmentStatus(draft.values.alignmentStatus)
  const alignmentNote = String(draft.values.alignmentNote).trim()
  const inheritedDirection = String(inherited.data?.E?.direction ?? '').trim()
  const inheritedMustHaves = asStringList(inherited.data?.E?.mustHaves)
  const inheritedNonGoals = asStringList(inherited.data?.E?.nonGoals)
  const returnRuleText = resolveProductRuleText('return', draft.values.returnRule, language)
  const sequenceRuleText = resolveProductRuleText('sequence', draft.values.sequenceRule, language)
  const storageRuleText = resolveProductRuleText('storage', draft.values.storageRule, language)

  const issues = [
    !journeySummary && (isThai ? 'อธิบายเส้นทางหลักของผู้ใช้' : 'Describe the primary user journey'),
    !String(draft.values.dailyCompletionRule).trim() && (isThai ? 'กำหนดว่าอะไรทำให้หนึ่งวันสำเร็จ' : 'Define what completes one day'),
    !returnRuleText && (isThai ? 'กำหนดกติกาการกลับมาใช้งาน' : 'Define the rule for returning to earlier work'),
    !sequenceRuleText && (isThai ? 'กำหนดกติกาการเข้าถึงเนื้อหา' : 'Define the content access rule'),
    !storageRuleText && (isThai ? 'กำหนดกติกาการบันทึกข้อมูล' : 'Define the data retention rule'),
    arcs.some((arc) => !arc.title.trim() || !arc.goal.trim()) && (isThai ? 'ตั้งชื่อและเป้าหมายของ Content ทั้ง 3 ช่วง' : 'Name and define all three content arcs'),
    !String(draft.values.contentPattern).trim() && (isThai ? 'กำหนดรูปแบบเนื้อหาประจำวัน' : 'Define the daily content pattern'),
    !String(draft.values.exercisePattern).trim() && (isThai ? 'กำหนดรูปแบบแบบฝึก' : 'Define the exercise pattern'),
    !String(draft.values.recordPattern).trim() && (isThai ? 'กำหนดสิ่งที่ผู้ใช้ต้องบันทึก' : 'Define what the user records'),
    completeDays < 21 && (isThai ? `เติม Daily Content ให้ครบ — ตอนนี้พร้อม ${completeDays}/21 วัน` : `Complete the Daily Content Pack — ${completeDays}/21 days ready`),
    !draft.values.contentOwnerConfirmed && (isThai ? 'ยืนยันว่าได้ตรวจ Content Pack แล้ว' : 'Confirm that the Content Pack has been reviewed'),
    !selectedExperience && (isThai ? 'เลือก Experience Direction' : 'Choose an Experience Direction'),
    !draft.values.experienceOwnerConfirmed && (isThai ? 'ยืนยัน Experience Direction' : 'Confirm the Experience Direction'),
    inherited.isLoading && (isThai ? 'รอโหลดขอบเขตที่ยืนยันจาก Step E' : 'Wait for the locked Step E scope'),
    inherited.isError && (isThai ? 'โหลดขอบเขตจาก Step E ไม่สำเร็จ' : 'Could not load the Step E scope'),
    !alignmentStatus && (isThai ? 'เลือกว่า Step S สอดคล้องหรือเปลี่ยนแปลง Step E' : 'Classify how Step S relates to Step E'),
    alignmentStatus === 'clarifies' && !alignmentNote && (isThai ? 'อธิบายสิ่งที่ Step S ทำให้ชัดขึ้น' : 'Describe what Step S clarifies'),
    alignmentStatus === 'revision' && (isThai ? 'สร้าง Revision ที่ Step E ก่อนยืนยัน Step S' : 'Create a Step E revision before locking Step S'),
    alignmentStatus !== 'revision' && !draft.values.alignmentConfirmed && (isThai ? 'ยืนยันการส่งต่อข้อมูลจาก Step E ไป Step S' : 'Confirm the Step E to Step S handoff'),
  ].filter((issue): issue is string => Boolean(issue))

  const resetAlignment = () => draft.setField('alignmentConfirmed', false)
  const setSpecificationField = <K extends keyof typeof initialSpecify>(key: K, value: (typeof initialSpecify)[K]) => {
    draft.setField(key, value)
    resetAlignment()
  }

  const completion = useMutation({
    mutationFn: async () => {
      await draft.saveAll({
        returnRule: returnRuleText,
        sequenceRule: sequenceRuleText,
        storageRule: storageRuleText,
      })
      return completePhase(project.id, 'S')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      navigate(`/projects/${project.id}/PRD`)
    },
  })

  const updateArc = (index: number, key: keyof ContentArc, value: string) => {
    draft.setField('contentArcs', arcs.map((arc, itemIndex) => itemIndex === index ? { ...arc, [key]: value } : arc) as unknown as Json)
    resetAlignment()
  }

  const updateDays = (next: DailyContent[]) => {
    draft.setField('dailyContent', next as unknown as Json)
    draft.setField('contentOwnerConfirmed', false)
    resetAlignment()
  }

  const updateExperience = (next: ExperienceOption[]) => {
    draft.setField('experienceOptions', next as unknown as Json)
    draft.setField('experienceOwnerConfirmed', false)
    resetAlignment()
  }

  const applyOwnerSpecification = (incoming: OwnerSpecificationImport, mode: 'empty' | 'replace') => {
    const setText = (
      key: 'productLanguage' | 'brandCopy' | 'journeySummary' | 'dailyCompletionRule' | 'returnRule' | 'sequenceRule' | 'storageRule' | 'dailyDuration' | 'contentPattern' | 'exercisePattern' | 'recordPattern',
      value: string,
    ) => {
      if (value.trim() && (mode === 'replace' || !String(draft.values[key]).trim())) draft.setField(key, value)
    }

    setText('productLanguage', incoming.productLanguage)
    setText('brandCopy', incoming.brandCopy)
    setText('journeySummary', incoming.journeySummary)
    setText('dailyCompletionRule', incoming.dailyCompletionRule)
    setText('returnRule', incoming.returnRule)
    setText('sequenceRule', incoming.sequenceRule)
    setText('storageRule', incoming.storageRule)
    setText('dailyDuration', incoming.dailyDuration)
    setText('contentPattern', incoming.contentPattern)
    setText('exercisePattern', incoming.exercisePattern)
    setText('recordPattern', incoming.recordPattern)

    const nextArcs = arcs.map((arc, index) => ({
      ...arc,
      title: mode === 'replace'
        ? incoming.contentArcs[index]?.title.trim() || arc.title
        : arc.title.trim() || incoming.contentArcs[index]?.title || '',
      goal: mode === 'replace'
        ? incoming.contentArcs[index]?.goal.trim() || arc.goal
        : arc.goal.trim() || incoming.contentArcs[index]?.goal || '',
    }))
    if (nextArcs.some((arc) => arc.title.trim() || arc.goal.trim())) draft.setField('contentArcs', nextArcs as unknown as Json)
    if (incoming.alignmentStatus) draft.setField('alignmentStatus', incoming.alignmentStatus)
    if (incoming.alignmentNote.trim()) draft.setField('alignmentNote', incoming.alignmentNote)
    resetAlignment()
  }

  const applyImport = (incoming: SpecifyMarkdownImport, mode: 'empty' | 'replace') => {
    if (incoming.ownerSpecification) applyOwnerSpecification(incoming.ownerSpecification, mode)
    if (incoming.days.length) updateDays(mergeDailyContent(days, incoming.days, mode))
    if (incoming.experienceOptions.length && (mode === 'replace' || experienceOptions.every((option) => option.source === 'starter'))) {
      updateExperience(incoming.experienceOptions)
      draft.setField('selectedExperience', '')
    }
    resetAlignment()
  }

  return (
    <JourneyLayout
      project={project}
      phase="S"
      phaseName="SPECIFY"
      chatContext={{
        ...draft.values,
        returnRule: returnRuleText,
        sequenceRule: sequenceRuleText,
        storageRule: storageRuleText,
      }}
      saveState={draft.saveState}
    >
      <section className="specify-intro">
        <span>{isThai ? 'เริ่มจาก Prompt ด้านบน แล้วนำไฟล์ที่ AI สร้างกลับมา' : 'START WITH THE PROMPT ABOVE, THEN BRING BACK THE AI-GENERATED FILE'}</span>
        <h2>{isThai ? 'CODESIGN เตรียม Prompt ให้ — คุณนำไปคุยกับ AI และนำผลลัพธ์กลับมา' : 'CODESIGN PREPARES THE PROMPT — YOU TAKE IT TO AI AND BRING THE RESULT BACK.'}</h2>
        <ol>
          <li><strong>01</strong><span>{isThai ? <>กด <span className="keep-together">“เริ่มที่นี่: เปิด Prompt สำหรับ AI”</span> ด้านบน แล้วกด <span className="keep-together">“คัดลอก Prompt”</span></> : <>Open <span className="keep-together">“Start here: AI Prompt”</span> above, then copy the prompt.</>}</span></li>
          <li><strong>02</strong><span>{isThai ? <>เปิด AI ที่คุณเลือก เช่น <span className="keep-together">ChatGPT, Gemini</span> หรือ Claude แล้ววาง Prompt เพื่อเริ่มสนทนา</> : <>Open an AI of your choice, such as <span className="keep-together">ChatGPT, Gemini,</span> or Claude, then paste the prompt.</>}</span></li>
          <li><strong>03</strong><span>{isThai ? 'เลือกแนวทาง ตรวจร่างทีละ 7 วัน และขอแก้จนตรงกับสิ่งที่คุณต้องการ' : 'Choose a direction and review the draft in seven-day batches until it matches your intent.'}</span></li>
          <li><strong>04</strong><span>{isThai ? <>เมื่อพอใจ พิมพ์ <span className="keep-together">“ยืนยันร่างทั้งหมด”</span> แล้วพิมพ์ <span className="keep-together">“สร้างไฟล์ CODESIGN_SPEC.md”</span></> : <>When ready, type <span className="keep-together">“APPROVE COMPLETE DRAFT”</span>, then <span className="keep-together">“CREATE CODESIGN_SPEC.md”</span>.</>}</span></li>
          <li><strong>05</strong><span>{isThai ? 'ดาวน์โหลดไฟล์จาก AI แล้วกลับมาอัปโหลดด้านล่าง หากไม่มีไฟล์ให้คัดลอก Markdown มาวางแทน' : 'Download the file from AI and upload it below. If no file is available, paste the Markdown instead.'}</span></li>
        </ol>
        <p>{isThai ? 'ไฟล์ไม่ได้ถูกสร้างใน CODESIGN: ระบบเตรียม Prompt ให้ แต่คุณต้องนำ Prompt ไปใช้กับ AI ภายนอกด้วยตัวเอง' : 'The file is not created inside CODESIGN. CODESIGN prepares the prompt, and you take it to an external AI yourself.'}</p>
      </section>

      <SpecifyImportPanel onApplyImport={applyImport} />

      <PhaseSection step="S1" title={isThai ? 'ตรวจเส้นทางและกติกาของ Product' : 'REVIEW JOURNEY & PRODUCT RULES'} description={isThai ? 'ตรวจสิ่งที่นำเข้าจาก AI แล้วแก้เฉพาะจุดที่ไม่ตรงกับการตัดสินใจของคุณ' : 'Review the imported decisions and edit anything that does not match your intent.'}>
        <FormField label={isThai ? 'ภาษาของ Product' : 'PRODUCT LANGUAGE'} required hint={isThai ? 'ภาษาที่ผู้ใช้ปลายทางจะเห็นใน Product นี้' : 'The language shown in the product you are building'}>
          <div className="choice-grid choice-grid--three">
            {[
              ['th', 'ภาษาไทย', 'THAI'],
              ['en', 'ภาษาอังกฤษ', 'ENGLISH'],
              ['bilingual', 'สองภาษา', 'BILINGUAL'],
            ].map(([value, thaiLabel, englishLabel]) => (
              <label className={draft.values.productLanguage === value ? 'simple-choice is-active' : 'simple-choice'} key={value}>
                <input type="radio" name="product-language" checked={draft.values.productLanguage === value} onChange={() => setSpecificationField('productLanguage', value)} />
                {isThai ? thaiLabel : englishLabel}
              </label>
            ))}
          </div>
        </FormField>
        <div className="form-grid form-grid--two">
          <FormField label={isThai ? 'ข้อความประจำ Product' : 'BRAND COPY'} hint={isThai ? 'ข้อความที่ต้องคงรูปเดิมและไม่แปล' : 'Copy that must remain unchanged'}><input value={String(draft.values.brandCopy)} onChange={(event) => setSpecificationField('brandCopy', event.target.value)} /></FormField>
          <FormField label={isThai ? 'เวลาต่อวัน' : 'TIME PER DAY'} required hint={isThai ? 'ระบุให้ชัดว่าเป็นเวลาใน Product เท่านั้น หรือรวมเวลาลงมือทำจริงด้วย' : 'State whether this covers in-product time only or also real-world action.'}><input value={String(draft.values.dailyDuration)} onChange={(event) => setSpecificationField('dailyDuration', event.target.value)} /></FormField>
        </div>
        <FormField label={isThai ? 'เส้นทางหลักของผู้ใช้' : 'PRIMARY JOURNEY'} required hint={isThai ? 'เขียนเป็นเส้นทางสั้น ๆ ตั้งแต่เปิด App จนเห็นความคืบหน้า' : 'Describe the short path from opening the app to seeing progress'}>
          <textarea rows={3} value={String(draft.values.journeySummary) || legacyFlow.join(' → ')} onChange={(event) => setSpecificationField('journeySummary', event.target.value)} />
        </FormField>
        <FormField label={isThai ? 'หนึ่งวันถือว่าสำเร็จเมื่อ…' : 'ONE DAY IS COMPLETE WHEN…'} required hint={isThai ? 'ระบุการกระทำที่สังเกตและตรวจได้' : 'Use an observable, testable action'}>
          <textarea rows={2} value={String(draft.values.dailyCompletionRule)} onChange={(event) => setSpecificationField('dailyCompletionRule', event.target.value)} />
        </FormField>
        <section className="product-rules" aria-labelledby="product-rules-title">
          <header className="product-rules__intro">
            <div>
              <span>{isThai ? 'กติกาที่กำหนดพฤติกรรมของ Product' : 'RULES THAT DEFINE PRODUCT BEHAVIOR'}</span>
              <h3 id="product-rules-title">{isThai ? 'เขียนสิ่งที่ Product นี้ต้องทำจริง' : 'Describe what this product must actually do'}</h3>
            </div>
            <p>{isThai ? 'ตัวอย่างเป็นเพียงจุดเริ่มต้น คุณเขียนกติกาแบบอื่นได้ ระบบจะเตือนผลกระทบของตัวอย่างมาตรฐานบางแบบ แต่คำตอบที่เขียนเองยังต้องตรวจว่าไม่ขัดกับ Step E' : 'Examples are starting points, not fixed choices. The product flags impacts of some standard patterns, but custom rules still need to be checked against Step E.'}</p>
          </header>
          <div className="product-rules__grid">
            <GuidedRuleField
              id="return-rule"
              title={isThai ? 'กติกาการกลับมาใช้งาน' : 'RETURNING TO EARLIER WORK'}
              question={isThai ? 'เมื่อผู้ใช้กลับมายังรายการที่เคยทำแล้ว ระบบควรให้ทำอะไรได้บ้าง?' : 'What can users do when they return to an item they previously worked on?'}
              value={returnRuleText}
              examples={getProductRulePresets('return', language)}
              advisory={getProductRuleAdvisory('return', returnRuleText, language)?.message}
              isThai={isThai}
              onChange={(value) => setSpecificationField('returnRule', value)}
            />
            <GuidedRuleField
              id="sequence-rule"
              title={isThai ? 'กติกาการเข้าถึงเนื้อหา' : 'ACCESSING CONTENT'}
              question={isThai ? 'ผู้ใช้เข้าถึงแต่ละวันหรือแต่ละส่วนของ Product ได้อย่างไร?' : 'How do users access each day or section of the product?'}
              value={sequenceRuleText}
              examples={getProductRulePresets('sequence', language)}
              advisory={getProductRuleAdvisory('sequence', sequenceRuleText, language)?.message}
              isThai={isThai}
              onChange={(value) => setSpecificationField('sequenceRule', value)}
            />
            <GuidedRuleField
              id="storage-rule"
              title={isThai ? 'กติกาการบันทึกข้อมูล' : 'RETAINING DATA'}
              question={isThai ? 'ระบบต้องจำข้อมูลอะไร เก็บไว้ที่ไหน และนานแค่ไหน?' : 'What data must be retained, where is it kept, and for how long?'}
              value={storageRuleText}
              examples={getProductRulePresets('storage', language)}
              advisory={getProductRuleAdvisory('storage', storageRuleText, language)?.message}
              isThai={isThai}
              onChange={(value) => setSpecificationField('storageRule', value)}
            />
          </div>
        </section>
      </PhaseSection>

      <PhaseSection step="S2" title={isThai ? 'ตรวจโครงสร้างเนื้อหา' : 'REVIEW CONTENT BLUEPRINT'} description={isThai ? 'ตรวจว่าเนื้อหา 3 ช่วง แบบฝึก และสิ่งที่บันทึกตรงกับข้อสรุปจากบทสนทนา' : 'Check that the three arcs, exercises, and records match the conversation.'}>
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
          <FormField label={isThai ? 'เนื้อหาประจำวัน' : 'DAILY CONTENT'} required hint={isThai ? 'เนื้อหาประจำวันควรสั้นและมีรูปแบบอย่างไร' : 'How short daily content should work'}><textarea rows={3} value={String(draft.values.contentPattern)} onChange={(event) => setSpecificationField('contentPattern', event.target.value)} /></FormField>
          <FormField label={isThai ? 'แบบฝึกประจำวัน' : 'DAILY EXERCISE'} required hint={isThai ? 'ผู้ใช้จะคิด เลือก หรือทำอะไร' : 'What the user will think, choose, or do'}><textarea rows={3} value={String(draft.values.exercisePattern)} onChange={(event) => setSpecificationField('exercisePattern', event.target.value)} /></FormField>
          <FormField label={isThai ? 'สิ่งที่บันทึกประจำวัน' : 'DAILY RECORD'} required hint={isThai ? 'แต่ละวันต้องบันทึกคำตอบหรือหลักฐานอะไร' : 'What answer or evidence is saved each day'}><textarea rows={3} value={String(draft.values.recordPattern)} onChange={(event) => setSpecificationField('recordPattern', event.target.value)} /></FormField>
        </div>
      </PhaseSection>

      <PhaseSection step="S3" title={isThai ? 'ชุดเนื้อหา 21 วัน' : 'DAILY CONTENT PACK'} description={isThai ? 'ใช้ชุดคำสั่งให้ AI ภายนอกร่าง จากนั้นนำไฟล์ Markdown กลับมาตรวจ เนื้อหาจะไม่ถูกส่งออกจาก CODESIGN อัตโนมัติ' : 'Let an external AI draft it with the Prompt Kit, then bring Markdown back for review. CODESIGN never sends it automatically.'}>
        <div className="content-pack-progress"><span>{isThai ? 'เนื้อหาพร้อมแล้ว' : 'CONTENT READY'}</span><strong>{completeDays}/21</strong><div><i style={{ width: `${(completeDays / 21) * 100}%` }} /></div></div>
        <DailyContentEditor days={days} onChange={updateDays} />
        <label className={draft.values.contentOwnerConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}>
          <input type="checkbox" disabled={completeDays < 21} checked={Boolean(draft.values.contentOwnerConfirmed)} onChange={(event) => setSpecificationField('contentOwnerConfirmed', event.target.checked)} />
          <Check size={19} />
          <span><strong>{isThai ? 'ฉันตรวจ Content Pack แล้ว' : 'I REVIEWED THE CONTENT PACK'}</strong><small>{isThai ? 'ยืนยันว่าเนื้อหา แบบฝึก และแบบบันทึกตรงกับ Product ที่ต้องการ' : 'The content, exercises, and records match the intended product.'}</small></span>
        </label>
      </PhaseSection>

      <PhaseSection step="S4" title={isThai ? 'ทิศทางประสบการณ์' : 'EXPERIENCE DIRECTION'} description={isThai ? 'เลือกจากภาพรวมที่เห็นจริง คุณกำลังกำหนดทิศทาง ไม่ได้ออกแบบทุกหน้าด้วยตัวเอง' : 'Choose from a visible preview. You are setting a direction, not designing every screen.'}>
        <ExperienceSelector options={experienceOptions} selectedName={selectedExperience} onSelect={(name) => { setSpecificationField('selectedExperience', name); draft.setField('experienceOwnerConfirmed', false) }} onChange={updateExperience} />
        <label className={draft.values.experienceOwnerConfirmed ? 'owner-confirm is-active' : 'owner-confirm'}>
          <input type="checkbox" disabled={!selectedExperience} checked={Boolean(draft.values.experienceOwnerConfirmed)} onChange={(event) => setSpecificationField('experienceOwnerConfirmed', event.target.checked)} />
          <Check size={19} />
          <span><strong>{isThai ? 'ฉันเลือก Experience Direction นี้' : 'I CHOOSE THIS EXPERIENCE DIRECTION'}</strong><small>{isThai ? 'Theme นี้เป็นการตัดสินใจของฉัน ไม่ใช่สิ่งที่ AI เลือกแทน' : 'This theme is my decision, not a choice made for me by AI.'}</small></span>
        </label>
        <details className="advanced-specification">
          <summary>{isThai ? 'รายละเอียดเพิ่มเติม — เปิดเมื่ออยากกำหนดเอง' : 'ADVANCED SPECIFICATION — OPTIONAL DETAILS'}</summary>
          <p>{isThai ? 'หากปล่อยว่าง Codex สามารถตัดสินใจรายละเอียดการจัดหน้าจอ การรองรับ Mobile, Empty state และ Error state ภายใน Product Rules ที่ Lock แล้วได้' : 'If left blank, Codex may decide screens, mobile layout, empty states, and error states within the locked product rules.'}</p>
          <FormField label={isThai ? 'หมายเหตุเพิ่มเติมสำหรับการสร้าง' : 'ADDITIONAL BUILD NOTES'}><textarea rows={5} value={String(draft.values.advancedNotes)} onChange={(event) => setSpecificationField('advancedNotes', event.target.value)} /></FormField>
          <ReorderableList title={isThai ? 'เกณฑ์ตรวจรับที่คุณเขียนเอง — ไม่บังคับ' : 'OWNER-WRITTEN ACCEPTANCE CRITERIA — OPTIONAL'} guideKey="spec.acceptance" items={acceptanceCriteria} minimum={0} maximum={8} placeholder={isThai ? 'ผู้ใช้สามารถ… / App จดจำ…' : 'User can… / App remembers…'} onChange={(items) => setSpecificationField('acceptanceCriteria', items as unknown as Json)} />
        </details>
      </PhaseSection>

      <CrossStepAlignment
        step="S5"
        sourceStep="E"
        targetStep="S"
        loading={inherited.isLoading}
        loadError={inherited.isError}
        items={[
          { label: isThai ? 'ทิศทางที่ยืนยันแล้ว' : 'LOCKED DIRECTION', value: inheritedDirection },
          { label: isThai ? 'ต้องมี' : 'MUST HAVE', value: inheritedMustHaves },
          { label: isThai ? 'สิ่งที่ยังไม่ทำและการส่งต่อก่อนหน้า' : 'NON-GOALS AND PRIOR HANDOFF', value: [...inheritedNonGoals, [String(inherited.data?.E?.alignmentStatus ?? ''), String(inherited.data?.E?.alignmentNote ?? '')].filter(Boolean).join(' — ')].filter(Boolean) },
        ]}
        status={alignmentStatus}
        note={alignmentNote}
        confirmed={Boolean(draft.values.alignmentConfirmed)}
        revisionAction={<Link to={`/projects/${project.id}/E`}>{isThai ? 'ไปที่ Step E' : 'GO TO STEP E'}</Link>}
        onStatusChange={(status) => { draft.setField('alignmentStatus', status); resetAlignment() }}
        onNoteChange={(note) => { draft.setField('alignmentNote', note); resetAlignment() }}
        onConfirmedChange={(confirmed) => draft.setField('alignmentConfirmed', confirmed)}
      />

      <ReviewGate
        title={isThai ? 'ตรวจความพร้อมก่อนส่งต่อ' : 'SPECIFICATION QUALITY GATE'}
        question={isThai ? <>เนื้อหาและ Experience พร้อมส่งต่อ<br />โดยไม่ให้ Codex เดา Product decision แล้วหรือยัง?</> : <>Are the content and experience ready<br />without making Codex guess product decisions?</>}
        actions={<ArcadeButton disabled={issues.length > 0 || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? (isThai ? 'กำลังยืนยัน…' : 'SOLIDIFYING…') : (isThai ? 'ยืนยันรายละเอียด' : 'SOLIDIFY SPECIFICATION')}</ArcadeButton>}
      >
        {issues.length ? <><p>{isThai ? `ยังเหลือ ${issues.length} เรื่องก่อนส่งต่อ` : `${issues.length} items remain before handoff`}</p><ul className="spec-quality-list">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></> : <p>{isThai ? 'Journey, Content และ Experience พร้อมสำหรับ Final Handoff' : 'Journey, content, and experience are ready for Final Handoff.'}</p>}
        <p>{isThai
          ? 'เมื่อคุณยืนยัน Step S แล้ว CODESIGN จะนำคำตอบและการตัดสินใจที่ยืนยันไว้ตั้งแต่ Step C–S มาสร้างไฟล์ร่าง 3 ฉบับโดยอัตโนมัติ เพื่อใช้ตรวจสอบใน Step PRD คุณไม่ต้องสร้างหรืออัปโหลดไฟล์เหล่านี้เพิ่มเพื่อเริ่มขั้นถัดไป'
          : 'When you confirm Step S, CODESIGN will automatically turn the answers and decisions confirmed across Steps C–S into three draft files for review in Step PRD. You do not need to create or upload these files separately to begin the next step.'}</p>
        {completion.isError ? <p className="field-error" role="alert">{isThai ? 'Solidify ไม่สำเร็จ ข้อมูลยังไม่ถูก Lock' : 'Solidify failed. Your data remains unlocked.'}</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}

function asStringList(value: Json | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export type { ScreenSpec }
