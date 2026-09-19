import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageContext'
import { AdminPage } from './AdminPage'

const adminService = vi.hoisted(() => ({
  createAdminGrantKey: vi.fn(() => 'admin:user-1:test-grant-001'),
  enableAdminAiTestAllowance: vi.fn(),
  getAdminOverview: vi.fn(),
  getAdminOwnProjects: vi.fn(),
  getAdminProjectRecord: vi.fn(),
  getAdminProjects: vi.fn(),
  getAdminProjectPasses: vi.fn(),
  getAdminUsers: vi.fn(),
  grantAdminProjectPass: vi.fn(),
}))

vi.mock('./admin.service', () => adminService)

describe('AdminPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const overview = {
    total_users: 7,
    total_missions: 12,
    active_missions: 8,
    completed_missions: 3,
    archived_missions: 1,
    users_7d: 2,
    users_30d: 5,
    missions_7d: 4,
    missions_30d: 10,
    phase_counts: [{ phase: 'C', count: 8 }],
    generated_at: '2026-08-30T12:00:00.000Z',
  }
  const player = {
    user_id: 'user-1',
    email: 'player@example.com',
    display_name: 'Player One',
    joined_at: '2026-08-29T12:00:00.000Z',
    total_missions: 2,
    active_missions: 1,
    completed_missions: 1,
    archived_missions: 0,
    last_activity_at: '2026-08-30T12:00:00.000Z',
  }
  const ownProject = {
    project_id: 'project-1',
    owner_id: player.user_id,
    owner_email: player.email,
    owner_display_name: player.display_name,
    title: 'Learning Plan Companion',
    project_status: 'in_progress',
    current_phase: 'C',
    ai_status: 'not_configured',
    used_requests: 0,
    max_requests: null,
    used_cost_micros: 0,
    max_cost_micros: null,
    updated_at: '2026-09-16T06:00:00.000Z',
  }
  const adminProject = {
    ...ownProject,
    mode: 'own',
    topic: 'Manager development',
    content_readiness: 'idea',
    solidification_stage: 'IDEA',
    phase_entry_count: 1,
    locked_phase_count: 0,
    decision_count: 0,
    created_at: '2026-09-16T05:00:00.000Z',
    completed_at: null,
    latest_activity_at: ownProject.updated_at,
  }

  function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <AdminPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>,
    )
  }

  it('shows the project directory and account operations', async () => {
    adminService.getAdminOverview.mockResolvedValue(overview)
    adminService.getAdminUsers.mockResolvedValue([player])
    adminService.getAdminProjectPasses.mockResolvedValue([])
    adminService.getAdminOwnProjects.mockResolvedValue([])
    adminService.getAdminProjects.mockResolvedValue([adminProject])

    renderPage()

    expect(await screen.findByRole('heading', { name: 'ADMIN DASHBOARD' })).toBeInTheDocument()
    expect(await screen.findByText('player@example.com')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project ทั้งหมดและรายละเอียด C–N' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: `เปิด Project Record: ${adminProject.title}` })).toBeInTheDocument()
    expect(screen.getByText('ADMIN CONTROLS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'เพิ่ม 1 Project Pass ให้ player@example.com' })).toBeInTheDocument()
  })

  it('lets an admin confirm and grant one Project Pass to a user', async () => {
    adminService.getAdminOverview.mockResolvedValue(overview)
    adminService.getAdminUsers.mockResolvedValue([player])
    adminService.getAdminProjectPasses.mockResolvedValue([])
    adminService.getAdminOwnProjects.mockResolvedValue([])
    adminService.getAdminProjects.mockResolvedValue([])
    adminService.grantAdminProjectPass.mockResolvedValue({
      id: 'pass-1',
      owner_id: player.user_id,
      source: 'admin',
      status: 'available',
      grant_key: 'admin:user-1:test-grant-001',
      granted_by: 'admin-1',
      project_id: null,
      consume_key: null,
      note: 'Phase 2 testing access',
      granted_at: '2026-09-16T06:00:00.000Z',
      consumed_at: null,
      revoked_at: null,
      updated_at: '2026-09-16T06:00:00.000Z',
    })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'เพิ่ม 1 Project Pass ให้ player@example.com' }))
    expect(screen.getByRole('dialog', { name: 'GRANT 1 PROJECT PASS?' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('หมายเหตุ (ไม่บังคับ)'), {
      target: { value: 'Phase 2 testing access' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันเพิ่ม 1 PASS' }))

    await waitFor(() => expect(adminService.grantAdminProjectPass).toHaveBeenCalledWith({
      userId: player.user_id,
      grantKey: 'admin:user-1:test-grant-001',
      note: 'Phase 2 testing access',
    }))
    expect(await screen.findByText(/เพิ่ม Project Pass สำเร็จ/)).toBeInTheDocument()
  })

  it('lets an admin enable the bounded AI test allowance for an Own Project', async () => {
    adminService.getAdminOverview.mockResolvedValue(overview)
    adminService.getAdminUsers.mockResolvedValue([player])
    adminService.getAdminProjectPasses.mockResolvedValue([])
    adminService.getAdminOwnProjects.mockResolvedValue([ownProject])
    adminService.getAdminProjects.mockResolvedValue([adminProject])
    adminService.enableAdminAiTestAllowance.mockResolvedValue({
      project_id: ownProject.project_id,
      status: 'enabled',
    })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'เปิด 5 REQUEST TEST' }))
    await waitFor(() => expect(adminService.enableAdminAiTestAllowance).toHaveBeenCalledWith(ownProject.project_id))
    expect(await screen.findByText(/เปิด Internal AI allowance แล้ว/)).toBeInTheDocument()
  })

  it('opens a complete read-only Project Record', async () => {
    adminService.getAdminOverview.mockResolvedValue(overview)
    adminService.getAdminUsers.mockResolvedValue([player])
    adminService.getAdminProjectPasses.mockResolvedValue([])
    adminService.getAdminOwnProjects.mockResolvedValue([])
    adminService.getAdminProjects.mockResolvedValue([adminProject])
    adminService.getAdminProjectRecord.mockResolvedValue({
      project: {
        id: adminProject.project_id,
        owner_id: player.user_id,
        mode: 'own',
        title: adminProject.title,
        topic: adminProject.topic,
        content_readiness: 'idea',
        status: 'in_progress',
        current_phase: 'C',
        solidification_stage: 'IDEA',
        created_at: adminProject.created_at,
        updated_at: adminProject.updated_at,
        completed_at: null,
      },
      owner: {
        id: player.user_id,
        email: player.email,
        display_name: player.display_name,
        created_at: player.joined_at,
      },
      phase_entries: [{
        id: 'entry-1',
        project_id: adminProject.project_id,
        phase: 'C',
        section: 'problem',
        field_key: 'problemStatement',
        content: 'Managers need a clearer way to consolidate evidence.',
        status: 'captured',
        version: 1,
        is_current: true,
        created_at: adminProject.created_at,
        updated_at: adminProject.updated_at,
      }],
      decisions: [],
      prd_snapshots: [],
      app_builds: [],
      feedback_entries: [],
      ai_budget: null,
      ai_requests: [],
      ai_proposals: [],
      accessed_at: adminProject.updated_at,
    })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: `เปิด Project Record: ${adminProject.title}` }))
    expect(await screen.findByRole('dialog', { name: adminProject.title })).toBeInTheDocument()
    expect(await screen.findByText('Managers need a clearer way to consolidate evidence.')).toBeInTheDocument()
    expect(screen.getByText(/การเปิด Project ถูกบันทึกใน Admin access log/)).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: adminProject.title })).not.toBeInTheDocument()
  })
})
