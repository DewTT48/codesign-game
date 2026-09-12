type Props = {
  id: string
  title: string
  question: string
  value: string
  examples: string[]
  isThai: boolean
  onChange: (value: string) => void
}

export function GuidedRuleField({ id, title, question, value, examples, isThai, onChange }: Props) {
  return (
    <section className="guided-rule-field">
      <header>
        <div className="guided-rule-field__title">
          <label htmlFor={id}>{title}</label>
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
      <label className="guided-rule-field__answer" htmlFor={id}>
        <span>{isThai ? 'กติกาของ Product นี้' : 'RULE FOR THIS PRODUCT'}</span>
        <textarea id={id} rows={3} required value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
    </section>
  )
}
