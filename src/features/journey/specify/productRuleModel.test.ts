import { describe, expect, it } from 'vitest'
import { getProductRuleAdvisory, getProductRulePresets, resolveProductRuleText } from './productRuleModel'

describe('product rule model', () => {
  it('turns legacy dropdown codes into readable localized rules', () => {
    expect(resolveProductRuleText('return', 'allow-edit', 'th')).toBe('ผู้ใช้กลับมาอ่านและแก้ไขคำตอบเดิมได้')
    expect(resolveProductRuleText('sequence', 'sequential', 'en')).toContain('complete the previous item')
    expect(resolveProductRuleText('storage', 'browser-device', 'th')).toContain('Browser ของอุปกรณ์นี้')
  })

  it('preserves an owner-written rule instead of forcing it into a preset', () => {
    expect(resolveProductRuleText('sequence', '  ผู้ใช้เลือกบทเรียนใดก่อนก็ได้  ', 'th'))
      .toBe('ผู้ใช้เลือกบทเรียนใดก่อนก็ได้')
  })

  it('offers several editable starting points without treating them as an enum', () => {
    expect(getProductRulePresets('return', 'th')).toHaveLength(4)
    expect(getProductRulePresets('storage', 'en')).toContain('The product lets users export their data as a file and import it later to restore progress.')
  })

  it('surfaces concrete impacts for risky standard patterns in either language', () => {
    expect(getProductRuleAdvisory('return', 'no-revisit', 'th')?.message).toContain('ทบทวนหลักฐานเดิม')
    expect(getProductRuleAdvisory('sequence', 'The product makes items available on a defined date or schedule.', 'th')?.message).toContain('เขตเวลา')
    expect(getProductRuleAdvisory('storage', 'session-only', 'en')?.message).toContain('21-day journey')
    expect(getProductRuleAdvisory('storage', 'browser-device', 'th')).toBeNull()
  })
})
