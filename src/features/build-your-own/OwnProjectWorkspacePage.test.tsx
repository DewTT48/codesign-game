import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { LanguageProvider } from '../i18n/LanguageContext'
import { OwnProjectWorkspacePage } from './OwnProjectWorkspacePage'

const getProjectMock = vi.hoisted(() => vi.fn())

vi.mock('../journey/journey.service', () => ({ getProject: getProjectMock }))

const ownProject: ProjectRow = {
  id: 'own-project-1',
  owner_id: 'owner-1',
  mode: 'own',
  title: 'Learning Plan Companion',
  topic: 'Help people plan focused learning',
  content_readiness: 'idea',
  status: 'in_progress',
  current_phase: 'C',
  solidification_stage: 'IDEA',
  created_at: '2026-09-16T00:00:00.000Z',
  updated_at: '2026-09-16T00:00:00.000Z',
  completed_at: null,
}

function renderWorkspace() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={['/own-projects/own-project-1']}>
          <Routes>
            <Route path="/own-projects/:projectId" element={<OwnProjectWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

describe('OwnProjectWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem('codesign-language', 'th')
    getProjectMock.mockResolvedValue(ownProject)
  })

  it('keeps the own-mode preview separate from the Guided 21 Days journey', async () => {
    renderWorkspace()

    expect(await screen.findByRole('heading', { name: ownProject.title })).toBeInTheDocument()
    expect(screen.getByText(ownProject.topic)).toBeInTheDocument()
    expect(screen.queryByText(/21 DAYS OF/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /START C — CONTEXT/ })).toBeDisabled()
    expect(screen.getByText('ยังไม่มีการเรียก AI ใน Phase นี้')).toBeInTheDocument()
  })
})
