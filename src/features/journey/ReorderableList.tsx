import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'

export function ReorderableList({
  title,
  items,
  minimum = 1,
  maximum,
  placeholder,
  onChange,
}: {
  title: string
  items: string[]
  minimum?: number
  maximum?: number
  placeholder?: string
  onChange: (items: string[]) => void
}) {
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
              <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`เลื่อน ${title} ข้อ ${index + 1} ขึ้น`}><ArrowUp size={16} /></button>
              <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label={`เลื่อน ${title} ข้อ ${index + 1} ลง`}><ArrowDown size={16} /></button>
              <button type="button" disabled={items.length <= minimum} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`ลบ ${title} ข้อ ${index + 1}`}><X size={16} /></button>
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
