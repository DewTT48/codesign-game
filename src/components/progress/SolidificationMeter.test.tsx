import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '../../features/i18n/LanguageContext'
import { SolidificationMeter } from './SolidificationMeter'

describe('SolidificationMeter', () => {
  it('keeps every Thai stage label paired with its progress block', () => {
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
    ).toEqual(['ไอเดีย', 'เข้าใจแล้ว', 'สำรวจแล้ว', 'ตัดสินใจแล้ว', 'ชัดเจนแล้ว', 'พร้อมสร้าง'])
    expect(stages[2]).toHaveClass('is-current')
  })

  it('keeps the English labels in English mode', () => {
    window.localStorage.setItem('codesign-language', 'en')
    const { container } = render(
      <LanguageProvider>
        <SolidificationMeter current="EXPLORED" />
      </LanguageProvider>,
    )

    const stages = [...container.querySelectorAll('.solid-meter__stage')]
    expect(
      stages.map((stage) => within(stage as HTMLElement).getByText(/.+/).textContent),
    ).toEqual(['IDEA', 'UNDERSTOOD', 'EXPLORED', 'DECIDED', 'SOLID', 'BUILD READY'])
  })
})
