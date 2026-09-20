import { Check, CircleAlert } from 'lucide-react'

export type PhaseCompletionItem = {
  label: string
  complete: boolean
}

export function PhaseCompletionGuide({ items, isThai }: { items: PhaseCompletionItem[]; isThai: boolean }) {
  const completed = items.filter((item) => item.complete).length
  const allComplete = completed === items.length

  return <aside className={allComplete ? 'phase-completion-guide is-complete' : 'phase-completion-guide'} aria-labelledby="phase-completion-guide-title">
    <header>
      {allComplete ? <Check size={22} aria-hidden="true" /> : <CircleAlert size={22} aria-hidden="true" />}
      <div>
        <span>{allComplete ? (isThai ? 'พร้อมยืนยัน Step นี้' : 'READY TO CONFIRM THIS STEP') : (isThai ? 'ก่อนผ่าน Step นี้' : 'BEFORE COMPLETING THIS STEP')}</span>
        <strong id="phase-completion-guide-title">{allComplete
          ? (isThai ? 'ทำรายการที่จำเป็นครบแล้ว' : 'All required work is complete')
          : (isThai ? `ยังต้องทำให้ครบ ${items.length - completed} รายการ` : `${items.length - completed} requirement${items.length - completed === 1 ? '' : 's'} remaining`)}</strong>
      </div>
      <small>{completed}/{items.length}</small>
    </header>
    <ul>
      {items.map((item) => <li className={item.complete ? 'is-complete' : 'is-incomplete'} key={item.label}>
        <Check size={17} aria-hidden="true" />
        <span>{item.label}</span>
      </li>)}
    </ul>
  </aside>
}
