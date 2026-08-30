import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'

export function ProjectPlaceholderPage() {
  const { projectId } = useParams()
  return (
    <div className="content-page project-placeholder-page">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft aria-hidden="true" size={18} /> DASHBOARD
      </Link>
      <header className="page-heading">
        <div>
          <span className="chapter-code">GUIDED BUILD</span>
          <h1>C — CONTEXT</h1>
        </div>
        <span className="mission-badge">UNDER CONSTRUCTION</span>
      </header>
      <MissionMap />
      <div className="dashboard-preview placeholder-grid">
        <section className="arcade-panel">
          <span className="panel-kicker">NEXT MILESTONE</span>
          <h2>DON&apos;T DESIGN YET.</h2>
          <p>Context capture, review และ lock gate จะถูกสร้างใน Milestone 3</p>
          <small>PROJECT ID — {projectId}</small>
        </section>
        <SolidificationMeter />
      </div>
    </div>
  )
}
