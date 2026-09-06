import { FileUp, ScanSearch } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { parseSpecifyMarkdown, type SpecifyMarkdownImport } from './markdownImport'
import type { DailyContent, ExperienceOption } from './specifyModel'

type Props = {
  onApplyDays: (days: DailyContent[], mode: 'empty' | 'replace') => void
  onApplyExperience: (options: ExperienceOption[]) => void
}

export function SpecifyImportPanel({ onApplyDays, onApplyExperience }: Props) {
  const { isThai } = useLanguage()
  const fileRef = useRef<HTMLInputElement>(null)
  const [markdown, setMarkdown] = useState('')
  const [preview, setPreview] = useState<SpecifyMarkdownImport | null>(null)
  const [fileError, setFileError] = useState('')

  const inspect = (value = markdown) => {
    setFileError('')
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
    inspect(value)
  }

  const warningText = (warning: string) => ({
    NO_SUPPORTED_SECTIONS: isThai ? 'ยังไม่พบหัวข้อ DAY หรือ THEME OPTION ตาม Template' : 'No supported DAY or THEME OPTION sections were found.',
    CONTENT_PACK_INCOMPLETE: isThai ? 'Content Pack ยังไม่ครบ 21 วัน สามารถเติมเฉพาะวันที่พบก่อนได้' : 'The content pack has fewer than 21 days. You can still import the available days.',
    THEME_OPTIONS_INCOMPLETE: isThai ? 'พบ Theme น้อยกว่า 3 ตัวเลือก' : 'Fewer than three theme options were found.',
    DAY_FIELDS_MISSING: isThai ? 'บางวันมีข้อมูลไม่ครบ ระบบจะแสดงช่องที่ยังขาดหลังนำเข้า' : 'Some days have missing fields. The editor will show what still needs work.',
  }[warning] ?? warning)

  return (
    <section className="spec-import" aria-labelledby="spec-import-title">
      <header>
        <div>
          <span>EXTERNAL AI HANDOFF</span>
          <h3 id="spec-import-title">{isThai ? 'นำคำตอบจาก Chat กลับเข้า CODESIGN' : 'Bring the Chat response back into CODESIGN'}</h3>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()}><FileUp size={18} /> {isThai ? 'อัปโหลด .MD' : 'UPLOAD .MD'}</button>
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={(event) => void loadFile(event.target.files?.[0])}
        />
      </header>
      <p className="privacy-reminder">
        {isThai
          ? 'ก่อนส่งข้อมูลให้ AI ภายนอก โปรดนำข้อมูลส่วนบุคคล ข้อมูลลูกค้า และข้อมูลลับขององค์กรออก'
          : 'Before sending content to an external AI, remove personal, customer, and confidential organization data.'}
      </p>
      <textarea
        rows={9}
        value={markdown}
        placeholder={isThai ? 'วาง Markdown ที่ได้จาก Chat ที่นี่…' : 'Paste the Markdown returned by Chat here…'}
        onChange={(event) => {
          setMarkdown(event.target.value)
          setPreview(null)
        }}
      />
      <button className="spec-import__inspect" type="button" disabled={!markdown.trim()} onClick={() => inspect()}>
        <ScanSearch size={18} /> {isThai ? 'ตรวจไฟล์ก่อนนำเข้า' : 'PREVIEW IMPORT'}
      </button>
      {fileError ? <p className="field-error" role="alert">{fileError}</p> : null}

      {preview ? (
        <div className="spec-import__preview" role="status">
          <div>
            <strong>{isThai ? `พบเนื้อหา ${preview.days.length} วัน` : `${preview.days.length} content days found`}</strong>
            <strong>{isThai ? `พบ Theme ${preview.experienceOptions.length} แบบ` : `${preview.experienceOptions.length} themes found`}</strong>
          </div>
          {preview.warnings.length ? <ul>{preview.warnings.map((warning) => <li key={warning}>{warningText(warning)}</li>)}</ul> : null}
          <div className="spec-import__actions">
            {preview.days.length ? (
              <>
                <button type="button" onClick={() => onApplyDays(preview.days, 'empty')}>{isThai ? 'เติมเฉพาะช่องว่าง' : 'FILL EMPTY FIELDS'}</button>
                <button type="button" onClick={() => onApplyDays(preview.days, 'replace')}>{isThai ? 'แทน Content Pack เดิม' : 'REPLACE CONTENT PACK'}</button>
              </>
            ) : null}
            {preview.experienceOptions.length ? <button type="button" onClick={() => onApplyExperience(preview.experienceOptions)}>{isThai ? 'ใช้ Theme ที่นำเข้า' : 'USE IMPORTED THEMES'}</button> : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
