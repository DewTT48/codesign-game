import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CalendarClock, History, RotateCcw } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import { useLanguage } from '../i18n/LanguageContext'
import { getProject, getProjectPhaseRevisions } from './journey.service'
import { currentPhasePath } from './phaseNavigation'

export function RevisionHistoryPage() {
  const { projectId } = useParams()
  const { isThai } = useLanguage()
  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
  })
  const revisions = useQuery({
    queryKey: ['phase-revisions', projectId],
    queryFn: () => getProjectPhaseRevisions(projectId!),
    enabled: Boolean(projectId),
  })

  if (!projectId) return <Navigate to="/dashboard" replace />
  if (project.isLoading || revisions.isLoading) return <div className="route-loading" role="status">{isThai ? 'กำลังโหลดประวัติ Revision…' : 'LOADING REVISION HISTORY…'}</div>
  if (project.isError || revisions.isError || !project.data) return <div className="route-loading" role="alert">{isThai ? 'โหลดประวัติ Revision ไม่สำเร็จ' : 'REVISION HISTORY COULD NOT BE LOADED.'}</div>

  const currentPath = currentPhasePath(projectId, project.data.current_phase)

  return <div className="content-page revision-history-page">
    <div className="journey-utility-row">
      <Link className="back-link" to="/dashboard"><ArrowLeft size={18} /> {isThai ? 'แดชบอร์ด' : 'DASHBOARD'}</Link>
      <Link className="revision-history-page__current" to={currentPath}>{isThai ? (project.data.current_phase === 'COMPLETE' ? 'กลับไปหน้าสรุป' : 'กลับไป Step ปัจจุบัน') : (project.data.current_phase === 'COMPLETE' ? 'RETURN TO SUMMARY' : 'RETURN TO CURRENT STEP')} <ArrowRight size={17} /></Link>
    </div>

    <header className="revision-history-page__hero">
      <History size={42} aria-hidden="true" />
      <div><span>{isThai ? 'บันทึกการเปลี่ยนแปลงของ Project' : 'PROJECT CHANGE LOG'}</span><h1>{isThai ? 'ประวัติ Revision' : 'REVISION HISTORY'}</h1><p>{isThai ? 'ทุกครั้งที่ย้อนกลับไปแก้ ระบบจะเก็บเหตุผล จุดเริ่มต้น และ Step ที่ต้องยืนยันใหม่ โดยไม่ลบข้อมูลฉบับก่อนหน้า' : 'Every revision records its reason, starting point, and affected steps without deleting prior versions.'}</p></div>
    </header>

    <div className="journey-status-grid">
      <MissionMap activeMission={project.data.current_phase} projectId={projectId} compact />
      <SolidificationMeter current={project.data.solidification_stage.replace('_', ' ') as 'IDEA'} />
    </div>

    <section className="revision-timeline" aria-labelledby="revision-timeline-title">
      <header><RotateCcw size={22} /><div><span>{isThai ? 'จากใหม่ไปเก่า' : 'NEWEST FIRST'}</span><h2 id="revision-timeline-title">{isThai ? `${revisions.data?.length ?? 0} Revision` : `${revisions.data?.length ?? 0} REVISIONS`}</h2></div></header>
      {revisions.data?.length ? <ol>{revisions.data.map((revision) => <li key={revision.id}>
        <div className="revision-timeline__marker">{revision.targetPhase}</div>
        <article>
          <header><div><span>REVISION {revision.targetPhase} · v{revision.version}</span><h3>{isThai ? `ย้อนกลับไปแก้ Step ${revision.targetPhase}` : `REVISED FROM STEP ${revision.targetPhase}`}</h3></div><small><CalendarClock size={15} /> {new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(revision.createdAt))}</small></header>
          <blockquote>{revision.reason || (isThai ? 'ไม่ได้ระบุเหตุผล' : 'NO REASON RECORDED')}</blockquote>
          <p><strong>{isThai ? 'ต้องยืนยันใหม่:' : 'RECONFIRM:'}</strong> {revision.affectedPhases.join(' → ')}</p>
          <p><strong>{isThai ? 'จุดที่อยู่ก่อนเริ่ม Revision:' : 'STARTED FROM:'}</strong> {revision.sourceCurrentPhase}</p>
          <Link to={`/projects/${projectId}/${revision.targetPhase}`}>{isThai ? `เปิด Step ${revision.targetPhase}` : `OPEN STEP ${revision.targetPhase}`} <ArrowRight size={16} /></Link>
        </article>
      </li>)}</ol> : <div className="revision-timeline__empty"><History size={30} /><strong>{isThai ? 'ยังไม่มี Revision' : 'NO REVISIONS YET'}</strong><p>{isThai ? 'การเปิดดู Step เก่าจะไม่สร้าง Revision จนกว่าคุณจะกดเริ่มแก้ไขและยืนยัน' : 'Reviewing prior steps does not create a revision until you explicitly start one.'}</p></div>}
    </section>
  </div>
}
