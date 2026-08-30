import type { PropsWithChildren, ReactNode } from 'react'

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
  required,
  children,
}: PropsWithChildren<{ label: string; hint?: string; required?: boolean }>) {
  return (
    <label className="form-field">
      <span>
        {label} {required ? <em>REQUIRED</em> : null}
      </span>
      {hint ? <small>{hint}</small> : null}
      {children}
    </label>
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
  question: string
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
