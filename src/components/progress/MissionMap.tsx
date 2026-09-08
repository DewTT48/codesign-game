import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../features/i18n/LanguageContext'
import { isCompletedPhase } from '../../features/journey/phaseNavigation'
import type { PhaseCode } from '../../features/journey/journey.service'
import { missions } from './missions'

type MissionMapProps = {
  activeMission?: string
  compact?: boolean
  projectId?: string
  viewedMission?: string
}

export function MissionMap({ activeMission = 'C', compact, projectId, viewedMission }: MissionMapProps) {
  const { isThai } = useLanguage()
  const journeyComplete = activeMission === 'COMPLETE'
  const mapMission = missions.some((item) => item.key === activeMission) ? activeMission : ''
  const activeIndex = missions.findIndex((item) => item.key === mapMission)
  const thaiMissionNames: Record<string, string> = {
    C: 'บริบท',
    O: 'ทางเลือก',
    D: 'ท้าทาย',
    E: 'ขอบเขต',
    S: 'รายละเอียด',
    PRD: 'ชุดส่งต่องาน',
    I: 'สร้างแอป',
    G: 'ข้อเสนอแนะ',
    N: 'รอบถัดไป',
  }
  return (
    <section
      className={`mission-map ${compact ? 'mission-map--compact' : ''}`}
      aria-labelledby="mission-map-title"
    >
      <div className="section-label" id="mission-map-title">
        {isThai ? 'แผนที่ภารกิจ' : 'MISSION MAP'}
      </div>
      <ol className="mission-track">
        {missions.map((mission, index) => {
          const active = !journeyComplete && mission.key === mapMission
          const reviewable = journeyComplete
            || isCompletedPhase(mission.key as PhaseCode, activeMission as PhaseCode)
          const complete = journeyComplete || index < activeIndex
          const viewing = viewedMission === mission.key && !active
          const locked = !journeyComplete && index > activeIndex
          const viewingHistory = Boolean(viewedMission && viewedMission !== activeMission)
          const linksToCurrent = Boolean(projectId && active && viewingHistory)
          const linksToHistory = Boolean(projectId && reviewable && !active)
          const linkTarget = linksToCurrent ? activeMission : mission.key
          const linkLabel = linksToCurrent
            ? (isThai ? 'กลับไป Step ปัจจุบัน' : 'Return to current step')
            : (isThai ? 'ดูย้อนหลัง' : 'Review')
          const content = <>
            <span className={`mission-key ${mission.key.length > 1 ? 'mission-key--wide' : ''}`} aria-hidden="true">
              {locked ? <LockKeyhole size={14} /> : mission.key}
            </span>
            <span className="mission-name">
              <span className="sr-only">{mission.key} — </span>
              {isThai ? (thaiMissionNames[mission.key] ?? mission.name) : mission.name}
            </span>
            {active ? <span className="mission-you">{isThai ? 'คุณอยู่ที่นี่' : 'YOU ARE HERE'}</span> : null}
            {viewing ? <span className="mission-viewing">{isThai ? 'กำลังดู' : 'VIEWING'}</span> : null}
          </>
          return (
            <li
              className={`mission-node ${complete ? 'is-complete' : ''} ${active ? 'is-active' : ''} ${viewing ? 'is-viewing' : ''} ${
                locked ? 'is-locked' : ''
              }`}
              key={mission.key}
            >
              <span className="mission-connector" aria-hidden="true" />
              {projectId && (linksToCurrent || linksToHistory)
                ? <Link className="mission-node__content" to={`/projects/${projectId}/${linkTarget}`} aria-label={`${linkLabel} ${isThai ? (thaiMissionNames[mission.key] ?? mission.name) : mission.name}`}>{content}</Link>
                : <div className="mission-node__content">{content}</div>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
