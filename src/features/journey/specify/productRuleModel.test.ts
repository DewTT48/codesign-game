import { describe, expect, it } from 'vitest'
import { getProductRulePresets, resolveProductRuleText } from './productRuleModel'

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
    expect(getProductRulePresets('storage', 'en')).toContain('The product lets users download their data as a file.')
  })
})
