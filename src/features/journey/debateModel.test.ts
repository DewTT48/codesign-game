import { describe, expect, it } from 'vitest'
import {
  buildDebateSummary,
  debateDecisionLines,
  normalizeDebateAssumption,
  resolveDebateSummary,
  withDebateReason,
  withDebateStance,
} from './debateModel'

describe('debateModel', () => {
  it('maps a legacy reason only to the stance it was written for', () => {
    expect(normalizeDebateAssumption({
      text: 'Users will return daily',
      stance: 'agree',
      why: 'We can test this in version one',
      change: '',
    })).toEqual({
      text: 'Users will return daily',
      stance: 'agree',
      agreeReason: 'We can test this in version one',
      challengeReason: '',
      change: '',
    })
  })

  it('keeps separate reasons when the stance changes', () => {
    const agreed = withDebateReason({
      text: 'Users will return daily',
      stance: 'agree',
      why: 'A small pilot makes the risk acceptable',
      change: '',
    }, 'A small pilot makes the risk acceptable')
    const challenged = withDebateReason(withDebateStance(agreed, 'challenge'), 'Previous users abandoned similar apps')
    const assumption = normalizeDebateAssumption({
      ...challenged,
      text: 'Users will return daily',
      change: 'Remove streak pressure',
    })

    expect(assumption.agreeReason).toBe('A small pilot makes the risk acceptable')
    expect(assumption.challengeReason).toBe('Previous users abandoned similar apps')
    expect(debateDecisionLines([assumption], 'en')[0]).toContain('Previous users abandoned similar apps')
    expect(debateDecisionLines([assumption], 'en')[0]).not.toContain('small pilot')

    const restoredAgree = withDebateStance(assumption, 'agree')
    expect(restoredAgree.agreeReason).toBe('A small pilot makes the risk acceptable')
    expect(restoredAgree.change).toBe('Remove streak pressure')
    expect(debateDecisionLines([restoredAgree], 'en')[0]).not.toContain('Remove streak pressure')
  })

  it('builds a complete summary without asking the owner to repeat reasons', () => {
    const summary = buildDebateSummary([{
      text: 'ผู้ใช้จะกลับมาทุกวัน',
      stance: 'challenge',
      challengeReason: 'ผู้ใช้เหนื่อยหลังเลิกงาน',
      agreeReason: '',
      change: 'ลดกิจกรรมเหลือ 5 นาที',
    }], 'WE REFINED OUR DIRECTION', 'th')

    expect(summary).toContain('ใช้ Direction เดิม แต่ปรับบางส่วน')
    expect(summary).toContain('ผู้ใช้เหนื่อยหลังเลิกงาน')
    expect(summary).toContain('ลดกิจกรรมเหลือ 5 นาที')
  })

  it('preserves a legacy owner-written summary and honors the new automatic mode', () => {
    const debate = {
      assumptions: [{ text: 'Users return daily', stance: 'agree', why: 'Observed in interviews', change: '' }],
      directionResult: 'OUR DIRECTION STAYED THE SAME',
      whatChanged: 'Legacy owner conclusion',
    }
    expect(resolveDebateSummary(debate, 'en')).toBe('Legacy owner conclusion')
    expect(resolveDebateSummary({ ...debate, summaryCustomized: false }, 'en')).toContain('Observed in interviews')
  })
})
