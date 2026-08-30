import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { LanguageProvider } from '../i18n/LanguageContext'
import { DashboardPage } from './DashboardPage'

const serviceMocks = vi.hoisted(() => ({
  archiveProject: vi.fn(),
  deleteProject: vi.fn(),
  listProjects: vi.fn(),
  restoreProject: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'player@example.com' }, signOut: vi.fn() }),
}))

vi.mock('../projects/project.service', () => serviceMocks)

const baseProject: ProjectRow = {
  id: 'active-project',
  owner_id: 'owner-1',
  title: '21 DAYS OF BETTER ONBOARDING',
  topic: 'better onboarding',
  content_readiness: 'idea',
  mode: 'guided',
  status: 'in_progress',
  current_phase: 'C',
  solidification_stage: 'IDEA',
  completed_at: null,
  created_at: '2026-08-30T00:00:00.000Z',
  updated_at: '2026-08-30T00:00:00.000Z',
}

const archivedProject: ProjectRow = {
  ...baseProject,
  id: 'archived-project',
  title: '21 DAYS OF TEAM FEEDBACK',
  topic: 'team feedback',
  status: 'archived',
  current_phase: 'D',
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

describe('DashboardPage mission management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serviceMocks.listProjects.mockResolvedValue([baseProject, archivedProject])
    serviceMocks.archiveProject.mockResolvedValue({ ...baseProject, status: 'archived' })
    serviceMocks.restoreProject.mockResolvedValue({ ...archivedProject, status: 'in_progress' })
    serviceMocks.deleteProject.mockResolvedValue(undefined)
  })

  it('archives an active mission without deleting it', async () => {
    renderDashboard()

    fireEvent.click(await screen.findByRole('button', { name: 'เก็บเข้าคลัง' }))

    await waitFor(() => expect(serviceMocks.archiveProject).toHaveBeenCalled())
    expect(serviceMocks.archiveProject.mock.calls[0]?.[0]).toBe('active-project')
    expect(serviceMocks.deleteProject).not.toHaveBeenCalled()
  })

  it('requires an explicit confirmation before permanent deletion', async () => {
    renderDashboard()

    fireEvent.click(await screen.findByRole('button', { name: 'ลบถาวร' }))
    const confirmButton = screen.getByRole('button', { name: 'ลบ Mission ถาวร' })
    expect(confirmButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('พิมพ์ DELETE เพื่อยืนยัน'), { target: { value: 'DELETE' } })
    fireEvent.click(confirmButton)

    await waitFor(() => expect(serviceMocks.deleteProject).toHaveBeenCalled())
    expect(serviceMocks.deleteProject.mock.calls[0]?.[0]).toBe('archived-project')
  })
})
