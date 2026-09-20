import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PhaseCompletionGuide } from './PhaseCompletionGuide'

describe('PhaseCompletionGuide', () => {
  it('shows remaining work and the live completion count', () => {
    render(<PhaseCompletionGuide isThai items={[
      { label: 'ทำรายการแรก', complete: true },
      { label: 'ทำรายการที่สอง', complete: false },
    ]} />)

    expect(screen.getByText('ยังต้องทำให้ครบ 1 รายการ')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.getByText('ทำรายการที่สอง').closest('li')).toHaveClass('is-incomplete')
  })

  it('clearly reports when the step is ready', () => {
    render(<PhaseCompletionGuide isThai={false} items={[{ label: 'Done', complete: true }]} />)
    expect(screen.getByText('All required work is complete')).toBeInTheDocument()
  })
})
