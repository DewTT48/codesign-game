import type { PropsWithChildren, ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { getFieldGuide, type FieldGuide } from './guidanceContent'

export function PhaseSection({
  step,
  title,
  description,
  children,
}: PropsWithChildren<{ step: string; title: string; description?: string }>) {
  return (
    <section className="phase-section">
      <header>
        <span>{step}</span>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      <div className="phase-section__body">{children}</div>
    </section>
  )
}

export function FormField({
  label,
  hint,
  guideKey,
  required,
  children,
}: PropsWithChildren<{ label: string; hint?: string; guideKey?: string; required?: boolean }>) {
  const { language, isThai } = useLanguage()
  const guide = getFieldGuide(language, guideKey)

  return (
    <div className="form-field">
      <label className="form-field__control">
        <span>
          {label} {required ? <em>REQUIRED</em> : null}
        </span>
        {guide ? <p className="form-field__question">{guide.question}</p> : null}
        {hint ? <small>{hint}</small> : null}
        {children}
      </label>
      {guide ? <FieldGuideDetails guide={guide} label={isThai ? 'วิธีตอบและตัวอย่าง' : 'How to answer'} isThai={isThai} /> : null}
    </div>
  )
}

export function FieldGuideDetails({ guide, label, isThai }: { guide: FieldGuide; label: string; isThai: boolean }) {
  return (
    <details className="field-guide">
      <summary>{label}</summary>
      {guide.why ? <p><strong>{isThai ? 'ทำไมจึงสำคัญ' : 'Why it matters'}</strong>{guide.why}</p> : null}
      <p><strong>{isThai ? 'ตัวอย่าง' : 'Example'}</strong>{guide.example}</p>
      {guide.avoid ? <p className="field-guide__avoid"><strong>{isThai ? 'ควรหลีกเลี่ยง' : 'Avoid'}</strong>{guide.avoid}</p> : null}
    </details>
  )
}

export function ChoiceCard({
  active,
  title,
  description,
  children,
}: PropsWithChildren<{
  active: boolean
  title: string
  description?: string
}>) {
  return (
    <span className={`choice-card ${active ? 'is-active' : ''}`}>
      <span className="choice-card__mark" aria-hidden="true" />
      <span>
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      {children}
    </span>
  )
}

export function ReviewGate({
  title,
  question,
  children,
  actions,
}: PropsWithChildren<{
  title: string
  question: ReactNode
  actions: ReactNode
}>) {
  return (
    <section className="review-gate">
      <span>{title}</span>
      <h2>{question}</h2>
      <div className="review-gate__summary">{children}</div>
      <div className="review-gate__actions">{actions}</div>
    </section>
  )
}
