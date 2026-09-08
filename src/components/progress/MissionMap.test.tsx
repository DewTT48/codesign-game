import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../features/i18n/LanguageContext'
import { MissionMap } from './MissionMap'

describe('MissionMap', () => {
  it('shows PRD as the completed Specify handoff instead of locking every mission', () => {
    const { container } = render(
      <LanguageProvider>
        <MissionMap activeMission="PRD" compact />
      </LanguageProvider>,
    )

    const nodes = [...container.querySelectorAll('.mission-node')]
    expect(nodes).toHaveLength(8)
    expect(nodes.slice(0, 5).every((node) => !node.classList.contains('is-locked'))).toBe(true)
    expect(nodes.slice(0, 4).every((node) => node.classList.contains('is-complete'))).toBe(true)
    expect(nodes[4]).toHaveClass('is-active')
    expect(nodes[4]).not.toHaveClass('is-complete')
    expect(nodes.slice(5).every((node) => node.classList.contains('is-locked'))).toBe(true)
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

    expect(container.querySelectorAll('a.mission-node__content')).toHaveLength(8)
    expect([...container.querySelectorAll('.mission-node')].every((node) => node.classList.contains('is-complete'))).toBe(true)
  })
})
