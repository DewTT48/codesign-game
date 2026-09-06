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

const thaiStarterCopy: Record<string, Pick<ExperienceOption, 'mood' | 'typography' | 'interaction' | 'rationale' | 'tradeoff'>> = {
  'Calm Focus': {
    mood: 'สงบ ชัดเจน และช่วยให้จดจ่อ',
    typography: 'ฟอนต์ Sans-serif ที่อ่านง่าย พร้อมหัวเรื่องสั้นและชัดเจน',
    interaction: 'ตรงไปตรงมาและให้ความมั่นใจ',
    rationale: 'สีน้ำเงินเข้ม เขียวอมฟ้า และเขียว Sage สร้างลำดับชั้นที่สงบ ช่วยให้ผู้ใช้จดจ่อกับการลงมือทำทีละเรื่อง',
    tradeoff: 'ให้ความรู้สึกเป็นเกมน้อยกว่าแนวทางอื่น',
  },
  'Retro Quest': {
    mood: 'สนุก มีพลัง และมีเป้าหมาย',
    typography: 'ฟอนต์ Pixel สำหรับหัวเรื่อง และฟอนต์ที่อ่านง่ายสำหรับเนื้อหา',
    interaction: 'กดแล้วรู้สึกชัด มีรางวัล และไม่ดูเด็กเกินไป',
    rationale: 'สีเหลืองแบบ Arcade และชมพู Neon บนพื้น Indigo ทำให้เส้นทาง 21 วันรู้สึกเหมือนภารกิจ Retro ที่มีเป้าหมาย',
    tradeoff: 'ต้องควบคุมองค์ประกอบตกแต่ง เพื่อให้เนื้อหายาวยังอ่านง่าย',
  },
  'Warm Momentum': {
    mood: 'อบอุ่น มองโลกในแง่ดี และช่วยให้เดินหน้าต่อ',
    typography: 'หัวเรื่องโค้งมนเป็นมิตร และเนื้อหาที่อ่านสบาย',
    interaction: 'ฉลองความสำเร็จอย่างพอดี พร้อม Feedback ที่ชัดเจน',
    rationale: 'Terracotta สีส้ม Apricot และสีทองสร้างพลังการเดินหน้า โดยยังเหมาะกับการทบทวนตนเอง',
    tradeoff: 'ต้องควบคุมโทนอุ่นไม่ให้กลืนกันจนลำดับชั้นไม่ชัด',
  },
}

export function ExperienceSelector({ options, selectedName, onSelect, onChange }: Props) {
  const { isThai } = useLanguage()
  const selectedIndex = options.findIndex((option) => option.name === selectedName)
  const selected = options[selectedIndex]
  const displayedSelected = selected && isThai && selected.source === 'starter'
    ? { ...selected, ...thaiStarterCopy[selected.name] }
    : selected
  const thaiColorLabels: Record<(typeof colorFields)[number], string> = {
    background: 'พื้นหลัง',
    surface: 'พื้นผิวและกล่อง',
    primary: 'สีหลัก',
    accent: 'สีเน้น',
    text: 'ตัวอักษร',
  }

  const editSelected = (field: keyof ExperienceOption, value: string) => {
    if (selectedIndex < 0) return
    onChange(options.map((option, index) => index === selectedIndex ? { ...option, [field]: value, source: 'owner-edited' } : option))
  }

  return (
    <div className="experience-selector">
      <div className="experience-options">
        {options.map((option) => {
          const displayedOption = isThai && option.source === 'starter'
            ? { ...option, ...thaiStarterCopy[option.name] }
            : option
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
                <span className="experience-card__mini-button">{isThai ? 'เริ่ม' : 'START'}</span>
              </span>
              <span className="experience-card__copy">
                <span>{option.source === 'starter' ? (isThai ? 'ตัวเลือกเริ่มต้น' : 'STARTER') : option.source === 'ai-draft' ? (isThai ? 'ร่างจาก AI' : 'AI DRAFT') : (isThai ? 'ผู้ใช้ปรับแล้ว' : 'OWNER EDITED')}</span>
                <strong>{option.name}</strong>
                <small>{displayedOption.mood}</small>
                <em className={`contrast-status contrast-status--${contrast}`}>
                  {contrast === 'good' ? (isThai ? 'อ่านง่าย' : 'READABLE') : contrast === 'review' ? (isThai ? 'ควรตรวจ' : 'CHECK CONTRAST') : (isThai ? 'อ่านยาก' : 'LOW CONTRAST')}
                </em>
              </span>
              {selectedName === option.name ? <Check className="experience-card__check" size={20} /> : null}
            </button>
          )
        })}
      </div>

      {selected && displayedSelected ? (
        <article className="experience-detail">
          <header><span>{isThai ? 'ทิศทางที่เลือก' : 'SELECTED DIRECTION'}</span><h3>{selected.name}</h3></header>
          <div className="experience-detail__text">
            <p><strong>{isThai ? 'เหตุผลที่เหมาะ' : 'RATIONALE'}</strong>{displayedSelected.rationale}</p>
            <p><strong>{isThai ? 'สิ่งที่ต้องระวัง' : 'TRADE-OFF'}</strong>{displayedSelected.tradeoff}</p>
          </div>
          <div className="color-role-grid">
            {colorFields.map((field) => (
              <label key={field}>
                <span>{isThai ? thaiColorLabels[field] : field.toUpperCase()}</span>
                <input type="color" value={selected[field]} onChange={(event) => editSelected(field, event.target.value.toUpperCase())} />
                <input aria-label={isThai ? `รหัสสี${thaiColorLabels[field]}` : `${field} hex value`} value={selected[field]} onChange={(event) => editSelected(field, event.target.value)} />
              </label>
            ))}
          </div>
          <details className="experience-advanced">
            <summary>{isThai ? 'ปรับรายละเอียดเพิ่มเติม' : 'ADVANCED EXPERIENCE DETAILS'}</summary>
            <label><span>{isThai ? 'รูปแบบตัวอักษร' : 'TYPOGRAPHY'}</span><textarea rows={2} value={displayedSelected.typography} onChange={(event) => editSelected('typography', event.target.value)} /></label>
            <label><span>{isThai ? 'รูปแบบการโต้ตอบ' : 'INTERACTION'}</span><textarea rows={2} value={displayedSelected.interaction} onChange={(event) => editSelected('interaction', event.target.value)} /></label>
            <label><span>{isThai ? 'เหตุผลในการเลือก' : 'RATIONALE'}</span><textarea rows={3} value={displayedSelected.rationale} onChange={(event) => editSelected('rationale', event.target.value)} /></label>
            <label><span>{isThai ? 'สิ่งที่ต้องระวัง' : 'TRADE-OFF'}</span><textarea rows={3} value={displayedSelected.tradeoff} onChange={(event) => editSelected('tradeoff', event.target.value)} /></label>
          </details>
        </article>
      ) : null}
    </div>
  )
}
