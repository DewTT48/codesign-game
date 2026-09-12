import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../features/i18n/LanguageContext'
import { MissionMap } from './MissionMap'

describe('MissionMap', () => {
  it('shows PRD as its own active step after Specify', () => {
    const { container } = render(
      <LanguageProvider>
        <MissionMap activeMission="PRD" compact />
      </LanguageProvider>,
    )

    const nodes = [...container.querySelectorAll('.mission-node')]
    expect(nodes).toHaveLength(9)
    expect(nodes.slice(0, 6).every((node) => !node.classList.contains('is-locked'))).toBe(true)
    expect(nodes.slice(0, 5).every((node) => node.classList.contains('is-complete'))).toBe(true)
    expect(nodes[5]).toHaveClass('is-active')
    expect(nodes[5]).not.toHaveClass('is-complete')
    expect(nodes.slice(6).every((node) => node.classList.contains('is-locked'))).toBe(true)
    expect(screen.getByText('เลือกสิ่งที่จะปรับ')).toBeInTheDocument()
  })

  it('links only completed missions to their read-only history', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <MissionMap activeMission="E" projectId="project-123" compact />
        </LanguageProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /ดูย้อนหลัง บริบท/i })).toHaveAttribute('href', '/projects/project-123/C')
    expect(screen.getByRole('link', { name: /ดูย้อนหลัง ทางเลือก/i })).toHaveAttribute('href', '/projects/project-123/O')
    expect(screen.getByRole('link', { name: /ดูย้อนหลัง ท้าทาย/i })).toHaveAttribute('href', '/projects/project-123/D')
    expect(screen.queryByRole('link', { name: /ขอบเขต/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /รายละเอียด/i })).not.toBeInTheDocument()
  })

  it('makes the whole mission map reviewable after completion', () => {
    const { container } = render(
      <MemoryRouter>
        <LanguageProvider>
          <MissionMap activeMission="COMPLETE" projectId="project-123" compact />
        </LanguageProvider>
      </MemoryRouter>,
    )

    expect(container.querySelectorAll('a.mission-node__content')).toHaveLength(9)
    expect([...container.querySelectorAll('.mission-node')].every((node) => node.classList.contains('is-complete'))).toBe(true)
  })

  it('returns to the actual current step when the map is used from history', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <MissionMap activeMission="PRD" viewedMission="E" projectId="project-123" compact />
        </LanguageProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /กลับไป Step ปัจจุบัน ชุดส่งต่องาน/i })).toHaveAttribute('href', '/projects/project-123/PRD')
  })

  it('does not turn the current PRD map position into a history link', () => {
    const { container } = render(
      <MemoryRouter>
        <LanguageProvider>
          <MissionMap activeMission="PRD" viewedMission="PRD" projectId="project-123" compact />
        </LanguageProvider>
      </MemoryRouter>,
    )

    expect(container.querySelector('.mission-node.is-active a')).not.toBeInTheDocument()
  })
})
