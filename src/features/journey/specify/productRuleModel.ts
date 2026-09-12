import type { AppLanguage } from '../../i18n/LanguageContext'

export type ProductRuleKind = 'return' | 'sequence' | 'storage'

const legacyRuleText: Record<ProductRuleKind, Record<string, Record<AppLanguage, string>>> = {
  return: {
    'allow-edit': {
      th: 'ผู้ใช้กลับมาอ่านและแก้ไขคำตอบเดิมได้',
      en: 'Users can return to read and edit an earlier response.',
    },
    'read-only': {
      th: 'ผู้ใช้กลับมาอ่านคำตอบเดิมได้ แต่แก้ไขไม่ได้',
      en: 'Users can return to read an earlier response but cannot edit it.',
    },
    'no-revisit': {
      th: 'ผู้ใช้ไม่สามารถย้อนกลับไปยังรายการที่ทำเสร็จแล้ว',
      en: 'Users cannot return to an item after completing it.',
    },
  },
  sequence: {
    sequential: {
      th: 'ผู้ใช้ต้องทำรายการก่อนหน้าให้สำเร็จ จึงเปิดรายการถัดไปได้',
      en: 'Users must complete the previous item before the next item becomes available.',
    },
    'allow-skip': {
      th: 'ผู้ใช้ข้ามไปทำรายการถัดไปได้ แม้รายการก่อนหน้ายังไม่สำเร็จ',
      en: 'Users can move to a later item before completing the previous one.',
    },
  },
  storage: {
    'browser-device': {
      th: 'ระบบจำคำตอบและความคืบหน้าไว้ใน Browser ของอุปกรณ์นี้',
      en: 'The product keeps responses and progress in this device\'s browser.',
    },
    'session-only': {
      th: 'ระบบเก็บข้อมูลเฉพาะระหว่างที่เปิดใช้งาน และลบเมื่อปิด Browser',
      en: 'The product keeps data only for the current session and removes it when the browser closes.',
    },
  },
}

const rulePresets: Record<ProductRuleKind, Record<AppLanguage, string[]>> = {
  return: {
    th: [
      legacyRuleText.return['allow-edit'].th,
      legacyRuleText.return['read-only'].th,
      'ผู้ใช้เริ่มทำรายการเดิมใหม่ได้',
      legacyRuleText.return['no-revisit'].th,
    ],
    en: [
      legacyRuleText.return['allow-edit'].en,
      legacyRuleText.return['read-only'].en,
      'Users can restart an earlier item.',
      legacyRuleText.return['no-revisit'].en,
    ],
  },
  sequence: {
    th: [
      legacyRuleText.sequence.sequential.th,
      legacyRuleText.sequence['allow-skip'].th,
      'ผู้ใช้เลือกทำรายการใดก่อนก็ได้',
      'ระบบเปิดรายการตามวันหรือเวลาที่กำหนด',
    ],
    en: [
      legacyRuleText.sequence.sequential.en,
      legacyRuleText.sequence['allow-skip'].en,
      'Users can complete the items in any order.',
      'The product makes items available on a defined date or schedule.',
    ],
  },
  storage: {
    th: [
      legacyRuleText.storage['browser-device'].th,
      legacyRuleText.storage['session-only'].th,
      'ระบบให้ผู้ใช้ดาวน์โหลดข้อมูลเป็นไฟล์เก็บไว้',
    ],
    en: [
      legacyRuleText.storage['browser-device'].en,
      legacyRuleText.storage['session-only'].en,
      'The product lets users download their data as a file.',
    ],
  },
}

export function resolveProductRuleText(kind: ProductRuleKind, value: unknown, language: AppLanguage) {
  if (typeof value !== 'string') return ''
  const candidate = value.trim()
  return legacyRuleText[kind][candidate.toLowerCase()]?.[language] ?? candidate
}

export function getProductRulePresets(kind: ProductRuleKind, language: AppLanguage) {
  return [...rulePresets[kind][language]]
}
