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

const outcomes = [
  'เว็บแอปที่ใช้งานได้และมี Public URL',
  'PRD ที่บันทึก Product Definition ของคุณ',
  'Journal ที่แสดงว่าความคิดพัฒนาอย่างไร',
]

const buildRules = [
  { icon: Globe2, text: 'Standalone web app' },
  { icon: BotOff, text: 'No embedded AI' },
  { icon: Database, text: 'Browser persistence only' },
  { icon: ShieldCheck, text: 'No Auth or backend in your app' },
]

export function MissionBriefPage() {
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
            สร้าง <span>21 DAYS OF ______</span> ให้กลายเป็น Product จริง
          </h2>
          <p>
            คุณจะใช้ Chat เพื่อช่วยคิด ใช้ CODESIGN เพื่อบันทึกและ Lock
            การตัดสินใจ แล้วส่ง PRD ที่ชัดเจนให้ Codex สร้างเว็บแอป
          </p>

          <div className="outcome-list">
            <h3>เมื่อจบภารกิจ คุณจะมี</h3>
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
            <p>AI ช่วยคุณคิด แต่คุณเป็นคนตัดสินว่าอะไรจะกลายเป็นจริง</p>
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
          <section className="time-card" aria-label="คำอธิบาย 21 วัน">
            <span>IMPORTANT</span>
            <p>
              21 วันคือโครงสร้างของ Product ที่คุณกำลังสร้าง
              <strong>ไม่ใช่เวลาที่ต้องใช้ในการสร้าง</strong>
            </p>
          </section>
        </aside>
      </div>

      <MissionMap compact />

      <div className="launch-row">
        <div>
          <span>READY CHECK</span>
          <p>คุณไม่ต้องมีคำตอบทั้งหมด แค่พร้อมเริ่มทำความเข้าใจไอเดียของคุณ</p>
        </div>
        <ArcadeButton to="/auth">
          START BUILDING <ArrowRight aria-hidden="true" size={20} />
        </ArcadeButton>
      </div>
    </div>
  )
}
