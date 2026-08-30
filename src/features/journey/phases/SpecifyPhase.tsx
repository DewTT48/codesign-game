import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LockKeyhole, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../../components/ui/ArcadeButton'
import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { completePhase } from '../journey.service'
import { JourneyLayout } from '../JourneyLayout'
import { FormField, PhaseSection, ReviewGate } from '../PhaseFormComponents'
import { ReorderableList } from '../ReorderableList'
import { usePhaseDraft } from '../usePhaseDraft'

type ScreenSpec = { name: string; sees: string; actions: string; next: string }
const blankScreen = (): ScreenSpec => ({ name: '', sees: '', actions: '', next: '' })
const feelWords = ['Calm', 'Playful', 'Energetic', 'Focused', 'Warm', 'Bold', 'Professional', 'Minimal', 'Reflective', 'Motivating']
const initialSpecify = {
  flowSteps: ['START', '', 'RESULT'] as unknown as Json,
  screens: [blankScreen()] as unknown as Json,
  contentReadiness: 'need',
  dayFields: ['Day Number', 'Title', 'Activity'] as unknown as Json,
  contentImplementationReady: '',
  browserState: ['Completed days'] as unknown as Json,
  feelWords: [] as unknown as Json,
  customFeel: '',
  visualStyle: '', primaryColorRole: '', accentColorRole: '', background: '', surface: '', interactionTone: '', typography: '', visualRationale: '',
  persistenceRule: '', revisitRule: '', skipRule: '', emptyRule: '', editRule: '', resetRule: '', mobileRule: '',
  acceptanceCriteria: ['', '', '', '', ''] as unknown as Json,
}

