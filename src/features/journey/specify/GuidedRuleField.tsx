import { AlertTriangle } from 'lucide-react'

type Props = {
  id: string
  title: string
  question: string
  value: string
  examples: string[]
  advisory?: string
  isThai: boolean
  onChange: (value: string) => void
}

export function GuidedRuleField({ id, title, question, value, examples, advisory, isThai, onChange }: Props) {
  return (
    <section className="guided-rule-field">
      <header>
        <div className="guided-rule-field__title">
          <h4>{title}</h4>
          <span>{isThai ? 'จำเป็น' : 'REQUIRED'}</span>
        </div>
        <p>{question}</p>
      </header>
      <div className="guided-rule-field__examples">
        <span>{isThai ? 'ตัวอย่างเพื่อช่วยเริ่ม — กดแล้วแก้ต่อได้' : 'STARTING POINTS — SELECT ONE, THEN EDIT IT'}</span>
        <div>
          {examples.map((example) => (
            <button key={example} type="button" onClick={() => onChange(example)}>{example}</button>
          ))}
        </div>
      </div>
      <div className="guided-rule-field__answer">
        <label htmlFor={id}><span>{isThai ? 'กติกาของ Product นี้' : 'RULE FOR THIS PRODUCT'}</span></label>
        <textarea id={id} rows={3} required aria-describedby={advisory ? `${id}-advisory` : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
        {advisory ? <p id={`${id}-advisory`} className="guided-rule-field__advisory" role="status"><AlertTriangle size={18} /> {advisory}</p> : null}
      </div>
    </section>
  )
}
