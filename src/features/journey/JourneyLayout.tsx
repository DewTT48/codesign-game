import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Lightbulb, MessageSquareText, X } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { Link } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { useLanguage } from '../i18n/LanguageContext'
import { getPhaseGuide } from './guidanceContent'
import { getPrdSource } from './journey.service'
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
  const guide = getPhaseGuide(language, phase, source.data ?? {}, chatContext, project.topic)

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
    <div className="content-page journey-page">
      <div className="journey-utility-row">
        <Link className="back-link" to="/dashboard">
          <ArrowLeft aria-hidden="true" size={18} /> DASHBOARD
        </Link>
        <SaveIndicator state={saveState} />
      </div>
      <header className="journey-heading">
        <div className="phase-token" aria-hidden="true">{phase}</div>
        <div>
          <span className="chapter-code">{phase} — {phaseName}</span>
          <h1>{guide.headline}</h1>
          <p>{guide.principle}</p>
        </div>
      </header>

      <div className="journey-status-grid">
        <MissionMap activeMission={phase} compact />
        <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
      </div>

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
            <span>{openHelp === 'hint' ? 'THINKING HINT' : 'CHAT PROMPT KIT'}</span>
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

function SaveIndicator({ state }: { state: SaveState }) {
  const labels: Record<SaveState, string> = {
    idle: 'UNSAVED CHANGES',
    saving: 'SAVING…',
    saved: 'SAVED',
    error: 'SAVE FAILED — RETRY',
  }
  return <span className={`save-indicator save-indicator--${state}`}>{labels[state]}</span>
}
