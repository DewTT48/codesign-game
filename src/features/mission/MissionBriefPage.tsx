import {
  ArrowLeft,
  ArrowRight,
  BotOff,
  Check,
  Database,
  Globe2,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { useLanguage } from '../i18n/LanguageContext'

const buildRules = [
  { icon: Globe2, text: 'Standalone web app' },
  { icon: BotOff, text: 'No embedded AI' },
  { icon: Database, text: 'Browser persistence only' },
  { icon: ShieldCheck, text: 'No Auth or backend in your app' },
]

export function MissionBriefPage() {
  const { isThai } = useLanguage()
  const outcomes = isThai ? [
    'เว็บแอปที่ใช้งานได้และมี Public URL',
    'PRD ที่บันทึก Product Definition ของคุณ',
    'Journal ที่แสดงว่าความคิดพัฒนาอย่างไร',
  ] : [
    'A working web app with a public URL',
    'A PRD that records your Product Definition',
    'A Journal showing how your thinking evolved',
  ]
  return (
    <div className="content-page mission-brief-page">
      <Link className="back-link" to="/">
        <ArrowLeft aria-hidden="true" size={18} /> BACK TO BASE
      </Link>

      <header className="page-heading">
        <div>
          <span className="chapter-code">MISSION BRIEF</span>
          <h1>BUILD WITH GUIDE</h1>
        </div>
        <span className="mission-badge">QUEST 01</span>
      </header>

      <div className="brief-layout">
        <section className="brief-main arcade-panel" aria-labelledby="brief-title">
          <div className="panel-kicker">PRIMARY OBJECTIVE</div>
          <h2 id="brief-title">
            {isThai ? 'สร้าง ' : 'Turn '}<span>21 DAYS OF ______</span>{isThai ? ' ให้กลายเป็น Product จริง' : ' into a real product'}
          </h2>
          <p>
            {isThai ? 'คุณจะใช้ Chat เพื่อช่วยคิด ใช้ CODESIGN เพื่อบันทึกและ Lock การตัดสินใจ แล้วส่ง PRD ที่ชัดเจนให้ Codex สร้างเว็บแอป' : 'Use Chat to think, CODESIGN to capture and lock decisions, and Codex to build from a clear PRD.'}
          </p>

          <div className="outcome-list">
            <h3>{isThai ? 'เมื่อจบภารกิจ คุณจะมี' : 'BY THE END, YOU WILL HAVE'}</h3>
            <ul>
              {outcomes.map((outcome) => (
                <li key={outcome}>
                  <Check aria-hidden="true" size={18} /> {outcome}
                </li>
              ))}
            </ul>
          </div>

          <div className="role-callout">
            <strong>YOU ARE THE PRODUCT OWNER.</strong>
            <p>{isThai ? 'AI ช่วยคุณคิด แต่คุณเป็นคนตัดสินว่าอะไรจะกลายเป็นจริง' : 'AI helps you think, but you decide what becomes real.'}</p>
          </div>
        </section>

        <aside className="brief-sidebar">
          <section className="arcade-panel course-rules" aria-labelledby="rules-title">
            <div className="panel-kicker">BASIC BUILD RULES</div>
            <h2 id="rules-title">BUILD SMALL. FINISH STRONG.</h2>
            <ul>
              {buildRules.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon aria-hidden="true" size={19} /> {text}
                </li>
              ))}
            </ul>
          </section>
          <section className="time-card" aria-label={isThai ? 'คำอธิบาย 21 วัน' : '21-day clarification'}>
            <span>IMPORTANT</span>
            <p>
              {isThai ? '21 วันคือโครงสร้างของ Product ที่คุณกำลังสร้าง' : 'The 21 days are the structure of the product you are building.'}
              <strong>{isThai ? 'ไม่ใช่เวลาที่ต้องใช้ในการสร้าง' : 'They are not the build timeline.'}</strong>
            </p>
          </section>
        </aside>
      </div>

      <MissionMap compact />

      <div className="launch-row">
        <div>
          <span>READY CHECK</span>
          <p>{isThai ? 'คุณไม่ต้องมีคำตอบทั้งหมด แค่พร้อมเริ่มทำความเข้าใจไอเดียของคุณ' : 'You do not need every answer—only readiness to understand your idea.'}</p>
        </div>
        <ArcadeButton to="/auth">
          START BUILDING <ArrowRight aria-hidden="true" size={20} />
        </ArcadeButton>
      </div>
    </div>
  )
}
