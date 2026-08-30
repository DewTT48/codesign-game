import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ScrollToTop } from './ScrollToTop'

function RouteChangeHarness() {
  const navigate = useNavigate()
  return (
    <>
      <ScrollToTop />
      <button type="button" onClick={() => navigate('/next')}>NEXT</button>
    </>
  )
}

describe('ScrollToTop', () => {
  it('moves to the top after navigation', () => {
    const scrollTo = vi.fn()
    Object.defineProperty(window, 'scrollTo', { value: scrollTo, writable: true })

    render(
      <MemoryRouter initialEntries={['/start']}>
        <RouteChangeHarness />
      </MemoryRouter>,
    )

    scrollTo.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'NEXT' }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })
})