export function SpecifyPhase({ project }: { project: ProjectRow }) {
  const draft = usePhaseDraft({ projectId: project.id, phase: 'S', initialValues: initialSpecify })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const screens = draft.values.screens as unknown as ScreenSpec[]
  const getList = (key: 'flowSteps' | 'dayFields' | 'browserState' | 'feelWords' | 'acceptanceCriteria') => draft.values[key] as unknown as string[]
  const setList = (key: 'flowSteps' | 'dayFields' | 'browserState' | 'feelWords' | 'acceptanceCriteria', items: string[]) => draft.setField(key, items as unknown as Json)
  const completion = useMutation({ mutationFn: async () => { await draft.saveAll(); return completePhase(project.id, 'S') }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['project', project.id] }); navigate(`/projects/${project.id}/PRD`) } })
  const updateScreen = (index: number, key: keyof ScreenSpec, value: string) => draft.setField('screens', screens.map((screen, itemIndex) => itemIndex === index ? { ...screen, [key]: value } : screen) as unknown as Json)
  const toggleFeel = (word: string) => { const current = getList('feelWords'); if (current.includes(word)) setList('feelWords', current.filter((item) => item !== word)); else if (current.length < 3) setList('feelWords', [...current, word]) }
  const edgeKeys = ['persistenceRule', 'revisitRule', 'skipRule', 'emptyRule', 'editRule', 'resetRule', 'mobileRule'] as const
  const ready = getList('flowSteps').filter((item) => item.trim()).length >= 3 && screens.every((screen) => Object.values(screen).every((value) => value.trim())) && getList('dayFields').filter((item) => item.trim()).length >= 1 && String(draft.values.contentImplementationReady).trim() && getList('browserState').filter((item) => item.trim()).length >= 1 && getList('feelWords').length >= 1 && String(draft.values.visualRationale).trim() && edgeKeys.every((key) => String(draft.values[key]).trim()) && getList('acceptanceCriteria').filter((item) => item.trim()).length >= 5

  return (
    <JourneyLayout project={project} phase="S" phaseName="SPECIFY" headline="MAKE IT BUILDABLE." principle="เปลี่ยน Product decisions ให้เป็นพฤติกรรม โครงสร้างข้อมูล และเกณฑ์ที่ Codex สามารถสร้างตามได้" hint="เขียนเฉพาะสิ่งที่ผู้ใช้มองเห็น ทำได้ และสิ่งที่ App ต้องจำ หากคำตอบเปลี่ยนพฤติกรรมของ Product อย่าปล่อยให้ Codex เดา" chatMove="ช่วยตรวจ Specification นี้ในฐานะ Product reviewer ชี้เฉพาะจุดที่ยังคลุมเครือและอาจทำให้ผู้พัฒนาต้องเดา โดยอย่าเติมคำตอบแทนผม" saveState={draft.saveState}>
      <PhaseSection step="S1" title="EXPERIENCE FLOW" description="ผู้ใช้เปิด App แล้วเกิดอะไรขึ้นตั้งแต่ต้นจนจบ? ใช้ปุ่มขึ้น/ลงเพื่อจัดลำดับได้โดยไม่ต้องลาก">
        <ReorderableList title="PRIMARY USER FLOW" items={getList('flowSteps')} minimum={3} placeholder="STEP" onChange={(items) => setList('flowSteps', items)} />
      </PhaseSection>

      <PhaseSection step="S2" title="SCREENS & BEHAVIOR" description="แปล Feature ให้เป็นสิ่งที่สังเกตได้ในแต่ละ Screen หรือ State">
        <div className="screen-spec-stack">
          {screens.map((screen, index) => <article className="screen-spec-card" key={index}><header><span>SCREEN {String(index + 1).padStart(2, '0')}</span><button type="button" disabled={screens.length === 1} onClick={() => draft.setField('screens', screens.filter((_, itemIndex) => itemIndex !== index) as unknown as Json)} aria-label={`ลบ Screen ${index + 1}`}><X size={17} /></button></header><div className="form-grid form-grid--two"><FormField label="SCREEN NAME" required><input value={screen.name} onChange={(event) => updateScreen(index, 'name', event.target.value)} /></FormField><FormField label="USER SEES" required><textarea rows={3} value={screen.sees} onChange={(event) => updateScreen(index, 'sees', event.target.value)} /></FormField><FormField label="USER CAN DO" required><textarea rows={3} value={screen.actions} onChange={(event) => updateScreen(index, 'actions', event.target.value)} /></FormField><FormField label="WHAT HAPPENS NEXT" required><textarea rows={3} value={screen.next} onChange={(event) => updateScreen(index, 'next', event.target.value)} /></FormField></div></article>)}
        </div>
        <button className="add-list-item" type="button" onClick={() => draft.setField('screens', [...screens, blankScreen()] as unknown as Json)}><Plus size={17} /> ADD SCREEN</button>
      </PhaseSection>

      <PhaseSection step="S3" title="CONTENT & DATA">
        <div className="choice-grid choice-grid--three">{[['ready','READY'],['partly','PARTLY READY'],['need','NEED TO CREATE']].map(([value,label]) => <label className={draft.values.contentReadiness === value ? 'simple-choice is-active' : 'simple-choice'} key={value}><input type="radio" name="content-ready" checked={draft.values.contentReadiness === value} onChange={() => draft.setField('contentReadiness', value)} />{label}</label>)}</div>
        <div className="specify-columns"><ReorderableList title="ONE DAY CONTAINS…" items={getList('dayFields')} placeholder="FIELD NAME" onChange={(items) => setList('dayFields', items)} /><ReorderableList title="APP REMEMBERS IN BROWSER…" items={getList('browserState')} placeholder="STATE OR USER DATA" onChange={(items) => setList('browserState', items)} /></div>
        <FormField label="WHAT CONTENT/DATA WILL CODEX RECEIVE FOR IMPLEMENTATION?" required hint="Confirm where the complete 21-day content lives or how it will be supplied"><textarea rows={4} value={String(draft.values.contentImplementationReady)} onChange={(event) => draft.setField('contentImplementationReady', event.target.value)} /></FormField>
      </PhaseSection>

      <PhaseSection step="S4" title="CHARACTER & VISUAL DIRECTION" description="เลือกไม่เกิน 3 คำ แล้วเชื่อมการตัดสินใจกับ User และ Purpose">
        <div className="feel-word-grid">{feelWords.map((word) => <button className={getList('feelWords').includes(word) ? 'is-active' : ''} type="button" key={word} onClick={() => toggleFeel(word)}>{word}</button>)}</div>
        <div className="form-grid form-grid--two visual-fields"><FormField label="CUSTOM FEEL"><input value={String(draft.values.customFeel)} onChange={(event) => draft.setField('customFeel', event.target.value)} /></FormField><FormField label="VISUAL STYLE / CHARACTER"><input value={String(draft.values.visualStyle)} onChange={(event) => draft.setField('visualStyle', event.target.value)} /></FormField><FormField label="PRIMARY COLOR ROLE"><input value={String(draft.values.primaryColorRole)} onChange={(event) => draft.setField('primaryColorRole', event.target.value)} /></FormField><FormField label="ACCENT COLOR ROLE"><input value={String(draft.values.accentColorRole)} onChange={(event) => draft.setField('accentColorRole', event.target.value)} /></FormField><FormField label="BACKGROUND"><input value={String(draft.values.background)} onChange={(event) => draft.setField('background', event.target.value)} /></FormField><FormField label="SURFACE"><input value={String(draft.values.surface)} onChange={(event) => draft.setField('surface', event.target.value)} /></FormField><FormField label="INTERACTION TONE"><input value={String(draft.values.interactionTone)} onChange={(event) => draft.setField('interactionTone', event.target.value)} /></FormField><FormField label="TYPOGRAPHY DIRECTION"><input value={String(draft.values.typography)} onChange={(event) => draft.setField('typography', event.target.value)} /></FormField></div>
        <FormField label="THIS FITS MY USER BECAUSE…" required><textarea rows={4} value={String(draft.values.visualRationale)} onChange={(event) => draft.setField('visualRationale', event.target.value)} /></FormField>
      </PhaseSection>

      <PhaseSection step="S5" title="EDGE CASES & ACCEPTANCE" description="ทำให้ Product rules ที่ Codex อาจต้องเดากลายเป็นการตัดสินใจที่ชัดเจน">
        <div className="form-grid form-grid--two"><FormField label="BROWSER CLOSES & REOPENS"><textarea rows={3} value={String(draft.values.persistenceRule)} onChange={(event) => draft.setField('persistenceRule', event.target.value)} /></FormField><FormField label="CAN USERS REVISIT AN EARLIER DAY?"><textarea rows={3} value={String(draft.values.revisitRule)} onChange={(event) => draft.setField('revisitRule', event.target.value)} /></FormField><FormField label="CAN USERS SKIP AHEAD?"><textarea rows={3} value={String(draft.values.skipRule)} onChange={(event) => draft.setField('skipRule', event.target.value)} /></FormField><FormField label="WHAT IF REQUIRED TEXT IS EMPTY?"><textarea rows={3} value={String(draft.values.emptyRule)} onChange={(event) => draft.setField('emptyRule', event.target.value)} /></FormField><FormField label="CAN A COMPLETED DAY BE EDITED?"><textarea rows={3} value={String(draft.values.editRule)} onChange={(event) => draft.setField('editRule', event.target.value)} /></FormField><FormField label="WHAT EXACTLY DOES RESET REMOVE?"><textarea rows={3} value={String(draft.values.resetRule)} onChange={(event) => draft.setField('resetRule', event.target.value)} /></FormField><FormField label="WHAT HAPPENS ON MOBILE?"><textarea rows={3} value={String(draft.values.mobileRule)} onChange={(event) => draft.setField('mobileRule', event.target.value)} /></FormField></div>
        <div className="acceptance-block"><ReorderableList title="IT IS DONE WHEN…" items={getList('acceptanceCriteria')} minimum={5} maximum={8} placeholder="User can… / App remembers…" onChange={(items) => setList('acceptanceCriteria', items)} /></div>
      </PhaseSection>

      <ReviewGate title="SPECIFICATION GATE" question="Specification นี้อธิบาย Flow, Behavior, Content, Data, Character และ Product rules โดยไม่ให้ Codex ต้องเดาเรื่องสำคัญแล้วหรือยัง?" actions={<ArcadeButton disabled={!ready || completion.isPending} onClick={() => completion.mutate()}><LockKeyhole size={18} /> {completion.isPending ? 'SOLIDIFYING…' : 'SOLIDIFY SPECIFICATION'}</ArcadeButton>}>
        <p>{ready ? 'ทุกส่วนที่จำเป็นพร้อมสำหรับ PRD Gate' : 'กรอก Flow 3+ steps, Screens, Content/Data, Visual rationale, Edge cases และ Acceptance criteria อย่างน้อย 5 ข้อ'}</p>
        {completion.isError ? <p className="field-error" role="alert">Solidify ไม่สำเร็จ ข้อมูลยังไม่ถูก Lock</p> : null}
      </ReviewGate>
    </JourneyLayout>
  )
}
