import { useQuery } from '@tanstack/react-query'
import { ArrowRight, LogOut, Plus } from 'lucide-react'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { listProjects } from '../projects/project.service'

export function DashboardPage() {
  const { isThai } = useLanguage()
  const auth = useAuth()
  const projects = useQuery({ queryKey: ['projects'], queryFn: listProjects })

  return (
    <div className="content-page dashboard-page">
      <header className="dashboard-heading">
        <div>
          <span className="chapter-code">PLAYER DASHBOARD</span>
          <h1>WELCOME BACK</h1>
          <p>{auth.user?.email}</p>
        </div>
        <button className="secondary-action" type="button" onClick={() => void auth.signOut()}>
          <LogOut aria-hidden="true" size={18} /> SIGN OUT
        </button>
      </header>

      {projects.isLoading ? (
        <div className="dashboard-state" role="status">
          LOADING MISSIONS…
        </div>
      ) : null}

      {projects.isError ? (
        <div className="dashboard-state dashboard-state--error" role="alert">
          <strong>CONNECTION LOST</strong>
          <p>{isThai ? 'โหลด Project ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : 'Could not load projects. Please try again.'}</p>
          <button type="button" onClick={() => void projects.refetch()}>
            RETRY
          </button>
        </div>
      ) : null}

      {projects.data?.length === 0 ? (
        <section className="empty-projects" aria-labelledby="empty-title">
          <div className="empty-projects__icon" aria-hidden="true">
            <Plus size={32} />
          </div>
          <span className="panel-kicker">NO ACTIVE QUEST</span>
          <h2 id="empty-title">CREATE YOUR FIRST GUIDED BUILD</h2>
          <p>{isThai ? 'เริ่มจากหัวข้อหนึ่งเรื่อง แล้วใช้ CODESIGN เปลี่ยนไอเดียให้พร้อมสร้าง' : 'Start with one topic and use CODESIGN to turn it into something buildable.'}</p>
          <ArcadeButton to="/projects/new">
            NEW GUIDED PROJECT <ArrowRight aria-hidden="true" size={19} />
          </ArcadeButton>
        </section>
      ) : null}

      {projects.data && projects.data.length > 0 ? (
        <section className="project-grid" aria-labelledby="projects-title">
          <div className="section-heading-row">
            <h2 id="projects-title">CONTINUE</h2>
            <ArcadeButton to="/projects/new" variant="secondary">
              <Plus aria-hidden="true" size={17} /> NEW PROJECT
            </ArcadeButton>
          </div>
          {projects.data.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card__meta">
                <span>{project.current_phase} — CURRENT MISSION</span>
                <span>{project.status.replace('_', ' ').toUpperCase()}</span>
              </div>
              <h3>{project.title}</h3>
              <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
              <ArcadeButton to={`/projects/${project.id}/${project.current_phase}`}>
                CONTINUE MISSION <ArrowRight aria-hidden="true" size={18} />
              </ArcadeButton>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
