import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { contrastRatio, type ExperienceOption } from './specifyModel'

type Props = {
  options: ExperienceOption[]
  selectedName: string
  onSelect: (name: string) => void
  onChange: (options: ExperienceOption[]) => void
}

const colorFields: Array<keyof Pick<ExperienceOption, 'background' | 'surface' | 'primary' | 'accent' | 'text'>> = [
  'background', 'surface', 'primary', 'accent', 'text',
]

export function ExperienceSelector({ options, selectedName, onSelect, onChange }: Props) {
  const { isThai } = useLanguage()
  const selectedIndex = options.findIndex((option) => option.name === selectedName)
  const selected = options[selectedIndex]

  const editSelected = (field: keyof ExperienceOption, value: string) => {
    if (selectedIndex < 0) return
    onChange(options.map((option, index) => index === selectedIndex ? { ...option, [field]: value, source: 'owner-edited' } : option))
  }

  return (
    <div className="experience-selector">
      <div className="experience-options">
        {options.map((option) => {
          const ratio = contrastRatio(option.text, option.background)
          const contrast = ratio === null ? 'unknown' : ratio >= 4.5 ? 'good' : ratio >= 3 ? 'review' : 'poor'
          const style = {
            '--preview-bg': option.background,
            '--preview-surface': option.surface,
            '--preview-primary': option.primary,
            '--preview-accent': option.accent,
            '--preview-text': option.text,
          } as CSSProperties
          return (
            <button
              type="button"
              className={selectedName === option.name ? 'experience-card is-active' : 'experience-card'}
              style={style}
              key={option.name}
              onClick={() => onSelect(option.name)}
            >
              <span className="experience-card__preview">
                <span className="experience-card__mini-title">21 DAYS OF</span>
                <span className="experience-card__mini-card"><i /> <i /> <i /></span>
                <span className="experience-card__mini-button">START</span>
              </span>
              <span className="experience-card__copy">
                <span>{option.source === 'starter' ? 'STARTER' : option.source === 'ai-draft' ? 'AI DRAFT' : 'OWNER EDITED'}</span>
                <strong>{option.name}</strong>
                <small>{option.mood}</small>
                <em className={`contrast-status contrast-status--${contrast}`}>
                  {contrast === 'good' ? (isThai ? 'อ่านง่าย' : 'READABLE') : contrast === 'review' ? (isThai ? 'ควรตรวจ' : 'CHECK CONTRAST') : (isThai ? 'อ่านยาก' : 'LOW CONTRAST')}
                </em>
              </span>
              {selectedName === option.name ? <Check className="experience-card__check" size={20} /> : null}
            </button>
          )
        })}
      </div>

      {selected ? (
        <article className="experience-detail">
          <header><span>SELECTED DIRECTION</span><h3>{selected.name}</h3></header>
          <div className="experience-detail__text">
            <p><strong>{isThai ? 'เหตุผลที่เหมาะ' : 'RATIONALE'}</strong>{selected.rationale}</p>
            <p><strong>{isThai ? 'สิ่งที่ต้องระวัง' : 'TRADE-OFF'}</strong>{selected.tradeoff}</p>
          </div>
          <div className="color-role-grid">
            {colorFields.map((field) => (
              <label key={field}>
                <span>{field.toUpperCase()}</span>
                <input type="color" value={selected[field]} onChange={(event) => editSelected(field, event.target.value.toUpperCase())} />
                <input aria-label={`${field} hex value`} value={selected[field]} onChange={(event) => editSelected(field, event.target.value)} />
              </label>
            ))}
          </div>
          <details className="experience-advanced">
            <summary>{isThai ? 'ปรับรายละเอียดเพิ่มเติม' : 'ADVANCED EXPERIENCE DETAILS'}</summary>
            <label><span>TYPOGRAPHY</span><textarea rows={2} value={selected.typography} onChange={(event) => editSelected('typography', event.target.value)} /></label>
            <label><span>INTERACTION</span><textarea rows={2} value={selected.interaction} onChange={(event) => editSelected('interaction', event.target.value)} /></label>
            <label><span>RATIONALE</span><textarea rows={3} value={selected.rationale} onChange={(event) => editSelected('rationale', event.target.value)} /></label>
            <label><span>TRADE-OFF</span><textarea rows={3} value={selected.tradeoff} onChange={(event) => editSelected('tradeoff', event.target.value)} /></label>
          </details>
        </article>
      ) : null}
    </div>
  )
}
