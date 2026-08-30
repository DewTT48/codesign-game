import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { getFieldGuide } from './guidanceContent'
import { FieldGuideDetails } from './PhaseFormComponents'

export function ReorderableList({
  title,
  items,
  minimum = 1,
  maximum,
  placeholder,
  guideKey,
  onChange,
}: {
  title: string
  items: string[]
  minimum?: number
  maximum?: number
  placeholder?: string
  guideKey?: string
  onChange: (items: string[]) => void
}) {
  const { language, isThai } = useLanguage()
  const guide = getFieldGuide(language, guideKey)
  const update = (index: number, value: string) =>
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)))
  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <section className="reorder-list">
      <h3>{title}</h3>
      {guide ? <><p className="reorder-list__question">{guide.question}</p><FieldGuideDetails guide={guide} label={isThai ? 'วิธีตอบและตัวอย่าง' : 'How to answer'} isThai={isThai} /></> : null}
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <input
              value={item}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
              aria-label={`${title} item ${index + 1}`}
            />
            <div className="reorder-controls">
              <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${isThai ? 'เลื่อนขึ้น' : 'Move up'} ${title} ${index + 1}`}><ArrowUp size={16} /></button>
              <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label={`${isThai ? 'เลื่อนลง' : 'Move down'} ${title} ${index + 1}`}><ArrowDown size={16} /></button>
              <button type="button" disabled={items.length <= minimum} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`${isThai ? 'ลบ' : 'Remove'} ${title} ${index + 1}`}><X size={16} /></button>
            </div>
          </li>
        ))}
      </ol>
      <button className="add-list-item" type="button" disabled={Boolean(maximum && items.length >= maximum)} onClick={() => onChange([...items, ''])}>
        <Plus size={17} /> ADD ITEM {maximum ? `(${items.length}/${maximum})` : ''}
      </button>
    </section>
  )
}
