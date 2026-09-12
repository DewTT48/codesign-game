import { describe, expect, it } from 'vitest'
import {
  findExactScopeConflicts,
  moveScopeDecision,
  normalizeScopeList,
} from './scopeDecisionModel'

describe('scopeDecisionModel', () => {
  it('moves one decision instead of copying it into both statuses', () => {
    const result = moveScopeDecision({
      mustHaves: ['บันทึกความคืบหน้า', 'สะท้อนสิ่งที่เรียนรู้'],
      nonGoals: ['ระบบสมาชิก'],
    }, 'must-have', 0, 'non-goal')

    expect(result.mustHaves).toEqual(['สะท้อนสิ่งที่เรียนรู้'])
    expect(result.nonGoals).toEqual(['ระบบสมาชิก', 'บันทึกความคืบหน้า'])
  })

  it('allows more than eight must-haves because eight is guidance, not a limit', () => {
    const existing = Array.from({ length: 8 }, (_, index) => `Must-have ${index + 1}`)
    const result = moveScopeDecision({
      mustHaves: existing,
      nonGoals: ['Must-have 9'],
    }, 'non-goal', 0, 'must-have')

    expect(result.mustHaves).toHaveLength(9)
    expect(result.mustHaves.at(-1)).toBe('Must-have 9')
    expect(result.nonGoals).toEqual([])
  })

  it('reports only the same complete decision across both statuses', () => {
    expect(findExactScopeConflicts(
      ['บันทึกความคืบหน้ารายวัน', 'Complete a daily mission and record feedback'],
      [' บันทึกความคืบหน้ารายวัน。', 'No automated daily content or social mission feed'],
    )).toEqual([{ text: 'บันทึกความคืบหน้ารายวัน', mustHaveIndex: 0, nonGoalIndex: 0 }])
  })

  it('does not treat shared keywords as a scope conflict', () => {
    expect(findExactScopeConflicts(
      ['Complete a daily mission and record feedback'],
      ['No automated daily content or social mission feed'],
    )).toEqual([])
  })

  it('safely normalizes legacy list values', () => {
    expect(normalizeScopeList(['One', 2, null])).toEqual(['One', '', ''])
    expect(normalizeScopeList(null)).toEqual([])
  })
})
