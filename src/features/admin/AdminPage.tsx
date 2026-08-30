import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Archive,
  ArrowLeft,
  CheckCircle2,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { getAdminOverview, getAdminUsers } from './admin.service'

const phaseNames: Record<string, string> = {
  C: 'CONTEXT',
  O: 'OPTIONS',
  D: 'DEBATE',
  E: 'ESTABLISH',
  S: 'SPECIFY',
  PRD: 'PRD',
  I: 'IMPLEMENT',
  G: 'FEEDBACK',
  N: 'NEXT',
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
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview })
  const users = useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: () => getAdminUsers(searchQuery),
  })

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  const refreshing = overview.isFetching || users.isFetching
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
          <span className="admin-readonly-badge"><ShieldCheck aria-hidden="true" size={18} /> READ ONLY</span>
          <button type="button" disabled={refreshing} onClick={() => {
            void overview.refetch()
            void users.refetch()
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
              <span>{isThai ? 'แสดงเฉพาะข้อมูลบัญชีและจำนวน Mission ไม่แสดงคำตอบ Decisions PRD หรือ Journal' : 'Shows account metadata and mission counts only—never answers, decisions, PRDs, or journals.'}</span>
            </div>

            {users.data?.length === 0 ? (
              <div className="admin-empty-users">{isThai ? 'ไม่พบบัญชีที่ค้นหา' : 'NO MATCHING ACCOUNTS'}</div>
            ) : null}

            <div className="admin-user-list">
              {users.data?.map((user) => (
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
                </article>
              ))}
            </div>
          </section>

          <p className="admin-generated-at">{isThai ? 'อัปเดตข้อมูลเมื่อ' : 'DATA GENERATED'} · {formatDate(overview.data.generated_at, isThai)}</p>
        </>
      ) : null}
    </div>
  )
}
