import { LockKeyhole } from 'lucide-react'
import { useLanguage } from '../../features/i18n/LanguageContext'
import { missions } from './missions'

type MissionMapProps = {
  activeMission?: string
  compact?: boolean
}

export function MissionMap({ activeMission = 'C', compact }: MissionMapProps) {
  const { isThai } = useLanguage()
  const thaiMissionNames: Record<string, string> = {
    C: 'บริบท',
    O: 'ทางเลือก',
    D: 'ท้าทาย',
    E: 'ขอบเขต',
    S: 'รายละเอียด',
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
          const active = mission.key === activeMission
          const locked = index > missions.findIndex((item) => item.key === activeMission)
          return (
            <li
              className={`mission-node ${active ? 'is-active' : ''} ${
                locked ? 'is-locked' : ''
              }`}
              key={mission.key}
            >
              <span className="mission-connector" aria-hidden="true" />
              <span className="mission-key" aria-hidden="true">
                {locked ? <LockKeyhole size={14} /> : mission.key}
              </span>
              <span className="mission-name">
                <span className="sr-only">{mission.key} — </span>
                {isThai ? (thaiMissionNames[mission.key] ?? mission.name) : mission.name}
              </span>
              {active ? <span className="mission-you">{isThai ? 'คุณอยู่ที่นี่' : 'YOU ARE HERE'}</span> : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
