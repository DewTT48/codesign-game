import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageContext'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('presents the guided build as the primary launch experience', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </LanguageProvider>,
    )

    expect(
      screen.getByRole('heading', { name: /turn uncertainty/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /build with guide/i }),
    ).toHaveAttribute('href', '/mission')
    expect(screen.getByText('21 DAYS OF')).toBeInTheDocument()
  })
})
