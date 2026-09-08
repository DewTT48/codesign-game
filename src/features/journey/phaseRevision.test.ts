import { describe, expect, it } from 'vitest'
import {
  affectedRevisionPhases,
  canStartPhaseRevision,
  isActivePhaseRevision,
  solidificationBeforePhase,
} from './phaseRevision'

describe('phaseRevision', () => {
  it('allows a completed C–E phase to start a revision', () => {
    expect(canStartPhaseRevision('C', 'O')).toBe(true)
    expect(canStartPhaseRevision('E', 'PRD')).toBe(true)
    expect(canStartPhaseRevision('E', 'E')).toBe(false)
    expect(canStartPhaseRevision('S', 'PRD')).toBe(false)
  })

  it('includes every phase that must be reviewed again', () => {
    expect(affectedRevisionPhases('E', 'PRD')).toEqual(['E', 'S', 'PRD'])
    expect(affectedRevisionPhases('C', 'COMPLETE')).toEqual(['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N'])
  })

  it('restores the solidification stage immediately before the revised phase', () => {
    expect(solidificationBeforePhase('C')).toBe('IDEA')
    expect(solidificationBeforePhase('D')).toBe('UNDERSTOOD')
    expect(solidificationBeforePhase('E')).toBe('EXPLORED')
  })

  it('keeps a revision active until the former current phase is completed again', () => {
    const revision = {
      id: 'revision-1',
      version: 2,
      targetPhase: 'E' as const,
      sourceCurrentPhase: 'PRD' as const,
      affectedPhases: ['E', 'S', 'PRD'] as const,
      reason: 'Adjust scope',
      createdAt: '2026-09-08T00:00:00Z',
    }
    expect(isActivePhaseRevision(revision, 'E')).toBe(true)
    expect(isActivePhaseRevision(revision, 'PRD')).toBe(true)
    expect(isActivePhaseRevision(revision, 'I')).toBe(false)
    expect(isActivePhaseRevision(revision, 'COMPLETE')).toBe(false)
  })
})
