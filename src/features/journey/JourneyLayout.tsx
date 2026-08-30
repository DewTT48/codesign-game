import { ArrowLeft, Lightbulb, MessageSquareText, X } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { Link } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import type { ProjectRow } from '../../lib/supabase/database.types'
import type { SaveState } from './usePhaseDraft'

type JourneyLayoutProps = PropsWithChildren<{
  project: ProjectRow
  phase: string
  phaseName: string
  headline: string
  principle: string
  hint: string
  chatMove: string
  saveState: SaveState
}>

export function JourneyLayout({
  project,
  phase,
  phaseName,
  headline,
  principle,
  hint,
  chatMove,
  saveState,
  children,
}: JourneyLayoutProps) {
  const [openHelp, setOpenHelp] = useState<'hint' | 'chat' | null>(null)

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
          <h1>{headline}</h1>
          <p>{principle}</p>
        </div>
      </header>

      <div className="journey-status-grid">
        <MissionMap activeMission={phase} compact />
        <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
      </div>

      <div className="guidance-actions">
        <button type="button" onClick={() => setOpenHelp('hint')}>
          <Lightbulb aria-hidden="true" size={18} /> NEED A HINT?
        </button>
        <button type="button" onClick={() => setOpenHelp('chat')}>
          <MessageSquareText aria-hidden="true" size={18} /> HOW CAN I ASK CHAT?
        </button>
      </div>

      {openHelp ? (
        <aside className={`help-panel help-panel--${openHelp}`}>
          <div>
            <span>{openHelp === 'hint' ? 'THINKING HINT' : 'CHAT MOVE'}</span>
            <button type="button" aria-label="ปิดคำแนะนำ" onClick={() => setOpenHelp(null)}>
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <p>{openHelp === 'hint' ? hint : chatMove}</p>
          {openHelp === 'chat' ? <small>CONVERSATIONAL MOVE — NOT A REQUIRED PROMPT</small> : null}
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
