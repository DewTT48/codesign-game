import { useQuery } from '@tanstack/react-query'
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  FileClock,
  FileText,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AdminPhaseEntryRow,
  AdminProjectRecord,
  AdminProjectRow,
  Json,
  ProjectRow,
} from '../../lib/supabase/database.types'
import { getAdminProjectRecord, getAdminProjects } from './admin.service'

const phases = ['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N'] as const

const phaseNames: Record<(typeof phases)[number], string> = {
  C: 'CONTEXT',
  O: 'OPTIONS',
  D: 'DEBATE',
  E: 'ESTABLISH',
  S: 'SPECIFY',
  PRD: 'PRODUCT REQUIREMENTS',
  I: 'IMPLEMENT',
  G: 'GATHER FEEDBACK',
  N: 'NEXT ITERATION',
}

function formatDate(value: string | null, isThai: boolean) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function humanizeKey(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function ContentValue({ value }: { value: Json }) {
  if (value === null || value === '') return <span className="admin-record-empty-value">—</span>
  if (typeof value === 'string') return <p>{value}</p>
  if (typeof value === 'boolean') return <strong>{value ? 'YES' : 'NO'}</strong>
  if (typeof value === 'number') return <strong>{value}</strong>
  return <pre>{JSON.stringify(value, null, 2)}</pre>
}

function phaseProgress(project: AdminProjectRow) {
  if (project.current_phase === 'COMPLETE') return 100
  const currentIndex = phases.indexOf(project.current_phase as (typeof phases)[number])
  return Math.max(0, Math.round((currentIndex / phases.length) * 100))
}

function modeLabel(mode: ProjectRow['mode'], isThai: boolean) {
  if (mode === 'guided') return isThai ? '21 DAYS' : '21 DAYS'
  return isThai ? 'BUILD YOUR OWN' : 'BUILD YOUR OWN'
}

function statusLabel(status: ProjectRow['status'], isThai: boolean) {
  if (status === 'completed') return isThai ? 'เสร็จแล้ว' : 'COMPLETED'
  if (status === 'archived') return isThai ? 'เก็บเข้าคลัง' : 'ARCHIVED'
  return isThai ? 'กำลังดำเนินการ' : 'IN PROGRESS'
}

function safeExternalUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

function CurrentPhaseRecord({
  phase,
  entries,
  record,
  isThai,
}: {
  phase: (typeof phases)[number]
  entries: AdminPhaseEntryRow[]
  record: AdminProjectRecord
  isThai: boolean
}) {
  const currentEntries = entries.filter((entry) => entry.is_current)
  const previousEntries = entries.filter((entry) => !entry.is_current)
  const decisions = record.decisions.filter((decision) => decision.phase === phase)
  const currentDecisions = decisions.filter((decision) => decision.is_current)

  return (
    <details
      className="admin-record-phase"
      open={record.project.current_phase === phase}
    >
      <summary>
        <span>{phase}</span>
        <div>
          <strong>{phaseNames[phase]}</strong>
          <small>
            {currentEntries.length > 0
              ? `${currentEntries.length} ${isThai ? 'รายการ' : 'FIELDS'}`
              : (isThai ? 'ยังไม่มีข้อมูล' : 'NO DATA YET')}
          </small>
        </div>
        {currentEntries.some((entry) => entry.status === 'locked')
          ? <i><CheckCircle2 aria-hidden="true" size={15} /> LOCKED</i>
          : null}
        <ChevronRight aria-hidden="true" size={20} />
      </summary>

      <div className="admin-record-phase__body">
        {currentEntries.length === 0 ? (
          <p className="admin-record-no-data">
            {isThai ? 'ผู้ใช้ยังไม่ได้บันทึกข้อมูลใน Step นี้' : 'The user has not recorded content in this step.'}
          </p>
        ) : (
          <div className="admin-record-fields">
            {currentEntries.map((entry) => (
              <article key={entry.id}>
                <header>
                  <div>
                    <span>{humanizeKey(entry.section)}</span>
                    <h4>{humanizeKey(entry.field_key)}</h4>
                  </div>
                  <small>V{entry.version} · {entry.status.toUpperCase()}</small>
                </header>
                <ContentValue value={entry.content} />
                <time>{formatDate(entry.updated_at, isThai)}</time>
              </article>
            ))}
          </div>
        )}

        {currentDecisions.length > 0 ? (
          <section className="admin-record-decisions">
            <h4>{isThai ? 'คำตัดสินที่ใช้อยู่' : 'CURRENT DECISIONS'}</h4>
            {currentDecisions.map((decision) => (
              <article key={decision.id}>
                <header>
                  <strong>{humanizeKey(decision.decision_type)}</strong>
                  <span>V{decision.version}</span>
                </header>
                <ContentValue value={decision.content} />
                {decision.reason_for_change ? <small>{isThai ? 'เหตุผลที่แก้ไข' : 'CHANGE REASON'} · {decision.reason_for_change}</small> : null}
              </article>
            ))}
          </section>
        ) : null}

        {previousEntries.length > 0 || decisions.some((decision) => !decision.is_current) ? (
          <details className="admin-record-revisions">
            <summary><FileClock aria-hidden="true" size={17} /> {isThai ? 'ดู Revision ก่อนหน้า' : 'VIEW PREVIOUS REVISIONS'}</summary>
            {previousEntries.map((entry) => (
              <article key={entry.id}>
                <strong>{humanizeKey(entry.field_key)} · V{entry.version}</strong>
                <ContentValue value={entry.content} />
              </article>
            ))}
            {decisions.filter((decision) => !decision.is_current).map((decision) => (
              <article key={decision.id}>
                <strong>{humanizeKey(decision.decision_type)} · V{decision.version}</strong>
                <ContentValue value={decision.content} />
                {decision.reason_for_change ? <small>{decision.reason_for_change}</small> : null}
              </article>
            ))}
          </details>
        ) : null}
      </div>
    </details>
  )
}

function AdminProjectRecordDialog({
  project,
  isThai,
  onClose,
}: {
  project: AdminProjectRow
  isThai: boolean
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const record = useQuery({
    queryKey: ['admin-project-record', project.project_id],
    queryFn: () => getAdminProjectRecord(project.project_id),
    retry: false,
  })

  const entriesByPhase = useMemo(() => {
    const grouped = new Map<string, AdminPhaseEntryRow[]>()
    for (const entry of record.data?.phase_entries ?? []) {
      grouped.set(entry.phase, [...(grouped.get(entry.phase) ?? []), entry])
    }
    return grouped
  }, [record.data?.phase_entries])

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div className="admin-record-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose()
    }}>
      <section className="admin-record-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-project-record-title">
        <button ref={closeButtonRef} className="admin-record-close" type="button" onClick={onClose} aria-label={isThai ? 'ปิด Project Record' : 'Close Project Record'}>
          <X aria-hidden="true" size={24} />
        </button>

        <header className="admin-record-hero">
          <div>
            <span className="chapter-code">READ-ONLY PROJECT RECORD</span>
            <h2 id="admin-project-record-title">{project.title}</h2>
            <p>{project.topic}</p>
          </div>
          <div className="admin-record-mode">
            <span>{modeLabel(project.mode, isThai)}</span>
            <strong>{project.current_phase}</strong>
          </div>
        </header>

        {record.isLoading ? <div className="route-loading" role="status">LOADING PROJECT RECORD…</div> : null}
        {record.isError ? (
          <div className="admin-pass-feedback admin-pass-feedback--error" role="alert">
            {isThai ? 'เปิด Project Record ไม่สำเร็จ กรุณาตรวจสิทธิ์ Admin และ migration' : 'Could not open the Project Record. Check Admin access and the migration.'}
          </div>
        ) : null}

        {record.data ? (
          <>
            <section className="admin-record-summary" aria-label={isThai ? 'ข้อมูล Project' : 'Project information'}>
              <div><UserRound aria-hidden="true" size={20} /><span>{isThai ? 'เจ้าของ' : 'OWNER'}</span><strong>{record.data.owner.display_name || record.data.owner.email || record.data.owner.id}</strong><small>{record.data.owner.email}</small></div>
              <div><FolderKanban aria-hidden="true" size={20} /><span>{isThai ? 'สถานะ' : 'STATUS'}</span><strong>{statusLabel(record.data.project.status, isThai)}</strong><small>{record.data.project.solidification_stage}</small></div>
              <div><Clock3 aria-hidden="true" size={20} /><span>{isThai ? 'อัปเดตล่าสุด' : 'LAST UPDATED'}</span><strong>{formatDate(record.data.project.updated_at, isThai)}</strong><small>{isThai ? `สร้าง ${formatDate(record.data.project.created_at, isThai)}` : `CREATED ${formatDate(record.data.project.created_at, isThai)}`}</small></div>
            </section>

            <div className="admin-record-access-note">
              <ShieldCheck aria-hidden="true" size={18} />
              <span>{isThai ? 'มุมมองนี้เป็นแบบอ่านอย่างเดียว และการเปิด Project ถูกบันทึกใน Admin access log' : 'This view is read-only. Opening the project is recorded in the Admin access log.'}</span>
            </div>

            <section className="admin-record-section">
              <header><span className="panel-kicker">CODESIGN FLOW</span><h3>{isThai ? 'ข้อมูลและคำตัดสิน C–N' : 'C–N CONTENT & DECISIONS'}</h3></header>
              <div className="admin-record-phases">
                {phases.map((phase) => (
                  <CurrentPhaseRecord
                    key={phase}
                    phase={phase}
                    entries={entriesByPhase.get(phase) ?? []}
                    record={record.data}
                    isThai={isThai}
                  />
                ))}
              </div>
            </section>

            <section className="admin-record-section">
              <header><span className="panel-kicker">DELIVERABLES</span><h3>{isThai ? 'PRD, Build และ Feedback' : 'PRD, BUILD & FEEDBACK'}</h3></header>
              <div className="admin-record-artifacts">
                {record.data.prd_snapshots.map((snapshot) => (
                  <details key={snapshot.id}>
                    <summary><FileText aria-hidden="true" size={18} /> PRD V{snapshot.version} · {snapshot.status.toUpperCase()}</summary>
                    <pre>{snapshot.markdown_content}</pre>
                    {snapshot.content_pack ? <><h4>CONTENT PACK</h4><pre>{snapshot.content_pack}</pre></> : null}
                    {snapshot.experience_direction ? <><h4>EXPERIENCE DIRECTION</h4><pre>{snapshot.experience_direction}</pre></> : null}
                  </details>
                ))}
                {record.data.app_builds.map((build) => {
                  const appUrl = safeExternalUrl(build.app_url)
                  const repositoryUrl = safeExternalUrl(build.repository_url)
                  return <article key={build.id}>
                    <span>BUILD · {build.version_label}</span>
                    {appUrl
                      ? <a href={appUrl} target="_blank" rel="noreferrer">{build.app_url} <ExternalLink aria-hidden="true" size={15} /></a>
                      : <p>{build.app_url}</p>}
                    {build.repository_url
                      ? repositoryUrl
                        ? <a href={repositoryUrl} target="_blank" rel="noreferrer">{build.repository_url}</a>
                        : <p>{build.repository_url}</p>
                      : null}
                  </article>
                })}
                {record.data.feedback_entries.map((feedback) => (
                  <article key={feedback.id}>
                    <span>{humanizeKey(feedback.feedback_type)}</span>
                    <ContentValue value={feedback.content} />
                  </article>
                ))}
                {record.data.prd_snapshots.length === 0 && record.data.app_builds.length === 0 && record.data.feedback_entries.length === 0 ? (
                  <p className="admin-record-no-data">{isThai ? 'ยังไม่มี Deliverable ที่บันทึกไว้' : 'No deliverables have been recorded yet.'}</p>
                ) : null}
              </div>
            </section>

            {project.mode === 'own' ? (
              <section className="admin-record-section">
                <header><span className="panel-kicker">AI SUPPORT</span><h3>{isThai ? 'AI Proposal และ Usage' : 'AI PROPOSALS & USAGE'}</h3></header>
                <div className="admin-record-ai-summary">
                  <Bot aria-hidden="true" size={22} />
                  <strong>{record.data.ai_budget?.status.toUpperCase() ?? 'NOT CONFIGURED'}</strong>
                  <span>{record.data.ai_budget ? `${record.data.ai_budget.used_requests}/${record.data.ai_budget.max_requests ?? '—'} REQUESTS` : '0 REQUESTS'}</span>
                </div>
                <div className="admin-record-artifacts">
                  {record.data.ai_proposals.map((proposal) => (
                    <details key={proposal.id}>
                      <summary><Bot aria-hidden="true" size={18} /> {humanizeKey(proposal.action)} · {proposal.review_status.toUpperCase()}</summary>
                      <h4>PROVIDER PROPOSAL</h4>
                      <ContentValue value={proposal.envelope} />
                      {proposal.review_content ? <><h4>REVIEWED CONTENT</h4><ContentValue value={proposal.review_content} /></> : null}
                    </details>
                  ))}
                  {record.data.ai_proposals.length === 0 ? <p className="admin-record-no-data">{isThai ? 'ยังไม่มี AI Proposal' : 'No AI proposals yet.'}</p> : null}
                </div>
              </section>
            ) : null}

            <footer className="admin-record-footer">
              <span>PROJECT ID · {project.project_id}</span>
              <span>{isThai ? 'เปิดข้อมูลเมื่อ' : 'ACCESSED'} · {formatDate(record.data.accessed_at, isThai)}</span>
            </footer>
          </>
        ) : null}
      </section>
    </div>
  )
}

