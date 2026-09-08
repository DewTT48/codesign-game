import { AlertTriangle, Check, FileUp, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { MarkdownPreview } from './MarkdownPreview'
import {
  countChangedLines,
  prdFiles,
  type PrdDrafts,
  type PrdFileKey,
  validatePrdDocument,
} from './prdPackage'

type Candidate = {
  content: string
  changedLines: number
  errors: string[]
}

export function PrdPackageImport({
  current,
  onApply,
}: {
  current: PrdDrafts
  onApply: (drafts: PrdDrafts) => void
}) {
  const { isThai } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [candidates, setCandidates] = useState<Partial<Record<PrdFileKey, Candidate>>>({})
  const [unexpected, setUnexpected] = useState<string[]>([])
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [selected, setSelected] = useState<PrdFileKey>('handoff')
  const [compareMode, setCompareMode] = useState<'current' | 'incoming'>('incoming')

  const expectedByName = new Map(prdFiles.map((file) => [file.fileName, file.key]))
  const hasSelection = Object.keys(candidates).length > 0 || unexpected.length > 0 || duplicates.length > 0
  const complete = prdFiles.every(({ key }) => candidates[key] && candidates[key]?.errors.length === 0)

  const readFiles = async (files: FileList | null) => {
    if (!files) return
    const next: Partial<Record<PrdFileKey, Candidate>> = {}
    const extra: string[] = []
    const repeated: string[] = []

    for (const file of Array.from(files)) {
      const key = expectedByName.get(file.name)
      if (!key) {
        extra.push(file.name)
        continue
      }
      if (next[key]) {
        repeated.push(file.name)
        continue
      }
      const content = await file.text()
      const check = validatePrdDocument(key, content)
      next[key] = {
        content,
        changedLines: countChangedLines(current[key], content),
        errors: check.errors,
      }
    }

    setCandidates(next)
    setUnexpected(extra)
    setDuplicates(repeated)
    const first = prdFiles.find(({ key }) => next[key])
    if (first) setSelected(first.key)
    setCompareMode('incoming')
  }

  const reset = () => {
    setCandidates({})
    setUnexpected([])
    setDuplicates([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const incoming = candidates[selected]

  return (
    <section className="prd-import" aria-labelledby="prd-import-title">
      <header>
        <div>
          <span>{isThai ? 'นำผลลัพธ์จาก Chat กลับมา' : 'BRING THE CHAT RESULT BACK'}</span>
          <h3 id="prd-import-title">{isThai ? 'อัปโหลดไฟล์ .md ทั้ง 3 ไฟล์พร้อมกัน' : 'UPLOAD ALL THREE .MD FILES TOGETHER'}</h3>
          <p>{isThai ? 'ระบบจะตรวจชื่อ โครงสร้าง และแสดงความแตกต่างก่อนแทนที่ไฟล์เดิม จะยังไม่มีข้อมูลถูกเขียนทับจนกว่าคุณจะกดยืนยัน' : 'CODESIGN checks names, structure, and changes before replacing anything. Nothing is overwritten until you confirm.'}</p>
        </div>
        <label className="prd-import__picker">
          <FileUp size={19} /> {isThai ? 'เลือก 3 ไฟล์ .MD' : 'CHOOSE 3 .MD FILES'}
          <input ref={inputRef} type="file" accept=".md,text/markdown,text/plain" multiple onChange={(event) => void readFiles(event.target.files)} />
        </label>
      </header>

      {hasSelection ? (
        <>
          <div className="prd-import__status-grid">
            {prdFiles.map((file) => {
              const candidate = candidates[file.key]
              const state = !candidate ? 'missing' : candidate.errors.length ? 'error' : candidate.changedLines ? 'changed' : 'unchanged'
              const label = {
                missing: isThai ? 'ขาดไฟล์' : 'MISSING',
                error: isThai ? 'ต้องแก้ไข' : 'INVALID',
                changed: isThai ? `เปลี่ยน ${candidate?.changedLines ?? 0} บรรทัด` : `${candidate?.changedLines ?? 0} LINES CHANGED`,
                unchanged: isThai ? 'เหมือนฉบับเดิม' : 'UNCHANGED',
              }[state]
              return (
                <button type="button" key={file.key} className={`is-${state} ${selected === file.key ? 'is-active' : ''}`} onClick={() => setSelected(file.key)}>
                  {state === 'changed' || state === 'unchanged' ? <Check size={18} /> : <AlertTriangle size={18} />}
                  <span><strong>{file.fileName}</strong><small>{label}</small>{candidate?.errors.map((error) => <small key={error}>{error}</small>)}</span>
                </button>
              )
            })}
          </div>

          {unexpected.length || duplicates.length ? (
            <div className="prd-import__warning" role="alert">
              <AlertTriangle size={20} />
              <p>
                {unexpected.length ? `${isThai ? 'ไม่รู้จักไฟล์' : 'UNEXPECTED'}: ${unexpected.join(', ')}. ` : ''}
                {duplicates.length ? `${isThai ? 'มีชื่อซ้ำ' : 'DUPLICATE'}: ${duplicates.join(', ')}` : ''}
              </p>
            </div>
          ) : null}

          {incoming ? (
            <div className="prd-import__compare">
              <div className="prd-view-switch" role="group" aria-label={isThai ? 'เปรียบเทียบฉบับไฟล์' : 'Compare file versions'}>
                <button type="button" className={compareMode === 'current' ? 'is-active' : ''} onClick={() => setCompareMode('current')}>{isThai ? 'ฉบับใน CODESIGN' : 'CURRENT'}</button>
                <button type="button" className={compareMode === 'incoming' ? 'is-active' : ''} onClick={() => setCompareMode('incoming')}>{isThai ? 'ฉบับจาก Chat' : 'FROM CHAT'}</button>
              </div>
              <MarkdownPreview markdown={compareMode === 'current' ? current[selected] : incoming.content} />
            </div>
          ) : null}

          <footer>
            <button type="button" className="prd-import__reset" onClick={reset}><RotateCcw size={18} /> {isThai ? 'ยกเลิกไฟล์ที่เลือก' : 'CLEAR SELECTION'}</button>
            <button
              type="button"
              className="prd-import__apply"
              disabled={!complete || unexpected.length > 0 || duplicates.length > 0}
              onClick={() => {
                if (!complete) return
                onApply({
                  handoff: candidates.handoff!.content,
                  contentPack: candidates.contentPack!.content,
                  experienceDirection: candidates.experienceDirection!.content,
                })
                reset()
              }}
            >
              <Check size={18} /> {isThai ? 'ยืนยันแทนที่ทั้ง 3 ไฟล์' : 'CONFIRM ALL THREE FILES'}
            </button>
          </footer>
        </>
      ) : (
        <p className="prd-import__empty">{isThai ? 'ชื่อไฟล์ที่ต้องใช้: CODESIGN_HANDOFF.md, CONTENT_PACK.md และ EXPERIENCE_DIRECTION.md' : 'Required names: CODESIGN_HANDOFF.md, CONTENT_PACK.md, and EXPERIENCE_DIRECTION.md'}</p>
      )}
    </section>
  )
}
