import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Archive,
  ArrowLeft,
  Bot,
  CheckCircle2,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldCheck,
  TicketCheck,
  TicketPlus,
  Users,
  X,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AdminUserRow } from '../../lib/supabase/database.types'
import { useLanguage } from '../i18n/LanguageContext'
import { summarizeProjectPasses } from '../project-pass/projectPass.service'
import {
  createAdminGrantKey,
  enableAdminAiTestAllowance,
  getAdminOverview,
  getAdminOwnProjects,
  getAdminProjectPasses,
  getAdminUsers,
  grantAdminProjectPass,
} from './admin.service'

const phaseNames: Record<string, string> = {
  C: 'CONTEXT',
  O: 'OPTIONS',
  D: 'DEBATE',
  E: 'ESTABLISH',
  S: 'SPECIFY',
  PRD: 'PRODUCT REQUIREMENTS',
  I: 'IMPLEMENT',
  G: 'GATHER FEEDBACK',
  N: 'NEXT ITERATION',
  COMPLETE: 'COMPLETE',
}

function formatDate(value: string, isThai: boolean) {
  return new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AdminPage() {
  const { isThai } = useLanguage()
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [grantTarget, setGrantTarget] = useState<AdminUserRow | null>(null)
  const [grantKey, setGrantKey] = useState('')
  const [grantNote, setGrantNote] = useState('')
  const [grantSuccess, setGrantSuccess] = useState('')
  const [allowanceSuccess, setAllowanceSuccess] = useState('')
  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview })
  const users = useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: () => getAdminUsers(searchQuery),
  })
  const passes = useQuery({
    queryKey: ['admin-project-passes'],
    queryFn: getAdminProjectPasses,
    retry: false,
  })
  const ownProjects = useQuery({
    queryKey: ['admin-own-projects'],
    queryFn: getAdminOwnProjects,
    retry: false,
  })
  const grantMutation = useMutation({
    mutationFn: (input: Parameters<typeof grantAdminProjectPass>[0]) =>
      grantAdminProjectPass(input),
    async onSuccess(grantedPass) {
      setGrantSuccess(grantedPass.owner_id)
      setGrantTarget(null)
      setGrantKey('')
      setGrantNote('')
      await queryClient.invalidateQueries({ queryKey: ['admin-project-passes'] })
    },
  })
  const allowanceMutation = useMutation({
    mutationFn: (projectId: string) => enableAdminAiTestAllowance(projectId),
    async onSuccess(budget) {
      setAllowanceSuccess(budget.project_id)
      await queryClient.invalidateQueries({ queryKey: ['admin-own-projects'] })
    },
  })

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  function openGrantDialog(user: AdminUserRow) {
    setGrantSuccess('')
    grantMutation.reset()
    setGrantTarget(user)
    setGrantKey(createAdminGrantKey(user.user_id))
    setGrantNote('')
  }

  function closeGrantDialog() {
    if (grantMutation.isPending) return
    setGrantTarget(null)
    setGrantKey('')
    setGrantNote('')
    grantMutation.reset()
  }

  function handleGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!grantTarget || !grantKey) return
    grantMutation.mutate({
      userId: grantTarget.user_id,
      grantKey,
      note: grantNote,
    })
  }

  const refreshing = overview.isFetching || users.isFetching || passes.isFetching || ownProjects.isFetching
  const maxPhaseCount = Math.max(1, ...(overview.data?.phase_counts.map((item) => item.count) ?? [1]))

  return (
    <div className="content-page admin-page">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft aria-hidden="true" size={18} /> PLAYER DASHBOARD
      </Link>

      <header className="admin-heading">
        <div>
          <span className="chapter-code">SYSTEM CONTROL</span>
          <h1>ADMIN DASHBOARD</h1>
          <p>{isThai ? 'ภาพรวมการใช้งานสำหรับดูแลระบบ โดยไม่เปิดอ่านเนื้อหา Mission ส่วนตัว' : 'A privacy-first operational overview without access to private mission content.'}</p>
        </div>
        <div className="admin-heading__actions">
          <span className="admin-readonly-badge"><ShieldCheck aria-hidden="true" size={18} /> ADMIN CONTROLS</span>
          <button type="button" disabled={refreshing} onClick={() => {
            void overview.refetch()
            void users.refetch()
            void passes.refetch()
            void ownProjects.refetch()
          }}>
            <RefreshCw aria-hidden="true" size={18} /> {refreshing ? 'REFRESHING…' : 'REFRESH'}
          </button>
        </div>
      </header>

      {overview.isLoading || users.isLoading ? (
        <div className="route-loading" role="status">LOADING SYSTEM STATUS…</div>
      ) : null}

      {overview.isError || users.isError ? (
        <section className="dashboard-state dashboard-state--error" role="alert">
          <strong>ADMIN DATA UNAVAILABLE</strong>
          <p>{isThai ? 'โหลดข้อมูลดูแลระบบไม่สำเร็จ กรุณาตรวจสอบสิทธิ์และลองใหม่' : 'Could not load admin data. Check access and try again.'}</p>
        </section>
      ) : null}

      {overview.data ? (
        <>
          <section className="admin-metrics" aria-label={isThai ? 'สถิติภาพรวม' : 'Overview metrics'}>
            <article className="admin-metric-card">
              <Users aria-hidden="true" size={25} />
              <span>{isThai ? 'ผู้ใช้ทั้งหมด' : 'TOTAL USERS'}</span>
              <strong>{overview.data.total_users}</strong>
            </article>
            <article className="admin-metric-card">
              <FolderKanban aria-hidden="true" size={25} />
              <span>{isThai ? 'Mission ทั้งหมด' : 'TOTAL MISSIONS'}</span>
              <strong>{overview.data.total_missions}</strong>
            </article>
            <article className="admin-metric-card">
              <Activity aria-hidden="true" size={25} />
              <span>{isThai ? 'กำลังดำเนินการ' : 'IN PROGRESS'}</span>
              <strong>{overview.data.active_missions}</strong>
            </article>
            <article className="admin-metric-card">
              <CheckCircle2 aria-hidden="true" size={25} />
              <span>{isThai ? 'สำเร็จแล้ว' : 'COMPLETED'}</span>
              <strong>{overview.data.completed_missions}</strong>
            </article>
          </section>

          <section className="admin-secondary-grid">
            <article className="admin-panel admin-growth-panel">
              <header>
                <div>
                  <span className="panel-kicker">ACTIVITY</span>
                  <h2>{isThai ? 'การเติบโตล่าสุด' : 'RECENT GROWTH'}</h2>
                </div>
                <Activity aria-hidden="true" size={24} />
              </header>
              <div className="admin-growth-grid">
                <div><strong>{overview.data.users_7d}</strong><span>{isThai ? 'ผู้ใช้ใหม่ 7 วัน' : 'NEW USERS · 7D'}</span></div>
                <div><strong>{overview.data.users_30d}</strong><span>{isThai ? 'ผู้ใช้ใหม่ 30 วัน' : 'NEW USERS · 30D'}</span></div>
                <div><strong>{overview.data.missions_7d}</strong><span>{isThai ? 'Mission ใหม่ 7 วัน' : 'NEW MISSIONS · 7D'}</span></div>
                <div><strong>{overview.data.missions_30d}</strong><span>{isThai ? 'Mission ใหม่ 30 วัน' : 'NEW MISSIONS · 30D'}</span></div>
              </div>
              <div className="admin-archive-note">
                <Archive aria-hidden="true" size={19} />
                <span>{isThai ? `มี ${overview.data.archived_missions} Mission อยู่ในคลัง` : `${overview.data.archived_missions} missions archived`}</span>
              </div>
            </article>

            <article className="admin-panel admin-phase-panel">
              <header>
                <div>
                  <span className="panel-kicker">MISSION FLOW</span>
                  <h2>{isThai ? 'ตำแหน่งของ Mission' : 'PHASE DISTRIBUTION'}</h2>
                </div>
              </header>
              <div className="admin-phase-chart">
                {overview.data.phase_counts.map((item) => (
                  <div className="admin-phase-row" key={item.phase}>
                    <span>{item.phase}</span>
                    <div><i style={{ width: `${Math.max(item.count > 0 ? 7 : 0, (item.count / maxPhaseCount) * 100)}%` }} /></div>
                    <strong>{item.count}</strong>
                    <small>{phaseNames[item.phase]}</small>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-panel admin-users-panel" aria-labelledby="admin-users-title">
            <header className="admin-users-heading">
              <div>
                <span className="panel-kicker">ACCOUNT DIRECTORY</span>
                <h2 id="admin-users-title">{isThai ? 'บัญชีผู้ใช้ล่าสุด' : 'RECENT USERS'}</h2>
              </div>
              <form className="admin-user-search" role="search" onSubmit={handleSearch}>
                <label className="sr-only" htmlFor="admin-user-search">{isThai ? 'ค้นหาผู้ใช้' : 'Search users'}</label>
                <Search aria-hidden="true" size={18} />
                <input
                  id="admin-user-search"
                  type="search"
                  placeholder={isThai ? 'ค้นหาชื่อหรืออีเมล' : 'Search name or email'}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                <button type="submit">SEARCH</button>
              </form>
            </header>

            <div className="admin-privacy-note">
              <ShieldCheck aria-hidden="true" size={19} />
              <span>{isThai ? 'จัดการสิทธิ์ Project Pass ได้ โดยยังคงไม่แสดงคำตอบ Decisions PRD หรือ Journal ส่วนตัว' : 'Manage Project Pass access without exposing private answers, decisions, PRDs, or journals.'}</span>
            </div>

            {passes.isError ? (
              <div className="admin-pass-feedback admin-pass-feedback--error" role="alert">
                {isThai ? 'โหลดข้อมูล Project Pass ไม่สำเร็จ กรุณาตรวจสอบว่า migration ถูกใช้งานบน Supabase แล้ว' : 'Could not load Project Passes. Confirm that the migration is active on Supabase.'}
              </div>
            ) : null}

            {grantSuccess ? (
              <div className="admin-pass-feedback" role="status">
                <TicketCheck aria-hidden="true" size={19} />
                {isThai ? 'เพิ่ม Project Pass สำเร็จ ผู้ใช้จะเห็นสิทธิ์ใหม่เมื่อเปิดหรือรีเฟรช Dashboard' : 'Project Pass granted. The user will see it after opening or refreshing the dashboard.'}
              </div>
            ) : null}

            {users.data?.length === 0 ? (
              <div className="admin-empty-users">{isThai ? 'ไม่พบบัญชีที่ค้นหา' : 'NO MATCHING ACCOUNTS'}</div>
            ) : null}

            <div className="admin-user-list">
              {users.data?.map((user) => {
                const passSummary = summarizeProjectPasses(
                  passes.data?.filter((pass) => pass.owner_id === user.user_id) ?? [],
                )

                return (
                  <article className="admin-user-card" key={user.user_id}>
                  <div className="admin-user-identity">
                    <span aria-hidden="true">{(user.display_name || user.email || '?').slice(0, 1).toUpperCase()}</span>
                    <div>
                      <h3>{user.display_name || (isThai ? 'ยังไม่ได้ระบุชื่อ' : 'Unnamed player')}</h3>
                      <p>{user.email || 'NO EMAIL'}</p>
                    </div>
                  </div>
                  <dl className="admin-user-stats">
                    <div><dt>{isThai ? 'ทั้งหมด' : 'TOTAL'}</dt><dd>{user.total_missions}</dd></div>
                    <div><dt>{isThai ? 'กำลังทำ' : 'ACTIVE'}</dt><dd>{user.active_missions}</dd></div>
                    <div><dt>{isThai ? 'สำเร็จ' : 'DONE'}</dt><dd>{user.completed_missions}</dd></div>
                    <div><dt>{isThai ? 'คลัง' : 'ARCHIVE'}</dt><dd>{user.archived_missions}</dd></div>
                  </dl>
                  <div className="admin-user-dates">
                    <span>{isThai ? 'สมัคร' : 'JOINED'} · {formatDate(user.joined_at, isThai)}</span>
                    <span>{isThai ? 'ล่าสุด' : 'LAST ACTIVE'} · {formatDate(user.last_activity_at, isThai)}</span>
                  </div>
                  <div className="admin-pass-control">
                    <div>
                      <TicketCheck aria-hidden="true" size={18} />
                      <span>{isThai ? 'พร้อมใช้' : 'AVAILABLE'}</span>
                      <strong>{passes.isLoading ? '—' : passSummary.available}</strong>
                    </div>
                    <small>
                      {isThai
                        ? `ใช้แล้ว ${passSummary.consumed} · ยกเลิก ${passSummary.revoked}`
                        : `USED ${passSummary.consumed} · REVOKED ${passSummary.revoked}`}
                    </small>
                    <button
                      type="button"
                      disabled={passes.isError}
                      aria-label={`${isThai ? 'เพิ่ม 1 Project Pass ให้' : 'Grant 1 Project Pass to'} ${user.email || user.display_name || user.user_id}`}
                      onClick={() => openGrantDialog(user)}
                    >
                      <TicketPlus aria-hidden="true" size={17} />
                      {isThai ? 'เพิ่ม 1 PASS' : 'GRANT 1 PASS'}
                    </button>
                  </div>
                </article>
                )
              })}
            </div>
          </section>

          <section className="admin-panel admin-ai-projects" aria-labelledby="admin-ai-projects-title">
            <header className="admin-users-heading">
              <div>
                <span className="panel-kicker">INTERNAL AI TESTING</span>
                <h2 id="admin-ai-projects-title">{isThai ? 'Own Project และ AI Allowance' : 'OWN PROJECT AI ALLOWANCES'}</h2>
              </div>
              <Bot aria-hidden="true" size={28} />
            </header>
            <div className="admin-privacy-note">
              <ShieldCheck aria-hidden="true" size={19} />
              <span>{isThai ? 'แสดงเฉพาะ metadata และตัวนับการใช้งาน ไม่เปิดอ่านข้อความ Draft, Decision หรือ PRD ของผู้ใช้' : 'Shows metadata and usage counters only. Private drafts, decisions, and PRDs remain hidden.'}</span>
            </div>
            {allowanceSuccess ? <div className="admin-pass-feedback" role="status">
              <CheckCircle2 aria-hidden="true" size={19} />
              {isThai ? 'เปิด Internal AI allowance แล้ว: สูงสุด 5 requests และ $1 ต่อ Project' : 'Internal AI allowance enabled: up to 5 requests and $1 per project.'}
            </div> : null}
            {allowanceMutation.isError || ownProjects.isError ? <div className="admin-pass-feedback admin-pass-feedback--error" role="alert">
              {isThai ? 'จัดการ AI allowance ไม่สำเร็จ กรุณาตรวจ migration และสิทธิ์ Admin' : 'Could not manage the AI allowance. Check the migration and Admin access.'}
            </div> : null}
            {!ownProjects.isLoading && ownProjects.data?.length === 0 ? <div className="admin-empty-users">
              {isThai ? 'ยังไม่มี Own Project' : 'NO OWN PROJECTS YET'}
            </div> : null}
            <div className="admin-ai-project-list">
              {ownProjects.data?.map((project) => {
                const enabled = project.ai_status === 'enabled'
                const exhausted = project.ai_status === 'exhausted'
                return <article className="admin-ai-project-card" key={project.project_id}>
                  <div>
                    <span>BUILD YOUR OWN · {project.current_phase}</span>
                    <h3>{project.title}</h3>
                    <p>{project.owner_display_name || project.owner_email || project.owner_id}</p>
                  </div>
                  <dl>
                    <div><dt>{isThai ? 'สถานะ' : 'STATUS'}</dt><dd>{project.ai_status.replace('_', ' ').toUpperCase()}</dd></div>
                    <div><dt>{isThai ? 'คำขอ' : 'REQUESTS'}</dt><dd>{project.used_requests}/{project.max_requests ?? '—'}</dd></div>
                    <div><dt>{isThai ? 'ค่าใช้จ่าย' : 'COST'}</dt><dd>${(project.used_cost_micros / 1_000_000).toFixed(4)} / {project.max_cost_micros === null ? '—' : `$${(project.max_cost_micros / 1_000_000).toFixed(2)}`}</dd></div>
                  </dl>
                  <button
                    type="button"
                    disabled={allowanceMutation.isPending || enabled || exhausted || project.project_status === 'archived'}
                    onClick={() => {
                      setAllowanceSuccess('')
                      allowanceMutation.reset()
                      allowanceMutation.mutate(project.project_id)
                    }}
                  >
                    <Bot aria-hidden="true" size={17} />
                    {enabled
                      ? (isThai ? 'AI TEST เปิดแล้ว' : 'AI TEST ENABLED')
                      : exhausted
                        ? (isThai ? 'ALLOWANCE หมดแล้ว' : 'ALLOWANCE EXHAUSTED')
                        : allowanceMutation.isPending
                          ? (isThai ? 'กำลังเปิด…' : 'ENABLING…')
                          : (isThai ? 'เปิด 5 REQUEST TEST' : 'ENABLE 5-REQUEST TEST')}
                  </button>
                </article>
              })}
            </div>
          </section>

          <p className="admin-generated-at">{isThai ? 'อัปเดตข้อมูลเมื่อ' : 'DATA GENERATED'} · {formatDate(overview.data.generated_at, isThai)}</p>
        </>
      ) : null}

      {grantTarget ? (
        <div className="delete-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) closeGrantDialog()
        }}>
          <section className="delete-dialog admin-grant-dialog" role="dialog" aria-modal="true" aria-labelledby="grant-pass-title">
            <button className="delete-dialog__close" type="button" aria-label={isThai ? 'ปิด' : 'Close'} onClick={closeGrantDialog}>
              <X aria-hidden="true" size={22} />
            </button>
            <TicketPlus className="admin-grant-dialog__icon" aria-hidden="true" size={36} />
            <span className="chapter-code">ACCESS CONTROL</span>
            <h2 id="grant-pass-title">GRANT 1 PROJECT PASS?</h2>
            <p>{isThai ? 'สิทธิ์นี้จะอนุญาตให้ผู้ใช้สร้าง Build Your Own Project ได้ 1 Project และระบบจะบันทึกผู้ให้สิทธิ์ไว้ใน Audit Log' : 'This lets the user create one Build Your Own Project and records the granting admin in the audit log.'}</p>
            <strong>{grantTarget.display_name || grantTarget.email || grantTarget.user_id}</strong>
            {grantTarget.display_name && grantTarget.email ? <span className="admin-grant-dialog__email">{grantTarget.email}</span> : null}
            <form onSubmit={handleGrant}>
              <label htmlFor="grant-pass-note">{isThai ? 'หมายเหตุ (ไม่บังคับ)' : 'NOTE (OPTIONAL)'}</label>
              <textarea
                id="grant-pass-note"
                maxLength={500}
                placeholder={isThai ? 'เช่น สิทธิ์สำหรับทดสอบ Phase 2' : 'For example: Phase 2 testing access'}
                value={grantNote}
                onChange={(event) => setGrantNote(event.target.value)}
              />
              {grantMutation.isError ? (
                <div className="admin-pass-feedback admin-pass-feedback--error" role="alert">
                  {isThai ? 'เพิ่ม Project Pass ไม่สำเร็จ กรุณาตรวจสอบสิทธิ์หรือลองอีกครั้ง' : 'Could not grant the Project Pass. Check access and try again.'}
                </div>
              ) : null}
              <div className="delete-dialog__actions">
                <button type="button" disabled={grantMutation.isPending} onClick={closeGrantDialog}>{isThai ? 'ยกเลิก' : 'CANCEL'}</button>
                <button className="admin-grant-dialog__confirm" type="submit" disabled={grantMutation.isPending}>
                  {grantMutation.isPending ? 'GRANTING…' : isThai ? 'ยืนยันเพิ่ม 1 PASS' : 'CONFIRM GRANT'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}
