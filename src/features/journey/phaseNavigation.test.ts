import { describe, expect, it } from 'vitest'
import { currentPhasePath, isCompletedPhase, resolvePhaseRoute } from './phaseNavigation'

describe('phaseNavigation', () => {
  it('treats only earlier phases as completed', () => {
    expect(isCompletedPhase('C', 'E')).toBe(true)
    expect(isCompletedPhase('D', 'E')).toBe(true)
    expect(isCompletedPhase('E', 'E')).toBe(false)
    expect(isCompletedPhase('S', 'E')).toBe(false)
  })

  it('keeps PRD between Specify and Implement', () => {
    expect(isCompletedPhase('S', 'PRD')).toBe(true)
    expect(isCompletedPhase('PRD', 'PRD')).toBe(false)
    expect(isCompletedPhase('PRD', 'I')).toBe(true)
  })

  it('allows every journey phase to be reviewed after completion', () => {
    expect(['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N'].every((phase) => isCompletedPhase(phase as Parameters<typeof isCompletedPhase>[0], 'COMPLETE'))).toBe(true)
  })

  it('builds the path back to the current phase', () => {
    expect(currentPhasePath('project-123', 'PRD')).toBe('/projects/project-123/PRD')
    expect(currentPhasePath('project-123', 'COMPLETE')).toBe('/projects/project-123/COMPLETE')
  })

  it('always keeps the actual current phase editable', () => {
    expect(resolvePhaseRoute('S', 'S')).toBe('current')
    expect(resolvePhaseRoute('PRD', 'PRD')).toBe('current')
    expect(resolvePhaseRoute('E', 'S')).toBe('history')
    expect(resolvePhaseRoute('PRD', 'S')).toBe('redirect')
  })

  it('shows the summary by default and history only when requested after completion', () => {
    expect(resolvePhaseRoute(null, 'COMPLETE')).toBe('completion')
    expect(resolvePhaseRoute('N', 'COMPLETE')).toBe('history')
  })
})
