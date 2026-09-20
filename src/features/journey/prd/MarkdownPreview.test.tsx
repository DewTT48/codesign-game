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

  it('hides machine comments and transport-only citation tokens', () => {
    render(<MarkdownPreview markdown={'<!-- CODESIGN:UI_REVIEW:v1 -->\n\nVisible text fileciteturn3file0L10-L14'} />)

    expect(screen.getByText('Visible text')).toBeInTheDocument()
    expect(screen.queryByText(/CODESIGN:UI_REVIEW/)).not.toBeInTheDocument()
    expect(screen.queryByText(/filecite/)).not.toBeInTheDocument()
  })
})
