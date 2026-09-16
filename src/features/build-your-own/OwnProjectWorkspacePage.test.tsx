import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { LanguageProvider } from '../i18n/LanguageContext'
import { OwnProjectWorkspacePage } from './OwnProjectWorkspacePage'

const getProjectMock = vi.hoisted(() => vi.fn())
const getPhaseEntriesMock = vi.hoisted(() => vi.fn())

vi.mock('../journey/journey.service', () => ({
  getProject: getProjectMock,
  getPhaseEntries: getPhaseEntriesMock,
  savePhaseEntry: vi.fn(),
}))

vi.mock('./ai/codesignAi.service', () => ({
  createAiIdempotencyKey: vi.fn(() => 'own:test:request'),
  getAiUsageSummary: vi.fn().mockResolvedValue(null),
  getPendingAiProposal: vi.fn().mockResolvedValue(null),
  invokeCodesignAi: vi.fn(),
  reviewAiProposal: vi.fn(),
  CodesignAiError: class CodesignAiError extends Error {},
}))

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

function renderWorkspace(path = '/own-projects/own-project-1') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/own-projects/:projectId/:phase?" element={<OwnProjectWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

describe('OwnProjectWorkspacePage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem('codesign-language', 'th')
    getProjectMock.mockResolvedValue(ownProject)
    getPhaseEntriesMock.mockResolvedValue([])
  })

  it('opens the active C page with the full Own Journey content', async () => {
    renderWorkspace()

    expect(await screen.findByRole('heading', { name: 'เข้าใจสถานการณ์ก่อนรีบออกแบบคำตอบ' })).toBeInTheDocument()
    expect(screen.getByLabelText(/สถานการณ์หรือปัญหาหลัก/)).toBeInTheDocument()
    expect(screen.getByLabelText(/ผู้ใช้และผู้ได้รับผลกระทบ/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ให้ AI ช่วยตีกรอบ Context' })).toBeInTheDocument()
    expect(screen.queryByText(/21 DAYS OF/)).not.toBeInTheDocument()
  })

  it('does not allow a future phase to bypass the active phase', async () => {
    renderWorkspace('/own-projects/own-project-1/S')

    expect(await screen.findByRole('heading', { name: 'เข้าใจสถานการณ์ก่อนรีบออกแบบคำตอบ' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'แปลงทิศทางให้เป็นข้อกำหนดที่สร้างและทดสอบได้' })).not.toBeInTheDocument()
  })

  it('opens the Own implementation page after PRD without Guided 21-day content', async () => {
    getProjectMock.mockResolvedValue({
      ...ownProject,
      current_phase: 'I',
      solidification_stage: 'BUILD_READY',
    })
    renderWorkspace('/own-projects/own-project-1/I')

    expect(await screen.findByRole('heading', { name: 'เปลี่ยน PRD ที่ Lock แล้วให้เป็น Product ที่ใช้งานได้จริง' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Public URL ของ Build/)).toBeInTheDocument()
    expect(screen.queryByText(/21 DAYS OF/)).not.toBeInTheDocument()
    expect(screen.queryByText(/CODESIGN AI · PROPOSAL ONLY/)).not.toBeInTheDocument()
    expect(screen.getByText(/Step นี้ไม่ให้ AI สร้างหลักฐาน/)).toBeInTheDocument()
  })

  it('shows a completed Own Project summary and keeps all steps reviewable', async () => {
    getProjectMock.mockResolvedValue({
      ...ownProject,
      status: 'completed',
      current_phase: 'COMPLETE',
      solidification_stage: 'BUILD_READY',
      completed_at: '2026-09-16T03:00:00.000Z',
    })
    renderWorkspace()

    expect(await screen.findByRole('heading', { name: 'Build รอบแรกพร้อมสำหรับการพัฒนาต่อ' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /PRODUCT REQUIREMENTS/ })).toHaveAttribute('href', '/own-projects/own-project-1/PRD')
    expect(screen.getByRole('link', { name: /NEXT ITERATION/ })).toHaveAttribute('href', '/own-projects/own-project-1/N')
  })
})
