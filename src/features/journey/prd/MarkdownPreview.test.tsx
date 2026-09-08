import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownPreview } from './MarkdownPreview'

describe('MarkdownPreview', () => {
  it('renders the handoff structure as readable content', () => {
    const { container } = render(<MarkdownPreview markdown={'# Handoff\n\n- **Rule:** Keep it local\n- `allow-edit`'} />)

    expect(screen.getByRole('heading', { name: 'Handoff' })).toBeInTheDocument()
    expect(screen.getByText('Rule:')).toBeInTheDocument()
    expect(screen.getByText('allow-edit')).toBeInTheDocument()
    expect(container.querySelectorAll('li')).toHaveLength(2)
  })
})
