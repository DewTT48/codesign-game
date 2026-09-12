import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../i18n/LanguageContext'
import { SpecifyImportPanel } from './SpecifyImportPanel'

describe('SpecifyImportPanel', () => {
  it('previews pasted handoff Markdown and applies the whole import', () => {
    const onApplyImport = vi.fn()
    render(
      <LanguageProvider>
        <SpecifyImportPanel onApplyImport={onApplyImport} />
      </LanguageProvider>,
    )

    expect(screen.getByText('ไฟล์นี้มาจากไหน?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'อัปโหลดไฟล์จาก AI' })).toBeInTheDocument()
    fireEvent.click(screen.getByText('AI ไม่มีปุ่มดาวน์โหลดไฟล์? วาง Markdown แทน'))
    fireEvent.change(screen.getByPlaceholderText('วาง Markdown ทั้งหมดที่ได้จาก AI ที่นี่…'), {
      target: {
        value: `<!-- CODESIGN:OWNER_SPEC:v1 -->
## OWNER SPECIFICATION
PRODUCT_LANGUAGE: th
BRAND_COPY: 21 DAYS OF
PRIMARY_JOURNEY: เปิด App → ทำภารกิจ → บันทึกผล
ONE_DAY_COMPLETE_WHEN: ลงมือทำและบันทึกผล
RETURN_RULE: allow-edit
DAY_SEQUENCE: sequential
SAVE_BEHAVIOR: browser-device
TIME_PER_DAY: 10 นาที
ARC_1_TITLE: เห็น
ARC_1_GOAL: สังเกต
ARC_2_TITLE: ขยับ
ARC_2_GOAL: ทดลอง
ARC_3_TITLE: เชื่อ
ARC_3_GOAL: สะสมหลักฐาน
DAILY_CONTENT_PATTERN: แนวคิดสั้น
DAILY_EXERCISE_PATTERN: ลงมือทำหนึ่งอย่าง
DAILY_RECORD_PATTERN: บันทึกหลักฐาน`,
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ตรวจ Markdown ก่อนนำเข้า' }))

    expect(screen.getByText('ข้อมูล S1–S2: พบแล้ว')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'นำเข้าและใช้แทนข้อมูลเดิม' }))

    expect(onApplyImport).toHaveBeenCalledTimes(1)
    expect(onApplyImport.mock.calls[0][0].ownerSpecification.journeySummary).toContain('เปิด App')
    expect(onApplyImport.mock.calls[0][1]).toBe('replace')
    expect(screen.getByText('นำเข้าข้อมูลแล้ว เลื่อนลงเพื่อตรวจและแก้ไขก่อนยืนยัน')).toBeInTheDocument()
  })
})
