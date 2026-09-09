import { describe, expect, it } from 'vitest'
import {
  affectedRevisionPhases,
  canStartPhaseRevision,
  contentForRevision,
  isActivePhaseRevision,
  solidificationBeforePhase,
} from './phaseRevision'

describe('phaseRevision', () => {
  it('allows a completed definition phase through PRD to start a revision', () => {
    expect(canStartPhaseRevision('C', 'O')).toBe(true)
    expect(canStartPhaseRevision('E', 'PRD')).toBe(true)
    expect(canStartPhaseRevision('E', 'E')).toBe(false)
    expect(canStartPhaseRevision('S', 'PRD')).toBe(true)
    expect(canStartPhaseRevision('PRD', 'I')).toBe(true)
    expect(canStartPhaseRevision('I', 'G')).toBe(false)
  })

  it('preserves content while clearing confirmations that must be reviewed again', () => {
    expect(contentForRevision('S', 'dailyContent', [{ day: 1, title: 'Day one' }])).toEqual([{ day: 1, title: 'Day one' }])
    expect(contentForRevision('S', 'contentOwnerConfirmed', true)).toBe(false)
    expect(contentForRevision('O', 'alignmentConfirmed', true)).toBe(false)
    expect(contentForRevision('D', 'alignmentStatus', 'aligned')).toBe('')
    expect(contentForRevision('E', 'alignmentConfirmed', true)).toBe(false)
    expect(contentForRevision('S', 'alignmentConfirmed', true)).toBe(false)
    expect(contentForRevision('S', 'alignmentStatus', 'clarifies')).toBe('')
    expect(contentForRevision('PRD', 'confirmedFilesV2', ['handoff', 'contentPack'])).toEqual([])
    expect(contentForRevision('PRD', 'reviewOutcomeV2', 'ready')).toBe('')
    expect(contentForRevision('I', 'workingApp', true)).toBe(false)
    expect(contentForRevision('I', 'alignmentNote', 'Matches PRD')).toBe('')
    expect(contentForRevision('G', 'mobile', true)).toBe(false)
    expect(contentForRevision('G', 'alignmentConfirmed', true)).toBe(false)
    expect(contentForRevision('N', 'changeRoute', 'implementation')).toBe('')
    expect(contentForRevision('N', 'routeConfirmed', true)).toBe(false)
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
