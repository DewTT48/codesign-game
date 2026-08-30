import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowRight, LogOut, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { archiveProject, deleteProject, listProjects, restoreProject } from '../projects/project.service'

export function DashboardPage() {
  const { isThai } = useLanguage()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const projects = useQuery({ queryKey: ['projects'], queryFn: listProjects })
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const refreshProjects = () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  const archiveMutation = useMutation({ mutationFn: archiveProject, onSuccess: refreshProjects })
  const restoreMutation = useMutation({ mutationFn: restoreProject, onSuccess: refreshProjects })
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    async onSuccess() {
      setDeleteTarget(null)
      setDeleteConfirmation('')
      await refreshProjects()
    },
  })

  const activeProjects = projects.data?.filter((project) => project.status !== 'archived') ?? []
  const archivedProjects = projects.data?.filter((project) => project.status === 'archived') ?? []
  const actionError = archiveMutation.error ?? restoreMutation.error ?? deleteMutation.error

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return
    setDeleteTarget(null)
    setDeleteConfirmation('')
  }

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

      {actionError ? (
        <div className="dashboard-action-error" role="alert">
          {isThai ? 'จัดการ Mission ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : 'Could not update this mission. Please try again.'}
        </div>
      ) : null}

      {!projects.isLoading && !projects.isError && activeProjects.length === 0 ? (
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

      {activeProjects.length > 0 ? (
        <section className="project-grid" aria-labelledby="projects-title">
          <div className="section-heading-row">
            <h2 id="projects-title">CONTINUE</h2>
            <ArcadeButton to="/projects/new" variant="secondary">
              <Plus aria-hidden="true" size={17} /> NEW PROJECT
            </ArcadeButton>
          </div>
          {activeProjects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card__meta">
                <span>{project.current_phase} — CURRENT MISSION</span>
                <span>{project.status.replace('_', ' ').toUpperCase()}</span>
              </div>
              <h3>{project.title}</h3>
              <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
              <div className="project-card__actions">
                <ArcadeButton to={`/projects/${project.id}/${project.current_phase}`}>
                  CONTINUE MISSION <ArrowRight aria-hidden="true" size={18} />
                </ArcadeButton>
                <button
                  className="mission-manage-action"
                  type="button"
                  disabled={archiveMutation.isPending}
                  onClick={() => archiveMutation.mutate(project.id)}
                >
                  <Archive aria-hidden="true" size={18} />
                  {isThai ? 'เก็บเข้าคลัง' : 'ARCHIVE'}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {archivedProjects.length > 0 ? (
        <section className="archive-section" aria-labelledby="archive-title">
          <div className="archive-section__heading">
            <div>
              <span className="panel-kicker">MISSION STORAGE</span>
              <h2 id="archive-title">ARCHIVED</h2>
            </div>
            <span>{archivedProjects.length}</span>
          </div>
          <p>{isThai ? 'Mission ในคลังจะไม่แสดงในรายการหลัก คุณกู้คืนหรือลบถาวรได้ที่นี่' : 'Archived missions stay out of your active list. Restore or permanently delete them here.'}</p>
          <div className="archive-list">
            {archivedProjects.map((project) => (
              <article className="archive-card" key={project.id}>
                <div>
                  <span>{project.current_phase} — LAST MISSION</span>
                  <h3>{project.title}</h3>
                </div>
                <div className="archive-card__actions">
                  <button type="button" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(project)}>
                    <RotateCcw aria-hidden="true" size={17} /> {isThai ? 'กู้คืน' : 'RESTORE'}
                  </button>
                  <button className="archive-card__delete" type="button" onClick={() => setDeleteTarget(project)}>
                    <Trash2 aria-hidden="true" size={17} /> {isThai ? 'ลบถาวร' : 'DELETE'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {deleteTarget ? (
        <div className="delete-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) closeDeleteDialog()
        }}>
          <section className="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <button className="delete-dialog__close" type="button" aria-label={isThai ? 'ปิด' : 'Close'} onClick={closeDeleteDialog}>
              <X aria-hidden="true" size={22} />
            </button>
            <Trash2 className="delete-dialog__icon" aria-hidden="true" size={34} />
            <span className="chapter-code">DANGER ZONE</span>
            <h2 id="delete-dialog-title">DELETE MISSION?</h2>
            <p>{isThai ? 'การลบนี้จะลบคำตอบ การตัดสินใจ PRD และ Journal ทั้งหมดของ Mission นี้อย่างถาวร และไม่สามารถกู้คืนได้' : 'This permanently removes every answer, decision, PRD, and journal entry in this mission. It cannot be undone.'}</p>
            <strong>{deleteTarget.title}</strong>
            <label htmlFor="delete-confirmation">{isThai ? 'พิมพ์ DELETE เพื่อยืนยัน' : 'TYPE DELETE TO CONFIRM'}</label>
            <input
              id="delete-confirmation"
              autoComplete="off"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
            />
            <div className="delete-dialog__actions">
              <button type="button" onClick={closeDeleteDialog}>{isThai ? 'ยกเลิก' : 'CANCEL'}</button>
              <button
                className="delete-dialog__confirm"
                type="button"
                disabled={deleteConfirmation !== 'DELETE' || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? 'DELETING…' : isThai ? 'ลบ Mission ถาวร' : 'DELETE PERMANENTLY'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
