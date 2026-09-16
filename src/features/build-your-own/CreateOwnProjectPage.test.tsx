import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectPassRow, ProjectRow } from '../../lib/supabase/database.types'
import { LanguageProvider } from '../i18n/LanguageContext'
import { CreateOwnProjectPage } from './CreateOwnProjectPage'

const serviceMocks = vi.hoisted(() => ({
  createOwnProject: vi.fn(),
  listMyProjectPasses: vi.fn(),
}))

vi.mock('./buildYourOwn.service', () => ({
  createOwnProject: serviceMocks.createOwnProject,
}))

vi.mock('../project-pass/projectPass.service', async (importOriginal) => {
  const original = await importOriginal<typeof import('../project-pass/projectPass.service')>()
  return {
    ...original,
    listMyProjectPasses: serviceMocks.listMyProjectPasses,
  }
})

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

const ownProject: ProjectRow = {
  id: 'own-project-1',
  owner_id: 'owner-1',
  mode: 'own',
  title: 'ระบบช่วยวางแผนการเรียนรู้',
  topic: 'ช่วยให้คนวางแผนการเรียนรู้',
  content_readiness: 'idea',
  status: 'in_progress',
  current_phase: 'C',
  solidification_stage: 'IDEA',
  created_at: '2026-09-16T00:00:00.000Z',
  updated_at: '2026-09-16T00:00:00.000Z',
  completed_at: null,
}

function renderCreatePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={['/projects/new/own']}>
          <Routes>
            <Route path="/projects/new/own" element={<CreateOwnProjectPage />} />
            <Route path="/own-projects/:projectId" element={<h1>OWN PROJECT READY</h1>} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

describe('CreateOwnProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem('codesign-language', 'th')
    serviceMocks.listMyProjectPasses.mockResolvedValue([availablePass])
    serviceMocks.createOwnProject.mockResolvedValue(ownProject)
  })

  it('does not consume a Pass until the user confirms creation', async () => {
    renderCreatePage()

    expect(await screen.findByRole('heading', { name: '1 PROJECT PASS AVAILABLE' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^ชื่อ Project/), {
      target: { value: ownProject.title },
    })
    fireEvent.change(screen.getByLabelText(/^หัวข้อหรือปัญหาที่อยากสำรวจ/), {
      target: { value: ownProject.topic },
    })
    fireEvent.click(screen.getByRole('button', { name: /REVIEW & CONFIRM/ }))

    expect(serviceMocks.createOwnProject).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'USE 1 PROJECT PASS?' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'CONFIRM & CREATE' }))

    await waitFor(() => expect(serviceMocks.createOwnProject).toHaveBeenCalledOnce())
    expect(serviceMocks.createOwnProject.mock.calls[0]?.[0]).toEqual({
      title: ownProject.title,
      topic: ownProject.topic,
      creationKey: expect.stringMatching(/^own:/),
    })
    expect(await screen.findByRole('heading', { name: 'OWN PROJECT READY' })).toBeInTheDocument()
  })

  it('shows the no-Pass state and keeps confirmation unavailable', async () => {
    serviceMocks.listMyProjectPasses.mockResolvedValue([])
    renderCreatePage()

    expect(await screen.findByText('ยังไม่มี Project Pass ที่พร้อมใช้')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /REVIEW & CONFIRM/ })).toBeDisabled()
    expect(serviceMocks.createOwnProject).not.toHaveBeenCalled()
  })
})
