import { CheckCircle2, FileUp, ScanSearch } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { parseSpecifyMarkdown, type SpecifyMarkdownImport } from './markdownImport'

type Props = {
  onApplyImport: (data: SpecifyMarkdownImport, mode: 'empty' | 'replace') => void
}

export function SpecifyImportPanel({ onApplyImport }: Props) {
  const { isThai } = useLanguage()
  const fileRef = useRef<HTMLInputElement>(null)
  const [markdown, setMarkdown] = useState('')
  const [preview, setPreview] = useState<SpecifyMarkdownImport | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [fileError, setFileError] = useState('')
  const [applyMessage, setApplyMessage] = useState('')

  const inspect = (value = markdown) => {
    setFileError('')
    setApplyMessage('')
    setPreview(parseSpecifyMarkdown(value))
  }

  const loadFile = async (file?: File) => {
    if (!file) return
    if (file.size > 2_000_000) {
      setFileError(isThai ? 'ไฟล์ใหญ่เกิน 2 MB' : 'The file is larger than 2 MB.')
      return
    }
    const value = await file.text()
    setMarkdown(value)
    setSourceName(file.name)
    inspect(value)
  }

  const warningText = (warning: string) => ({
    NO_SUPPORTED_SECTIONS: isThai ? 'ยังไม่พบข้อมูลตาม Template ของ CODESIGN' : 'No supported CODESIGN sections were found.',
    OWNER_SPEC_INCOMPLETE: isThai ? 'ข้อมูลสำหรับ S1–S2 ยังไม่ครบ ระบบจะเติมเฉพาะ Field ที่พบ' : 'The S1–S2 specification is incomplete. Only fields found in the file will be applied.',
    OWNER_RULE_INVALID: isThai ? 'กติกาบางข้อไม่ได้ใช้ค่าตาม Template โปรดตรวจ Dropdown หลังนำเข้า' : 'Some product rules do not use supported template values. Review the dropdowns after import.',
    CONTENT_PACK_INCOMPLETE: isThai ? 'Content Pack ยังไม่ครบ 21 วัน สามารถนำเข้าวันที่พบก่อนได้' : 'The Content Pack has fewer than 21 days. You can still import the available days.',
    THEME_OPTIONS_INCOMPLETE: isThai ? 'พบ Theme น้อยกว่า 3 ตัวเลือก' : 'Fewer than three theme options were found.',
    DAY_FIELDS_MISSING: isThai ? 'บางวันมีข้อมูลไม่ครบ ระบบจะแสดงช่องที่ยังขาดหลังนำเข้า' : 'Some days have missing fields. The editor will show what still needs work.',
  }[warning] ?? warning)

  const apply = (mode: 'empty' | 'replace') => {
    if (!preview) return
    onApplyImport(preview, mode)
    setApplyMessage(isThai
      ? 'นำเข้าข้อมูลแล้ว เลื่อนลงเพื่อตรวจและแก้ไขก่อนยืนยัน'
      : 'Imported. Review and edit the sections below before confirming.')
  }

  const hasImportableContent = Boolean(preview?.ownerSpecification || preview?.days.length || preview?.experienceOptions.length)

  return (
    <section className="spec-import" aria-labelledby="spec-import-title">
      <header className="spec-import__header">
        <div>
          <span>{isThai ? 'เมื่อคุยจบ — นำงานจาก Chat กลับมา' : 'AFTER CHAT — BRING THE WORK BACK'}</span>
          <h3 id="spec-import-title">{isThai ? 'อัปโหลดไฟล์ CODESIGN_SPEC.md' : 'Upload CODESIGN_SPEC.md'}</h3>
        </div>
        <button className="spec-import__upload" type="button" onClick={() => fileRef.current?.click()}><FileUp size={18} /> {isThai ? 'เลือกไฟล์ .MD' : 'CHOOSE .MD FILE'}</button>
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={(event) => void loadFile(event.target.files?.[0])}
        />
      </header>
      <ol className="spec-import__flow">
        <li>{isThai ? 'คุยกับ Chat จนตัดสินใจครบ' : 'Finish the decisions with Chat'}</li>
        <li>{isThai ? 'พิมพ์ FINALIZE และดาวน์โหลดไฟล์' : 'Type FINALIZE and download the file'}</li>
        <li>{isThai ? 'อัปโหลดแล้วตรวจข้อมูลก่อนนำเข้า' : 'Upload and preview before import'}</li>
        <li>{isThai ? 'ตรวจ แก้ และยืนยันใน CODESIGN' : 'Review, edit, and confirm in CODESIGN'}</li>
      </ol>
      <p className="privacy-reminder">
        {isThai
          ? 'ก่อนส่งข้อมูลให้ AI ภายนอก โปรดนำข้อมูลส่วนบุคคล ข้อมูลลูกค้า และข้อมูลลับขององค์กรออก ไฟล์ที่อัปโหลดจะถูกอ่านเพื่อเติมแบบฟอร์มนี้'
          : 'Before sending content to external AI, remove personal, customer, and confidential organization data. The uploaded file is read to populate this form.'}
      </p>
      {sourceName ? <p className="spec-import__file"><FileUp size={17} /> {isThai ? 'ไฟล์ที่ตรวจ:' : 'File checked:'} <strong>{sourceName}</strong></p> : null}

      <details className="spec-import__paste">
        <summary>{isThai ? 'Chat สร้างไฟล์ไม่ได้? วาง Markdown แทน' : 'Chat cannot create a file? Paste Markdown instead'}</summary>
        <textarea
          rows={9}
          value={markdown}
          placeholder={isThai ? 'วาง Markdown ทั้งหมดที่ได้จาก Chat ที่นี่…' : 'Paste the complete Markdown returned by Chat here…'}
          onChange={(event) => {
            setMarkdown(event.target.value)
            setSourceName('')
            setPreview(null)
            setApplyMessage('')
          }}
        />
        <button className="spec-import__inspect" type="button" disabled={!markdown.trim()} onClick={() => inspect()}>
          <ScanSearch size={18} /> {isThai ? 'ตรวจ Markdown ก่อนนำเข้า' : 'PREVIEW MARKDOWN'}
        </button>
      </details>
      {fileError ? <p className="field-error" role="alert">{fileError}</p> : null}

      {preview ? (
        <div className="spec-import__preview" role="status">
          <div className="spec-import__counts">
            <strong className={preview.ownerSpecification ? 'is-found' : ''}>{isThai ? `ข้อมูล S1–S2: ${preview.ownerSpecification ? 'พบแล้ว' : 'ไม่พบ'}` : `S1–S2 specification: ${preview.ownerSpecification ? 'found' : 'not found'}`}</strong>
            <strong className={preview.days.length === 21 ? 'is-found' : ''}>{isThai ? `เนื้อหา ${preview.days.length}/21 วัน` : `${preview.days.length}/21 content days`}</strong>
            <strong className={preview.experienceOptions.length === 3 ? 'is-found' : ''}>{isThai ? `Theme ${preview.experienceOptions.length}/3 แบบ` : `${preview.experienceOptions.length}/3 themes`}</strong>
          </div>
          {preview.ownerSpecification ? (
            <details className="spec-import__owner-preview">
              <summary>{isThai ? 'ดูข้อสรุปที่จะเติมใน S1–S2' : 'Review the S1–S2 summary to import'}</summary>
              <dl>
                <div><dt>{isThai ? 'เส้นทางหลัก' : 'Primary journey'}</dt><dd>{preview.ownerSpecification.journeySummary || '—'}</dd></div>
                <div><dt>{isThai ? 'หนึ่งวันสำเร็จเมื่อ' : 'One day completes when'}</dt><dd>{preview.ownerSpecification.dailyCompletionRule || '—'}</dd></div>
                <div><dt>{isThai ? 'โครงเนื้อหา 3 ช่วง' : 'Three content arcs'}</dt><dd>{preview.ownerSpecification.contentArcs.map((arc) => arc.title).filter(Boolean).join(' → ') || '—'}</dd></div>
                <div><dt>{isThai ? 'รูปแบบการบันทึก' : 'Daily record pattern'}</dt><dd>{preview.ownerSpecification.recordPattern || '—'}</dd></div>
              </dl>
            </details>
          ) : null}
          {preview.warnings.length ? <ul>{preview.warnings.map((warning) => <li key={warning}>{warningText(warning)}</li>)}</ul> : null}
          {hasImportableContent ? (
            <div className="spec-import__actions">
              <button type="button" onClick={() => apply('replace')}>{isThai ? 'นำเข้าและใช้แทนข้อมูลเดิม' : 'IMPORT AND REPLACE EXISTING DATA'}</button>
              <button type="button" onClick={() => apply('empty')}>{isThai ? 'เติมเฉพาะช่องที่ยังว่าง' : 'FILL EMPTY FIELDS ONLY'}</button>
            </div>
          ) : null}
          {applyMessage ? <p className="spec-import__applied"><CheckCircle2 size={18} /> {applyMessage}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
