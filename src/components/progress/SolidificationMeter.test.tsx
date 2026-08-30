import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '../../features/i18n/LanguageContext'
import { SolidificationMeter } from './SolidificationMeter'

describe('SolidificationMeter', () => {
  it('keeps every stage label paired with its progress block', () => {
    const { container } = render(
      <LanguageProvider>
        <SolidificationMeter current="EXPLORED" />
      </LanguageProvider>,
    )

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')

    const stages = [...container.querySelectorAll('.solid-meter__stage')]
    expect(stages).toHaveLength(6)
    expect(
      stages.map((stage) => within(stage as HTMLElement).getByText(/.+/).textContent),
    ).toEqual(['IDEA', 'UNDERSTOOD', 'EXPLORED', 'DECIDED', 'SOLID', 'BUILD READY'])
    expect(stages[2]).toHaveClass('is-current')
  })
})
