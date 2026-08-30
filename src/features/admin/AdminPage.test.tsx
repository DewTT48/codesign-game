import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageContext'
import { AdminPage } from './AdminPage'

const adminService = vi.hoisted(() => ({
  getAdminOverview: vi.fn(),
  getAdminUsers: vi.fn(),
}))

vi.mock('./admin.service', () => adminService)

describe('AdminPage', () => {
  it('shows operational metadata without mission content', async () => {
    adminService.getAdminOverview.mockResolvedValue({
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
    })
    adminService.getAdminUsers.mockResolvedValue([{
      user_id: 'user-1',
      email: 'player@example.com',
      display_name: 'Player One',
      joined_at: '2026-08-29T12:00:00.000Z',
      total_missions: 2,
      active_missions: 1,
      completed_missions: 1,
      archived_missions: 0,
      last_activity_at: '2026-08-30T12:00:00.000Z',
    }])

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

    expect(await screen.findByRole('heading', { name: 'ADMIN DASHBOARD' })).toBeInTheDocument()
    expect(await screen.findByText('player@example.com')).toBeInTheDocument()
    expect(screen.getByText(/ไม่แสดงคำตอบ Decisions PRD หรือ Journal/)).toBeInTheDocument()
    expect(screen.queryByText('PRIVATE MISSION ANSWER')).not.toBeInTheDocument()
  })
})
