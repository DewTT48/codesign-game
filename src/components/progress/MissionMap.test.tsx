import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
