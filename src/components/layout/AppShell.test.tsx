import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../features/i18n/LanguageContext'
import { AppShell } from './AppShell'

const authState = vi.hoisted(() => ({ user: null as { id: string } | null }))

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => authState,
}))

describe('AppShell account action', () => {
  beforeEach(() => {
    authState.user = null
    window.localStorage.clear()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  })

  function renderShell() {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <AppShell>Content</AppShell>
        </MemoryRouter>
      </LanguageProvider>,
    )
  }

  it('offers sign in from the topbar to signed-out visitors', () => {
    renderShell()

    expect(screen.getByRole('link', { name: 'เข้าสู่ระบบ' })).toHaveAttribute(
      'href',
      '/auth?intent=signin',
    )
  })

  it('opens the dashboard from the topbar for a returning user', () => {
    authState.user = { id: 'user-1' }
    renderShell()

    expect(screen.getByRole('link', { name: 'ไปที่ Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })
})
