import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, Copy, Lightbulb, MessageSquareText, RotateCcw, X } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { Link } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { useLanguage } from '../i18n/LanguageContext'
import { getPhaseGuide } from './guidanceContent'
import { getLatestPhaseRevision, getPrdSource } from './journey.service'
import { isActivePhaseRevision } from './phaseRevision'
import { PhaseCompletionGuide, type PhaseCompletionItem } from './PhaseCompletionGuide'
import { assemblePrototypePrompt } from './prd/uiReview'
import type { SaveState } from './usePhaseDraft'

type JourneyLayoutProps = PropsWithChildren<{
  project: ProjectRow
  phase: string
  phaseName: string
  chatContext?: Record<string, unknown>
  saveState: SaveState
  completionItems: PhaseCompletionItem[]
}>

export function JourneyLayout({
  project,
  phase,
  phaseName,
  chatContext = {},
  saveState,
  completionItems,
  children,
}: JourneyLayoutProps) {
  const [openHelp, setOpenHelp] = useState<'hint' | 'chat' | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const { language, isThai } = useLanguage()
  const source = useQuery({
    queryKey: ['guidance-source', project.id],
    queryFn: () => getPrdSource(project.id),
    staleTime: 0,
  })
  const latestRevision = useQuery({
    queryKey: ['phase-revision', project.id],
    queryFn: () => getLatestPhaseRevision(project.id),
    staleTime: 0,
  })
  const baseGuide = getPhaseGuide(language, phase, source.data ?? {}, chatContext, project.topic)
  const uiBrief = typeof chatContext.uiBrief === 'string' ? chatContext.uiBrief : ''
  const guide = phase === 'PRD' && uiBrief
    ? {
        ...baseGuide,
        hint: isThai
          ? 'ใช้ UI Brief ที่ CODESIGN เตรียมไว้เพื่อดูหน้าตาและทดลอง UX/UI ก่อน จากนั้นค่อยกลับมาตรวจ Final PRD เพียงรอบเดียว'
          : 'Use the prepared UI Brief to inspect and refine the UI/UX first, then return for one final PRD review.',
        chatGoal: isThai
          ? 'สร้าง Prototype ที่มองเห็นได้ ปรับกับผู้ใช้จนพอใจ แล้วส่ง CODESIGN_UI_REVIEW.md กลับมา'
          : 'Create a visible prototype, iterate with the owner, and return CODESIGN_UI_REVIEW.md.',
        prompt: assemblePrototypePrompt(uiBrief, 'guided', language),
        followUps: isThai
          ? ['แสดงหน้าหลักและ Primary journey ก่อน', 'ลอง Mobile และ Desktop โดยใช้ Content ตัวอย่าง', 'ถามฉันทีละหนึ่งเรื่องจากสิ่งที่เห็นจริง', 'หลังฉันยืนยันแล้ว ให้รอคำสั่ง FINALIZE UI REVIEW']
          : ['Show the primary screens and journey first.', 'Check mobile and desktop with representative content.', 'Ask one question at a time about the visible prototype.', 'After approval, wait for FINALIZE UI REVIEW.'],
        bringBack: isThai
          ? 'นำ CODESIGN_UI_REVIEW.md กลับมา CODESIGN ไม่ต้องนำ Prototype code หรือ Content Pack ฉบับเต็มกลับมา'
          : 'Bring CODESIGN_UI_REVIEW.md back to CODESIGN. Do not bring prototype code or the complete Content Pack.',
      }
    : baseGuide
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(guide.prompt)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    window.setTimeout(() => setCopyState('idle'), 1800)
  }

  return (
    <div className={`content-page journey-page journey-page--${phase.toLowerCase()}`}>
      <div className="journey-utility-row">
        <Link className="back-link" to="/dashboard">
          <ArrowLeft aria-hidden="true" size={18} /> {isThai ? 'แดชบอร์ด' : 'DASHBOARD'}
        </Link>
        <SaveIndicator state={saveState} isThai={isThai} />
      </div>
      <header className="journey-heading">
        <div className={`phase-token${phase.length > 1 ? ' phase-token--wide' : ''}`} aria-hidden="true">{phase}</div>
        <div>
          <span className="chapter-code">{phase} — {phaseName}</span>
          <h1>{guide.headline}</h1>
          <p>{guide.principle}</p>
        </div>
      </header>

      <div className="journey-status-grid">
        <MissionMap activeMission={project.current_phase} viewedMission={phase} projectId={project.id} compact />
        <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
      </div>

      <PhaseCompletionGuide items={completionItems} isThai={isThai} />

      {isActivePhaseRevision(latestRevision.data, project.current_phase) ? (
        <aside className="active-revision-banner">
          <RotateCcw aria-hidden="true" size={21} />
          <div>
            <strong>{isThai ? `REVISION v${latestRevision.data?.version} · กำลังทบทวนจาก Step ${latestRevision.data?.targetPhase}` : `REVISION v${latestRevision.data?.version} · REVIEWING FROM STEP ${latestRevision.data?.targetPhase}`}</strong>
            <p>{isThai ? `ฉบับก่อนหน้ายังถูกเก็บไว้ และ Step ${latestRevision.data?.affectedPhases.join(' → ')} ต้องตรวจยืนยันใหม่` : `The prior version is preserved. Steps ${latestRevision.data?.affectedPhases.join(' → ')} must be reviewed again.`}</p>
            <Link to={`/projects/${project.id}/revisions`}>{isThai ? 'ดูประวัติ Revision' : 'VIEW REVISION HISTORY'} <ArrowRight size={15} /></Link>
          </div>
        </aside>
      ) : null}

      <div className="guidance-actions">
        <button type="button" onClick={() => setOpenHelp('hint')}>
          <Lightbulb aria-hidden="true" size={18} /> {isThai ? 'คำใบ้เพื่อช่วยคิด' : 'NEED A THINKING HINT?'}
        </button>
        <button className={phase === 'S' || phase === 'I' ? 'guidance-action--primary' : undefined} type="button" onClick={() => setOpenHelp('chat')}>
          <MessageSquareText aria-hidden="true" size={18} /> {phase === 'S'
            ? (isThai ? 'เริ่มที่นี่: เปิด Prompt สำหรับ AI' : 'START HERE: OPEN THE AI PROMPT')
            : phase === 'I'
              ? (isThai ? 'เริ่มสร้าง App กับ Codex' : 'START BUILDING WITH CODEX')
              : (isThai ? 'คุยกับ Chat อย่างไร?' : 'HOW CAN I ASK CHAT?')}
        </button>
      </div>

      {openHelp ? (
        <aside className={`help-panel help-panel--${openHelp}`}>
          <div className="help-panel__header">
            <span>{openHelp === 'hint'
              ? (isThai ? 'คำใบ้เพื่อช่วยคิด' : 'THINKING HINT')
              : phase === 'S'
                ? (isThai ? 'Prompt สำหรับ AI ภายนอก' : 'EXTERNAL AI PROMPT')
                : phase === 'I'
                  ? (isThai ? 'คำสั่งสำหรับเริ่มงานใน Codex' : 'CODEX STARTING INSTRUCTIONS')
                  : (isThai ? 'ชุดคำสั่งสำหรับ Chat' : 'CHAT PROMPT KIT')}</span>
            <button type="button" aria-label={isThai ? 'ปิดคำแนะนำ' : 'Close guidance'} onClick={() => setOpenHelp(null)}>
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          {openHelp === 'hint' ? <p>{guide.hint}</p> : (
            <div className="prompt-kit">
              <p className="prompt-kit__goal">{guide.chatGoal}</p>
              {phase === 'PRD' ? <section className="prompt-kit__included">
                <strong>{isThai ? 'Prompt นี้มีข้อมูลพร้อมแล้ว' : 'THIS PROMPT IS READY'}</strong>
                <p>{isThai ? 'รวม CODESIGN UI Brief ที่สรุป Decision, Experience Direction และตัวอย่างโครง Content ไว้แล้ว โดยไม่ส่ง Content 21 วันทั้งหมด คุณไม่ต้องแนบไฟล์เพิ่ม' : 'It includes the CODESIGN UI Brief with locked decisions, experience direction, and representative content structure—without sending all 21 days. No attachment is needed.'}</p>
              </section> : null}
              {phase === 'I' ? <section className="prompt-kit__included">
                <strong>{isThai ? 'ใช้คำสั่งนี้กับ Codex' : 'USE THIS IN CODEX'}</strong>
                <p>{isThai ? 'ดาวน์โหลดไฟล์ทั้ง 5 ฉบับ แล้วนำจาก Downloads ไปไว้ใน Folder เดียวกันโดยไม่เปลี่ยนชื่อ เปิด Folder นั้นเป็น Local Project ใน Codex แล้วเปิด Task ใหม่ จากนั้นคัดลอก Prompt ด้านล่างไปวางและส่ง' : 'Download all five files, then move them from Downloads into one folder without renaming them. Open that folder as a local project in Codex, start a new task, then copy, paste, and send the prompt below.'}</p>
              </section> : null}
              <pre>{guide.prompt}</pre>
              <button className="prompt-copy" type="button" onClick={copyPrompt}>
                {copyState === 'copied' ? <Check size={17} /> : <Copy size={17} />}
                {copyState === 'copied'
                  ? (isThai ? 'คัดลอกแล้ว' : 'COPIED')
                  : copyState === 'failed'
                    ? (isThai ? 'คัดลอกไม่สำเร็จ' : 'COPY FAILED')
                    : phase === 'I'
                      ? (isThai ? 'คัดลอก Prompt เปิดงาน' : 'COPY STARTING PROMPT')
                      : (isThai ? 'คัดลอก Prompt' : 'COPY PROMPT')}
              </button>
              <section>
                <strong>{phase === 'PRD'
                  ? (isThai ? 'สิ่งที่ Chat ต้องส่งกลับ' : 'EXPECTED CHAT OUTPUT')
                  : phase === 'I'
                    ? (isThai ? 'สิ่งที่ให้ Codex ทำต่อ' : 'CONTINUE WITH CODEX')
                    : (isThai ? 'คำถามต่อยอด' : 'GO DEEPER')}</strong>
                <ul>{guide.followUps.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section className="prompt-kit__bring-back">
                <strong>{phase === 'PRD'
                  ? (isThai ? 'กลับมาทำอะไรใน CODESIGN' : 'WHAT TO DO IN CODESIGN')
                  : phase === 'I'
                    ? (isThai ? 'กลับมาบันทึกอะไรใน CODESIGN' : 'WHAT TO RECORD IN CODESIGN')
                    : (isThai ? 'นำอะไรกลับมากรอก' : 'BRING BACK')}</strong>
                <p>{guide.bringBack}</p>
              </section>
              <small>{phase === 'I'
                ? (isThai ? 'ไฟล์ทั้ง 5 ต้องอยู่ใน Local Project Folder เดียวกัน ไม่ต้องแนบซ้ำใน Task' : 'KEEP ALL FIVE FILES IN THE SAME LOCAL PROJECT FOLDER; DO NOT ATTACH THEM AGAIN')
                : (isThai ? 'ใช้เป็นจุดเริ่มต้นและปรับตามการสนทนาจริง ไม่ใช่คำสั่งบังคับ' : 'A CONVERSATION STARTER — ADAPT IT TO THE REAL DISCUSSION')}</small>
            </div>
          )}
        </aside>
      ) : null}

      {children}
    </div>
  )
}

function SaveIndicator({ state, isThai }: { state: SaveState; isThai: boolean }) {
  const labels: Record<SaveState, string> = isThai ? {
    idle: 'ยังไม่ได้บันทึกการเปลี่ยนแปลง',
    saving: 'กำลังบันทึก…',
    saved: 'บันทึกแล้ว',
    error: 'บันทึกไม่สำเร็จ — ลองอีกครั้ง',
  } : {
    idle: 'UNSAVED CHANGES',
    saving: 'SAVING…',
    saved: 'SAVED',
    error: 'SAVE FAILED — RETRY',
  }
  return <span className={`save-indicator save-indicator--${state}`}>{labels[state]}</span>
}
