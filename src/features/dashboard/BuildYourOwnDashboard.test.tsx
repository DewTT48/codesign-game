import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectPassRow, ProjectRow } from '../../lib/supabase/database.types'
import { LanguageProvider } from '../i18n/LanguageContext'
import { DashboardPage } from './DashboardPage'

const mocks = vi.hoisted(() => ({
  listProjects: vi.fn(),
  listMyProjectPasses: vi.fn(),
}))

vi.mock('../build-your-own/buildYourOwn.flags', () => ({
  isBuildYourOwnV2Enabled: true,
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'player@example.com' }, signOut: vi.fn() }),
}))

vi.mock('../projects/project.service', () => ({
  archiveProject: vi.fn(),
  deleteProject: vi.fn(),
  listProjects: mocks.listProjects,
  restoreProject: vi.fn(),
}))

vi.mock('../project-pass/projectPass.service', async (importOriginal) => {
  const original = await importOriginal<typeof import('../project-pass/projectPass.service')>()
  return { ...original, listMyProjectPasses: mocks.listMyProjectPasses }
})

vi.mock('../admin/admin.service', () => ({
  isCurrentUserAdmin: vi.fn().mockResolvedValue(false),
}))

const ownProject: ProjectRow = {
  id: 'own-project-1',
  owner_id: 'owner-1',
  mode: 'own',
  title: 'Learning Plan Companion',
  topic: 'Focused learning',
  content_readiness: 'idea',
  status: 'in_progress',
  current_phase: 'C',
  solidification_stage: 'IDEA',
  completed_at: null,
  created_at: '2026-09-16T00:00:00.000Z',
  updated_at: '2026-09-16T00:00:00.000Z',
}

const availablePass: ProjectPassRow = {
  id: 'pass-1',
  owner_id: 'owner-1',
  source: 'course',
  status: 'available',
  grant_key: 'course:owner:001',
  granted_by: null,
  project_id: null,
  consume_key: null,
  note: null,
  granted_at: '2026-09-16T00:00:00.000Z',
  consumed_at: null,
  revoked_at: null,
  updated_at: '2026-09-16T00:00:00.000Z',
}

describe('DashboardPage Build Your Own v2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem('codesign-language', 'th')
    mocks.listProjects.mockResolvedValue([ownProject])
    mocks.listMyProjectPasses.mockResolvedValue([availablePass])
  })

  it('shows Pass inventory and routes own Projects to the separate workspace', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'BUILD YOUR OWN' })).toBeInTheDocument()
    expect(screen.getByText('PASS พร้อมใช้')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /OPEN BUILD YOUR OWN/ })).toHaveAttribute('href', '/projects/new/own')
    expect(await screen.findByRole('link', { name: /OPEN PROJECT/ })).toHaveAttribute('href', '/own-projects/own-project-1')
  })
})
