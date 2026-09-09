import { describe, expect, it } from 'vitest'
import { alignmentIsReady, normalizeAlignmentStatus } from './crossStepAlignmentModel'

describe('cross-step alignment', () => {
  it('requires an explicit relationship and owner confirmation', () => {
    expect(alignmentIsReady({ status: '', note: '', confirmed: false })).toBe(false)
    expect(alignmentIsReady({ status: 'aligned', note: '', confirmed: true })).toBe(true)
  })

  it('requires a note for clarification and blocks silent revisions', () => {
    expect(alignmentIsReady({ status: 'clarifies', note: '', confirmed: true })).toBe(false)
    expect(alignmentIsReady({ status: 'clarifies', note: 'Latest interpretation', confirmed: true })).toBe(true)
    expect(alignmentIsReady({ status: 'revision', note: 'Scope changed', confirmed: true })).toBe(false)
    expect(alignmentIsReady({ status: 'revision', note: 'Scope changed', confirmed: true, allowRevision: true })).toBe(true)
  })

  it('normalizes persisted values defensively', () => {
    expect(normalizeAlignmentStatus('aligned')).toBe('aligned')
    expect(normalizeAlignmentStatus('unexpected')).toBe('')
  })
})
