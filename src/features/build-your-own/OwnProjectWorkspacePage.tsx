import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, Compass, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { getProject } from '../journey/journey.service'
import { useLanguage } from '../i18n/LanguageContext'

const codesignSteps = ['C', 'O', 'D', 'E', 'S', 'PRD'] as const

export function OwnProjectWorkspacePage() {
  const { isThai } = useLanguage()
  const { projectId } = useParams()
  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
  })

  if (!projectId) return <Navigate to="/dashboard" replace />

  if (project.isLoading) {
    return <div className="route-loading" role="status">{isThai ? 'กำลังโหลด Project…' : 'LOADING PROJECT…'}</div>
  }

  if (project.isError || !project.data) {
    return (
      <div className="content-page project-load-error">
        <Link className="back-link" to="/dashboard"><ArrowLeft size={18} /> DASHBOARD</Link>
        <section className="dashboard-state dashboard-state--error" role="alert">
          <strong>{isThai ? 'ไม่พบ Project นี้' : 'PROJECT NOT AVAILABLE'}</strong>
          <p>{isThai ? 'Project นี้ไม่มีอยู่ หรือบัญชีของคุณไม่มีสิทธิ์เข้าถึง' : 'This Project does not exist or your account cannot access it.'}</p>
        </section>
      </div>
    )
  }

  if (project.data.mode !== 'own') {
    return <Navigate to={`/projects/${project.data.id}/${project.data.current_phase}`} replace />
  }

  return (
    <div className="content-page own-workspace-page">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft aria-hidden="true" size={18} /> DASHBOARD
      </Link>

      <header className="own-workspace-hero">
        <div>
          <span className="chapter-code">BUILD YOUR OWN · PROJECT CREATED</span>
          <h1>{project.data.title}</h1>
          <p>{project.data.topic}</p>
        </div>
        <div className="own-workspace-hero__status">
          <CheckCircle2 aria-hidden="true" size={28} />
          <span>PASS USED</span>
        </div>
      </header>

      <SolidificationMeter current="IDEA" />

      <div className="own-workspace-grid">
        <section className="own-workspace-ready">
          <Compass aria-hidden="true" size={34} />
          <span className="panel-kicker">FOUNDATION READY</span>
          <h2>{isThai ? 'Project ของคุณพร้อมสำหรับ CODESIGN Flow' : 'YOUR PROJECT IS READY FOR THE CODESIGN FLOW'}</h2>
          <p>
            {isThai
              ? 'Project และสิทธิ์ถูกบันทึกแล้ว ส่วน AI-assisted flow จะเปิดใน Phase 3 หลังตั้งค่า allowance และ hard limits'
              : 'The Project and entitlement are saved. The AI-assisted flow opens in Phase 3 after allowance and hard limits are configured.'}
          </p>
          <div className="own-step-preview" aria-label={isThai ? 'ขั้นตอน CODESIGN ที่วางแผนไว้' : 'Planned CODESIGN steps'}>
            {codesignSteps.map((step, index) => (
              <span className={index === 0 ? 'is-next' : ''} key={step}>{step}</span>
            ))}
          </div>
        </section>

        <aside className="own-workspace-boundary">
          <Bot aria-hidden="true" size={30} />
          <h2>AI BOUNDARY</h2>
          <p>
            {isThai
              ? 'AI จะช่วยตีประเด็นและท้าทายสมมติฐาน แต่จะไม่ตัดสินใจแทนคุณ ทุกผลต้องผ่าน Accept หรือ Edit ก่อน'
              : 'AI will frame and challenge ideas, but it will not decide for you. Every output requires Accept or Edit.'}
          </p>
          <div><ShieldCheck aria-hidden="true" size={20} /> {isThai ? 'ยังไม่มีการเรียก AI ใน Phase นี้' : 'No AI calls are made in this phase'}</div>
        </aside>
      </div>

      <div className="own-workspace-actions">
        <ArcadeButton to="/dashboard" variant="secondary">
          BACK TO DASHBOARD
        </ArcadeButton>
        <button type="button" disabled>
          START C — CONTEXT <ArrowRight aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  )
}
