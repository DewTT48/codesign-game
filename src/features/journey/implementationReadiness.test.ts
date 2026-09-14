import { describe, expect, it } from 'vitest'
import { getImplementationReadiness } from './implementationReadiness'

const completeInput = {
  workingApp: true,
  appUrl: 'https://example.com/app',
  alignmentStatus: 'aligned' as const,
  alignmentNote: '',
  alignmentConfirmed: true,
}

describe('getImplementationReadiness', () => {
  it('allows completion from the visible build and alignment confirmations alone', () => {
    expect(getImplementationReadiness(completeInput).ready).toBe(true)
  })

  it.each([
    ['workingApp', { workingApp: false }],
    ['appUrl', { appUrl: '   ' }],
    ['alignmentStatus', { alignmentStatus: '' as const }],
    ['alignmentConfirmed', { alignmentConfirmed: false }],
  ])('reports an incomplete %s requirement', (key, change) => {
    const result = getImplementationReadiness({ ...completeInput, ...change })
    expect(result.ready).toBe(false)
    expect(result.requirements[key as keyof typeof result.requirements]).toBe(false)
  })

  it('requires an explanation when the handoff clarifies the PRD', () => {
    const missing = getImplementationReadiness({
      ...completeInput,
      alignmentStatus: 'clarifies',
      alignmentNote: '',
    })
    const complete = getImplementationReadiness({
      ...completeInput,
      alignmentStatus: 'clarifies',
      alignmentNote: 'รายละเอียดล่าสุด',
    })

    expect(missing.requirements.alignmentNote).toBe(false)
    expect(missing.ready).toBe(false)
    expect(complete.ready).toBe(true)
  })

  it('routes a changed product decision back to revision', () => {
    const result = getImplementationReadiness({
      ...completeInput,
      alignmentStatus: 'revision',
      alignmentNote: 'ต้องเปลี่ยนขอบเขต',
    })

    expect(result.requirements.alignmentStatus).toBe(false)
    expect(result.ready).toBe(false)
  })
})
