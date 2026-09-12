import type { AppLanguage } from '../../i18n/LanguageContext'

export type ProductRuleKind = 'return' | 'sequence' | 'storage'

export type ProductRuleAdvisory = {
  message: string
}

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
      'ระบบให้ผู้ใช้ส่งออกข้อมูลเป็นไฟล์ และนำไฟล์กลับมาเพื่อกู้คืนความคืบหน้าได้',
    ],
    en: [
      legacyRuleText.storage['browser-device'].en,
      legacyRuleText.storage['session-only'].en,
      'The product lets users export their data as a file and import it later to restore progress.',
    ],
  },
}

const matchesRule = (value: unknown, candidates: string[]) => {
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLocaleLowerCase()
  return candidates.some((candidate) => candidate.toLocaleLowerCase() === normalized)
}

export function resolveProductRuleText(kind: ProductRuleKind, value: unknown, language: AppLanguage) {
  if (typeof value !== 'string') return ''
  const candidate = value.trim()
  return legacyRuleText[kind][candidate.toLowerCase()]?.[language] ?? candidate
}

export function getProductRulePresets(kind: ProductRuleKind, language: AppLanguage) {
  return [...rulePresets[kind][language]]
}

export function getProductRuleAdvisory(kind: ProductRuleKind, value: unknown, language: AppLanguage): ProductRuleAdvisory | null {
  if (kind === 'return' && matchesRule(value, [
    'no-revisit',
    legacyRuleText.return['no-revisit'].th,
    legacyRuleText.return['no-revisit'].en,
  ])) {
    return {
      message: language === 'th'
        ? 'ผลกระทบที่ต้องยืนยัน: ผู้ใช้จะกลับมาอ่านคำตอบหรือทบทวนหลักฐานเดิมหลังทำเสร็จไม่ได้'
        : 'Confirm this impact: users will not be able to return to read earlier responses or review prior evidence.',
    }
  }

  if (kind === 'return' && matchesRule(value, [
    'ผู้ใช้เริ่มทำรายการเดิมใหม่ได้',
    'Users can restart an earlier item.',
  ])) {
    return {
      message: language === 'th'
        ? 'ต้องระบุเพิ่ม: เมื่อเริ่มใหม่ ระบบจะแทนที่คำตอบเดิมหรือเก็บคำตอบเดิมไว้เป็นประวัติ'
        : 'Clarify what happens on restart: replace the earlier response or retain it as history.',
    }
  }

  if (kind === 'sequence' && matchesRule(value, [
    'ระบบเปิดรายการตามวันหรือเวลาที่กำหนด',
    'The product makes items available on a defined date or schedule.',
  ])) {
    return {
      message: language === 'th'
        ? 'ต้องระบุเพิ่ม: วันหรือเวลาเริ่มต้น เขตเวลา และสิ่งที่เกิดขึ้นเมื่อนาฬิกาของอุปกรณ์คลาดเคลื่อน'
        : 'Clarify the start date or time, time zone, and what happens if the device clock is inaccurate.',
    }
  }

  if (kind === 'storage' && matchesRule(value, [
    'session-only',
    legacyRuleText.storage['session-only'].th,
    legacyRuleText.storage['session-only'].en,
  ])) {
    return {
      message: language === 'th'
        ? 'ผลกระทบสูง: เมื่อปิด Browser ความคืบหน้าจะหาย จึงอาจทำให้ผู้ใช้ทำ Product 21 วันต่อเนื่องไม่ได้'
        : 'High impact: closing the browser removes progress, which may prevent a continuous 21-day journey.',
    }
  }

  if (kind === 'storage' && matchesRule(value, [
    'ระบบให้ผู้ใช้ส่งออกข้อมูลเป็นไฟล์ และนำไฟล์กลับมาเพื่อกู้คืนความคืบหน้าได้',
    'The product lets users export their data as a file and import it later to restore progress.',
  ])) {
    return {
      message: language === 'th'
        ? 'ต้องระบุเพิ่ม: ผู้ใช้ส่งออกไฟล์เมื่อใด และระบบให้เลือกไฟล์กลับมาเพื่อกู้คืนความคืบหน้าที่จุดใด'
        : 'Clarify when users export the file and where they can import it to restore progress.',
    }
  }

  return null
}