export function AdminProjectDirectory({ isThai }: { isThai: boolean }) {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mode, setMode] = useState<'all' | ProjectRow['mode']>('all')
  const [status, setStatus] = useState<'all' | ProjectRow['status']>('all')
  const [selectedProject, setSelectedProject] = useState<AdminProjectRow | null>(null)
  const projects = useQuery({
    queryKey: ['admin-projects', searchQuery, mode, status],
    queryFn: () => getAdminProjects({ searchText: searchQuery, mode, status }),
    retry: false,
  })

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  return (
    <>
      <section className="admin-panel admin-project-directory" aria-labelledby="admin-project-directory-title">
        <header className="admin-users-heading">
          <div>
            <span className="panel-kicker">PROJECT DIRECTORY</span>
            <h2 id="admin-project-directory-title">{isThai ? 'Project ทั้งหมดและรายละเอียด C–N' : 'ALL PROJECTS & C–N RECORDS'}</h2>
          </div>
          <button className="admin-project-refresh" type="button" disabled={projects.isFetching} onClick={() => void projects.refetch()}>
            <RefreshCw aria-hidden="true" size={18} /> {projects.isFetching ? 'REFRESHING…' : 'REFRESH'}
          </button>
        </header>

        <div className="admin-record-access-note">
          <Eye aria-hidden="true" size={19} />
          <span>{isThai ? 'Admin เปิดอ่าน Project Record ได้ครบเพื่อดูแลคุณภาพและสนับสนุนผู้ใช้ แต่ไม่สามารถแก้คำตอบหรือ Lock Step แทนเจ้าของ Project' : 'Admins can read the complete Project Record for quality and support, but cannot edit answers or lock steps for the project owner.'}</span>
        </div>

        <form className="admin-project-filters" role="search" onSubmit={handleSearch}>
          <label className="admin-project-search" htmlFor="admin-project-search">
            <Search aria-hidden="true" size={18} />
            <span className="sr-only">{isThai ? 'ค้นหา Project' : 'Search projects'}</span>
            <input
              id="admin-project-search"
              type="search"
              placeholder={isThai ? 'ชื่อ Project, Topic, ชื่อผู้ใช้, อีเมล หรือ Project ID' : 'Project, topic, user, email, or Project ID'}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit">SEARCH</button>
          </label>
          <label>
            <span>{isThai ? 'รูปแบบ' : 'MODE'}</span>
            <select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
              <option value="all">ALL PROJECTS</option>
              <option value="guided">21 DAYS</option>
              <option value="own">BUILD YOUR OWN</option>
            </select>
          </label>
          <label>
            <span>{isThai ? 'สถานะ' : 'STATUS'}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="all">ALL STATUS</option>
              <option value="in_progress">IN PROGRESS</option>
              <option value="completed">COMPLETED</option>
              <option value="archived">ARCHIVED</option>
            </select>
          </label>
        </form>

        {projects.isLoading ? <div className="route-loading" role="status">LOADING PROJECT DIRECTORY…</div> : null}
        {projects.isError ? <div className="admin-pass-feedback admin-pass-feedback--error" role="alert">
          {isThai ? 'โหลด Project Directory ไม่สำเร็จ กรุณาตรวจสอบ migration และสิทธิ์ Admin' : 'Could not load the Project Directory. Check the migration and Admin access.'}
        </div> : null}
        {!projects.isLoading && projects.data?.length === 0 ? <div className="admin-empty-users">{isThai ? 'ไม่พบ Project ตามเงื่อนไข' : 'NO MATCHING PROJECTS'}</div> : null}

        <div className="admin-project-list">
          {projects.data?.map((project) => (
            <article className="admin-project-card" key={project.project_id}>
              <header>
                <span className={`admin-project-mode admin-project-mode--${project.mode}`}>{modeLabel(project.mode, isThai)}</span>
                <span className={`admin-project-status admin-project-status--${project.project_status}`}>{statusLabel(project.project_status, isThai)}</span>
              </header>
              <div className="admin-project-card__identity">
                <h3>{project.title}</h3>
                <p>{project.topic}</p>
                <span><UserRound aria-hidden="true" size={15} /> {project.owner_display_name || project.owner_email || project.owner_id}</span>
                {project.owner_display_name && project.owner_email ? <small>{project.owner_email}</small> : null}
              </div>
              <div className="admin-project-progress">
                <div><span>{isThai ? 'STEP ปัจจุบัน' : 'CURRENT STEP'}</span><strong>{project.current_phase}</strong></div>
                <div className="admin-project-progress__bar"><i style={{ width: `${phaseProgress(project)}%` }} /></div>
                <small>{project.locked_phase_count}/9 LOCKED · {project.phase_entry_count} FIELDS · {project.decision_count} DECISIONS</small>
              </div>
              <footer>
                <span>{isThai ? 'ล่าสุด' : 'LAST ACTIVE'} · {formatDate(project.latest_activity_at, isThai)}</span>
                <button
                  type="button"
                  aria-label={`${isThai ? 'เปิด Project Record' : 'View Project Record'}: ${project.title}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <Eye aria-hidden="true" size={17} /> {isThai ? 'เปิด PROJECT RECORD' : 'VIEW PROJECT RECORD'}
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      {selectedProject ? (
        <AdminProjectRecordDialog
          project={selectedProject}
          isThai={isThai}
          onClose={() => setSelectedProject(null)}
        />
      ) : null}
    </>
  )
}
