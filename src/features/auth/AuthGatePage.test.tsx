import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageContext'
import { AuthGatePage } from './AuthGatePage'

const auth = vi.hoisted(() => ({
  configured: true,
  loading: false,
  user: null as { id: string } | null,
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
}))

vi.mock('./AuthContext', () => ({
  useAuth: () => auth,
}))

function renderAuth(initialEntry = '/auth?intent=signin') {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/auth" element={<AuthGatePage />} />
          <Route path="/dashboard" element={<h1>PLAYER DASHBOARD</h1>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

describe('AuthGatePage', () => {
  beforeEach(() => {
    auth.configured = true
    auth.loading = false
    auth.user = null
    auth.signInWithEmail.mockReset()
    auth.signInWithGoogle.mockReset()
  })

  it('presents returning users with a direct sign-in route from home', () => {
    renderAuth()

    expect(screen.getByRole('heading', { name: /เข้าสู่ระบบ codesign|sign in to codesign/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /หน้าแรก|home/i })).toHaveAttribute('href', '/')
  })

  it('sends an existing session straight to the dashboard', () => {
    auth.user = { id: 'returning-user' }
    renderAuth()

    expect(screen.getByRole('heading', { name: /player dashboard/i })).toBeInTheDocument()
  })
})
