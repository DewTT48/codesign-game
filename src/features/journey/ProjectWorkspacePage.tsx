import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getProject, type PhaseCode } from './journey.service'
import { ContextPhase } from './phases/ContextPhase'
import { DebatePhase } from './phases/DebatePhase'
import { EstablishPhase } from './phases/EstablishPhase'
import { OptionsPhase } from './phases/OptionsPhase'
import { SpecifyPhase } from './phases/SpecifyPhase'
import { PrdPhase } from './prd/PrdPhase'
import { ImplementPhase } from './phases/ImplementPhase'
import { FeedbackPhase } from './phases/FeedbackPhase'
import { NextPhase } from './phases/NextPhase'
import { CompletionPage } from './CompletionPage'
import { ProjectPlaceholderPage } from '../projects/ProjectPlaceholderPage'
import { useLanguage } from '../i18n/LanguageContext'
import { PhaseHistoryPage } from './PhaseHistoryPage'
import { resolvePhaseRoute } from './phaseNavigation'

const supportedPhases = new Set<PhaseCode>(['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N'])

export function ProjectWorkspacePage() {
  const { isThai } = useLanguage()
  const { projectId, phase } = useParams()
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
        <Link className="back-link" to="/dashboard"><ArrowLeft size={18} /> {isThai ? 'แดชบอร์ด' : 'DASHBOARD'}</Link>
        <section className="dashboard-state dashboard-state--error" role="alert">
          <strong>{isThai ? 'ไม่พบ Project นี้' : 'PROJECT NOT AVAILABLE'}</strong>
          <p>{isThai ? 'Project นี้ไม่มีอยู่ หรือบัญชีของคุณไม่มีสิทธิ์เข้าถึง' : 'This project does not exist or your account cannot access it.'}</p>
        </section>
      </div>
    )
  }

  const currentPhase = project.data.current_phase
  const requestedPhase = supportedPhases.has(phase as PhaseCode) ? phase as PhaseCode : null
  const routeMode = resolvePhaseRoute(requestedPhase, currentPhase)
  if (routeMode === 'history' && requestedPhase) {
    return <PhaseHistoryPage project={project.data} phase={requestedPhase} />
  }
  if (routeMode === 'completion') return <CompletionPage project={project.data} />
  if (routeMode === 'redirect' || !requestedPhase) {
    return <Navigate to={`/projects/${projectId}/${currentPhase}`} replace />
  }

  switch (requestedPhase) {
    case 'C': return <ContextPhase project={project.data} />
    case 'O': return <OptionsPhase project={project.data} />
    case 'D': return <DebatePhase project={project.data} />
    case 'E': return <EstablishPhase project={project.data} />
    case 'S': return <SpecifyPhase project={project.data} />
    case 'PRD': return <PrdPhase project={project.data} />
    case 'I': return <ImplementPhase project={project.data} />
    case 'G': return <FeedbackPhase project={project.data} />
    case 'N': return <NextPhase project={project.data} />
    default: return <ProjectPlaceholderPage />
  }
}
