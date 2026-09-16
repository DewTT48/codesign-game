import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getProject } from '../journey/journey.service'
import { useLanguage } from '../i18n/LanguageContext'
import { OwnJourneyCompletionPage } from './OwnJourneyCompletionPage'
import { OwnJourneyPage } from './OwnJourneyPage'
import {
  isOwnJourneyPhase,
  ownJourneyPhases,
  type OwnJourneyPhase,
} from './ownJourneyContent'

export function OwnProjectWorkspacePage() {
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

  if (project.data.mode !== 'own') {
    return <Navigate to={`/projects/${project.data.id}/${project.data.current_phase}`} replace />
  }

  const currentPhase = project.data.current_phase
  if (currentPhase === 'COMPLETE') {
    return isOwnJourneyPhase(phase)
      ? <OwnJourneyPage project={project.data} phase={phase} readOnly />
      : <OwnJourneyCompletionPage project={project.data} />
  }

  if (!isOwnJourneyPhase(currentPhase)) return <Navigate to="/dashboard" replace />
  if (!phase) return <Navigate to={`/own-projects/${projectId}/${currentPhase}`} replace />
  if (!isOwnJourneyPhase(phase)) return <Navigate to={`/own-projects/${projectId}/${currentPhase}`} replace />

  const currentIndex = ownJourneyPhases.indexOf(currentPhase as OwnJourneyPhase)
  const requestedIndex = ownJourneyPhases.indexOf(phase)
  if (requestedIndex > currentIndex) {
    return <Navigate to={`/own-projects/${projectId}/${currentPhase}`} replace />
  }

  return <OwnJourneyPage project={project.data} phase={phase} readOnly={requestedIndex < currentIndex} />
}
