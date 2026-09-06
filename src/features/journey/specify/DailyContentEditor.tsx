import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { isDailyContentComplete, type DailyContent } from './specifyModel'

export function DailyContentEditor({ days, onChange }: { days: DailyContent[]; onChange: (days: DailyContent[]) => void }) {
  const { isThai } = useLanguage()
  const [selectedDay, setSelectedDay] = useState(1)
  const current = days[selectedDay - 1]

  const update = (field: keyof Omit<DailyContent, 'day'>, value: string | boolean) => {
    onChange(days.map((day) => day.day === selectedDay ? { ...day, [field]: value, reviewed: field === 'reviewed' ? Boolean(value) : false } : day))
  }

  const fields: Array<{
    key: keyof Omit<DailyContent, 'day' | 'reviewed'>
    label: string
    question: string
    rows: number
  }> = isThai ? [
    { key: 'title', label: 'หัวข้อวันนี้', question: 'ชื่อสั้น ๆ ที่ช่วยให้ผู้ใช้รู้ว่าวันนี้จะทำอะไร', rows: 1 },
    { key: 'objective', label: 'เป้าหมาย', question: 'เมื่อจบวันนี้ ผู้ใช้ควรเข้าใจหรือทำอะไรได้', rows: 2 },
    { key: 'content', label: 'เนื้อหาสั้น ๆ', question: 'ให้ความรู้หรือบริบทเท่าที่จำเป็นก่อนทำแบบฝึก', rows: 5 },
    { key: 'exercise', label: 'แบบฝึก', question: 'ผู้ใช้ต้องคิด เลือก หรือทำอะไรจริง', rows: 4 },
    { key: 'reflection', label: 'คำถามสะท้อนคิด', question: 'คำถามใดช่วยให้ผู้ใช้ตีความสิ่งที่เพิ่งทำ', rows: 3 },
    { key: 'record', label: 'สิ่งที่ต้องบันทึก', question: 'แอปต้องเก็บคำตอบหรือหลักฐานอะไรจากวันนี้', rows: 2 },
    { key: 'completion', label: 'เงื่อนไขสำเร็จ', question: 'ทำอะไรแล้วจึงถือว่าจบวันนี้', rows: 2 },
    { key: 'duration', label: 'เวลาที่ใช้', question: 'ระบุเวลาประมาณ เช่น 5–10 นาที', rows: 1 },
  ] : [
    { key: 'title', label: 'DAY TITLE', question: 'A short name that sets an expectation for today.', rows: 1 },
    { key: 'objective', label: 'OBJECTIVE', question: 'What should the user understand or do by the end?', rows: 2 },
    { key: 'content', label: 'SHORT CONTENT', question: 'Give only the context needed before the exercise.', rows: 5 },
    { key: 'exercise', label: 'EXERCISE', question: 'What will the user think, choose, or do?', rows: 4 },
    { key: 'reflection', label: 'REFLECTION', question: 'What question helps the user interpret the activity?', rows: 3 },
    { key: 'record', label: 'WHAT TO RECORD', question: 'What answer or evidence must the app save?', rows: 2 },
    { key: 'completion', label: 'COMPLETION RULE', question: 'What makes this day complete?', rows: 2 },
    { key: 'duration', label: 'DURATION', question: 'Give an estimate such as 5–10 minutes.', rows: 1 },
  ]

  return (
    <div className="daily-content-editor">
      <div className="day-picker" aria-label={isThai ? 'เลือกวันที่จะแก้ไข' : 'Choose a day to edit'}>
        {days.map((day) => {
          const complete = isDailyContentComplete(day)
          return (
            <button
              className={`${selectedDay === day.day ? 'is-active ' : ''}${complete ? 'is-complete ' : ''}${day.reviewed ? 'is-reviewed' : ''}`.trim()}
              type="button"
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              aria-label={`${isThai ? 'วันที่' : 'Day'} ${day.day}${complete ? ` — ${isThai ? 'ข้อมูลครบ' : 'complete'}` : ''}`}
            >
              {String(day.day).padStart(2, '0')}
              {day.reviewed ? <Check size={12} aria-hidden="true" /> : null}
            </button>
          )
        })}
      </div>

      <article className="day-editor-card">
        <header>
          <div><span>{isThai ? 'วันที่' : 'DAY'} {String(current.day).padStart(2, '0')}</span><h3>{current.title || (isThai ? 'ยังไม่มีชื่อวันนี้' : 'UNTITLED DAY')}</h3></div>
          <span className={isDailyContentComplete(current) ? 'day-status is-complete' : 'day-status'}>
            {isDailyContentComplete(current) ? (isThai ? 'ข้อมูลครบ' : 'COMPLETE') : (isThai ? 'ยังไม่ครบ' : 'INCOMPLETE')}
          </span>
        </header>
        <div className="day-editor-fields">
          {fields.map((field) => (
            <label key={field.key}>
              <strong>{field.label}</strong>
              <small>{field.question}</small>
              <textarea rows={field.rows} value={current[field.key]} onChange={(event) => update(field.key, event.target.value)} />
            </label>
          ))}
        </div>
        <footer>
          <button type="button" disabled={selectedDay === 1} onClick={() => setSelectedDay((day) => day - 1)}><ChevronLeft size={17} /> {isThai ? 'วันก่อนหน้า' : 'PREVIOUS'}</button>
          <button
            type="button"
            disabled={!isDailyContentComplete(current)}
            className={current.reviewed ? 'is-reviewed' : ''}
            onClick={() => update('reviewed', !current.reviewed)}
          >
            <Check size={17} /> {current.reviewed ? (isThai ? 'ตรวจแล้ว' : 'REVIEWED') : (isThai ? 'ยืนยันวันนี้' : 'MARK REVIEWED')}
          </button>
          <button type="button" disabled={selectedDay === 21} onClick={() => setSelectedDay((day) => day + 1)}>{isThai ? 'วันถัดไป' : 'NEXT'} <ChevronRight size={17} /></button>
        </footer>
      </article>
    </div>
  )
}
