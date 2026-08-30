import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminRoute } from './AdminRoute'

const adminMock = vi.hoisted(() => vi.fn())

vi.mock('./admin.service', () => ({ isCurrentUserAdmin: adminMock }))

function renderRoute() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/dashboard" element={<h1>PLAYER DASHBOARD</h1>} />
          <Route path="/admin" element={<AdminRoute><h1>ADMIN CONTROL</h1></AdminRoute>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminRoute', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows a configured admin', async () => {
    adminMock.mockResolvedValue(true)
    renderRoute()
    expect(await screen.findByRole('heading', { name: 'ADMIN CONTROL' })).toBeInTheDocument()
  })

  it('redirects a regular user to the player dashboard', async () => {
    adminMock.mockResolvedValue(false)
    renderRoute()
    expect(await screen.findByRole('heading', { name: 'PLAYER DASHBOARD' })).toBeInTheDocument()
  })
})
