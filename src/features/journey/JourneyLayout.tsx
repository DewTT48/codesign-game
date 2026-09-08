import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Lightbulb, MessageSquareText, RotateCcw, X } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { Link } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { useLanguage } from '../i18n/LanguageContext'
import { getPhaseGuide } from './guidanceContent'
import { getLatestPhaseRevision, getPrdSource } from './journey.service'
import { isActivePhaseRevision } from './phaseRevision'
import type { SaveState } from './usePhaseDraft'

type JourneyLayoutProps = PropsWithChildren<{
  project: ProjectRow
  phase: string
  phaseName: string
  chatContext?: Record<string, unknown>
  saveState: SaveState
}>

export function JourneyLayout({
  project,
  phase,
  phaseName,
  chatContext = {},
  saveState,
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
  const guide = getPhaseGuide(language, phase, source.data ?? {}, chatContext, project.topic)
  const thaiPhaseNames: Record<string, string> = {
    C: 'ทำความเข้าใจบริบท',
    O: 'สำรวจทางเลือก',
    D: 'ท้าทายสมมติฐาน',
    E: 'กำหนดขอบเขต',
    S: 'ระบุรายละเอียด',
    PRD: 'ชุดส่งต่องาน',
    I: 'สร้างแอป',
    G: 'รับข้อเสนอแนะ',
    N: 'วางรอบถัดไป',
  }

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
          <span className="chapter-code">{phase} — {isThai ? (thaiPhaseNames[phase] ?? phaseName) : phaseName}</span>
          <h1>{guide.headline}</h1>
          <p>{guide.principle}</p>
        </div>
      </header>

      <div className="journey-status-grid">
        <MissionMap activeMission={project.current_phase} viewedMission={phase} projectId={project.id} compact />
        <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
      </div>

      {isActivePhaseRevision(latestRevision.data, project.current_phase) ? (
        <aside className="active-revision-banner">
          <RotateCcw aria-hidden="true" size={21} />
          <div>
            <strong>{isThai ? `REVISION v${latestRevision.data?.version} · กำลังทบทวนจาก Step ${latestRevision.data?.targetPhase}` : `REVISION v${latestRevision.data?.version} · REVIEWING FROM STEP ${latestRevision.data?.targetPhase}`}</strong>
            <p>{isThai ? `ฉบับก่อนหน้ายังถูกเก็บไว้ และ Step ${latestRevision.data?.affectedPhases.join(' → ')} ต้องตรวจยืนยันใหม่` : `The prior version is preserved. Steps ${latestRevision.data?.affectedPhases.join(' → ')} must be reviewed again.`}</p>
          </div>
        </aside>
      ) : null}

      <div className="guidance-actions">
        <button type="button" onClick={() => setOpenHelp('hint')}>
          <Lightbulb aria-hidden="true" size={18} /> {isThai ? 'คำใบ้เพื่อช่วยคิด' : 'NEED A THINKING HINT?'}
        </button>
        <button type="button" onClick={() => setOpenHelp('chat')}>
          <MessageSquareText aria-hidden="true" size={18} /> {isThai ? 'คุยกับ Chat อย่างไร?' : 'HOW CAN I ASK CHAT?'}
        </button>
      </div>

      {openHelp ? (
        <aside className={`help-panel help-panel--${openHelp}`}>
          <div className="help-panel__header">
            <span>{openHelp === 'hint' ? (isThai ? 'คำใบ้เพื่อช่วยคิด' : 'THINKING HINT') : (isThai ? 'ชุดคำสั่งสำหรับ Chat' : 'CHAT PROMPT KIT')}</span>
            <button type="button" aria-label={isThai ? 'ปิดคำแนะนำ' : 'Close guidance'} onClick={() => setOpenHelp(null)}>
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          {openHelp === 'hint' ? <p>{guide.hint}</p> : (
            <div className="prompt-kit">
              <p className="prompt-kit__goal">{guide.chatGoal}</p>
              <pre>{guide.prompt}</pre>
              <button className="prompt-copy" type="button" onClick={copyPrompt}>
                {copyState === 'copied' ? <Check size={17} /> : <Copy size={17} />}
                {copyState === 'copied'
                  ? (isThai ? 'คัดลอกแล้ว' : 'COPIED')
                  : copyState === 'failed'
                    ? (isThai ? 'คัดลอกไม่สำเร็จ' : 'COPY FAILED')
                    : (isThai ? 'คัดลอก Prompt' : 'COPY PROMPT')}
              </button>
              <section>
                <strong>{isThai ? 'คำถามต่อยอด' : 'GO DEEPER'}</strong>
                <ul>{guide.followUps.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section className="prompt-kit__bring-back">
                <strong>{isThai ? 'นำอะไรกลับมากรอก' : 'BRING BACK'}</strong>
                <p>{guide.bringBack}</p>
              </section>
              <small>{isThai ? 'ใช้เป็นจุดเริ่มต้นและปรับตามการสนทนาจริง ไม่ใช่คำสั่งบังคับ' : 'A CONVERSATION STARTER — ADAPT IT TO THE REAL DISCUSSION'}</small>
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
