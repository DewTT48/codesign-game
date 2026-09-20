import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { webcrypto } from 'node:crypto'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../i18n/LanguageContext'
import { createApprovedPrototypeArtifact } from './approvedPrototype'
import { UiReviewWorkspace } from './UiReviewWorkspace'

beforeAll(() => {
  if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
})

afterEach(() => cleanup())

async function approvedFixture() {
  const html = '<!doctype html><script>globalThis.__prototypeExecuted = true</script><main>Approved</main>'
  const bytes = new TextEncoder().encode(html)
  const prototype = await createApprovedPrototypeArtifact({
    name: 'prototype-v16.html',
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as File)
  const review = `# CODESIGN UI REVIEW
<!-- CODESIGN:UI_REVIEW:v1 -->

## Review Status
APPROVED FOR FINAL PRD

## Prototype Reviewed
Desktop and mobile v16

## Prototype Integrity
- **Approved prototype file:** \`prototype-v16.html\`
- **SHA-256:** \`${prototype.sha256}\`

## Confirmed Screen Map
- Home — start the journey

## Navigation and Flow
Home to detail and back

## Visual and Interaction Direction
Calm cards with one primary action

## Responsive and Accessibility
Single column on mobile, visible focus, AA contrast

## Accepted UX Changes
NONE

## PRD Impact Map
NO PRD CHANGE

## Protected Decisions
- Approved content remains unchanged

## Open Questions
NONE

## Owner Approval
I APPROVE THIS UI DIRECTION`

  return { html, prototype, review }
}

describe('UiReviewWorkspace Approved Prototype import', () => {
  it('enables Apply only for a matching Review/artifact pair and never executes uploaded HTML', async () => {
    const { prototype, review } = await approvedFixture()
    const onApply = vi.fn().mockResolvedValue(undefined)
    delete (globalThis as typeof globalThis & { __prototypeExecuted?: boolean }).__prototypeExecuted

    const view = render(
      <LanguageProvider>
        <UiReviewWorkspace
          mode="guided"
          uiBrief="# Brief"
          storedReview={review}
          storedPrototype={prototype}
          applied={false}
          onApply={onApply}
        />
      </LanguageProvider>,
    )

    const applyButton = view.getByRole('button', { name: /UI Review|Final PRD/i })
    expect(applyButton).toBeEnabled()
    expect((globalThis as typeof globalThis & { __prototypeExecuted?: boolean }).__prototypeExecuted).toBeUndefined()

    fireEvent.click(applyButton)
    await waitFor(() => expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
      review,
      prototype,
    })))
    expect((globalThis as typeof globalThis & { __prototypeExecuted?: boolean }).__prototypeExecuted).toBeUndefined()
  })

  it('blocks Apply when the Review digest does not match the stored bytes', async () => {
    const { prototype, review } = await approvedFixture()

    const view = render(
      <LanguageProvider>
        <UiReviewWorkspace
          mode="guided"
          uiBrief="# Brief"
          storedReview={review.replace(prototype.sha256, '0'.repeat(64))}
          storedPrototype={prototype}
          applied={false}
          onApply={vi.fn()}
        />
      </LanguageProvider>,
    )

    expect(view.getByText('SHA-256 ของ HTML ไม่ตรงกับค่าที่ระบุใน UI Review')).toBeInTheDocument()
    expect(view.getByRole('button', { name: /UI Review|Final PRD/i })).toBeDisabled()
  })
})
