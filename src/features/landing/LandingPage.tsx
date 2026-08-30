import { ArrowRight, Gamepad2, Lightbulb, MessageSquareText } from 'lucide-react'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { useLanguage } from '../i18n/LanguageContext'

export function LandingPage() {
  const { isThai } = useLanguage()
  return (
    <div className="landing-page">
      <section className="hero-grid" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-light" aria-hidden="true" /> NEW MISSION AVAILABLE
          </div>
          <h1 id="hero-title">
            TURN UNCERTAINTY
            <span>INTO DECISIONS.</span>
          </h1>
          <p className="hero-lead">
            {isThai ? 'เรียนรู้วิธีเปลี่ยนไอเดียที่ยังไม่ชัด ให้กลายเป็น Product Definition ที่พร้อมส่งต่อให้ Codex สร้างจริง' : 'Learn to turn an unclear idea into a Product Definition that Codex can build.'}
          </p>
          <div className="hero-actions">
            <ArcadeButton to="/mission">
              BUILD WITH GUIDE <ArrowRight aria-hidden="true" size={20} />
            </ArcadeButton>
            <button className="text-action" type="button" disabled>
              BUILD ON YOUR OWN <span>COMING NEXT</span>
            </button>
          </div>
          <ul className="mission-rewards" aria-label={isThai ? 'สิ่งที่จะได้รับ' : 'Mission outcomes'}>
            <li>
              <Gamepad2 aria-hidden="true" size={19} /> Working web app
            </li>
            <li>
              <Lightbulb aria-hidden="true" size={19} /> Codex-ready PRD
            </li>
            <li>
              <MessageSquareText aria-hidden="true" size={19} /> Decision journal
            </li>
          </ul>
        </div>

        <aside className="quest-card" aria-label={isThai ? 'ภารกิจ Build with Guide' : 'Build with Guide mission'}>
          <div className="quest-card__topline">
            <span>QUEST 01</span>
            <span className="difficulty">GUIDED</span>
          </div>
          <div className="quest-card__screen">
            <span className="screen-label">YOUR BUILD</span>
            <strong>21 DAYS OF</strong>
            <span className="blank-topic">________________</span>
            <p>{isThai ? 'คุณเลือกหัวข้อ เนื้อหา และทิศทางของ Product เอง' : 'You choose the topic, content, and product direction.'}</p>
          </div>
          <div className="quest-card__rule">
            <span>FIXED CONSTRAINT</span>
            <strong>21-DAY PRODUCT STRUCTURE</strong>
          </div>
          <div className="pixel-landscape" aria-hidden="true">
            <span className="pixel-flag">PRD</span>
            <span className="pixel-character">C</span>
          </div>
        </aside>
      </section>

      <section className="thesis-band" aria-label="Product thesis">
        <span className="thesis-number">01</span>
        <p>
          {isThai ? 'คุณไม่ต้องการ ' : 'You do not need a '}<s>Perfect First Prompt</s>
          <strong>{isThai ? 'คุณต้องการกระบวนการที่เปลี่ยนความไม่แน่ใจให้เป็นการตัดสินใจ' : 'You need a process that turns uncertainty into decisions.'}</strong>
        </p>
      </section>

      <div className="dashboard-preview">
        <MissionMap />
        <SolidificationMeter />
      </div>
    </div>
  )
}
