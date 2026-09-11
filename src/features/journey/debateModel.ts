import type { Json } from '../../lib/supabase/database.types'

export type DebateStance = '' | 'agree' | 'challenge'
export type DebateOutcome =
  | ''
  | 'OUR DIRECTION STAYED THE SAME'
  | 'WE REFINED OUR DIRECTION'
  | 'WE CHANGED OUR DIRECTION'

export type DebateAssumption = {
  text: string
  stance: DebateStance
  agreeReason: string
  challengeReason: string
  change: string
}

type DebateRecord = Record<string, Json | undefined>

export const debateOutcomes: Exclude<DebateOutcome, ''>[] = [
  'OUR DIRECTION STAYED THE SAME',
  'WE REFINED OUR DIRECTION',
  'WE CHANGED OUR DIRECTION',
]

export const blankDebateAssumption = (): DebateAssumption => ({
  text: '',
  stance: '',
  agreeReason: '',
  challengeReason: '',
  change: '',
})

const stringValue = (value: unknown) => typeof value === 'string' ? value : ''

export function normalizeDebateOutcome(value: unknown): DebateOutcome {
  return debateOutcomes.includes(value as Exclude<DebateOutcome, ''>)
    ? value as DebateOutcome
    : ''
}

export function normalizeDebateAssumption(value: unknown): DebateAssumption {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  const stance: DebateStance = record.stance === 'agree' || record.stance === 'challenge'
    ? record.stance
    : ''
  const legacyReason = stringValue(record.why)

  return {
    text: stringValue(record.text),
    stance,
    agreeReason: stringValue(record.agreeReason) || (stance === 'agree' ? legacyReason : ''),
    challengeReason: stringValue(record.challengeReason) || (stance === 'challenge' ? legacyReason : ''),
    change: stringValue(record.change),
  }
}

export function normalizeDebateAssumptions(value: unknown): DebateAssumption[] {
  return Array.isArray(value) ? value.map(normalizeDebateAssumption) : []
}

export function debateReason(assumption: DebateAssumption) {
  return assumption.stance === 'agree'
    ? assumption.agreeReason
    : assumption.stance === 'challenge'
      ? assumption.challengeReason
      : ''
}

export function withDebateStance(value: unknown, stance: Exclude<DebateStance, ''>) {
  const assumption = normalizeDebateAssumption(value)
  return {
    ...assumption,
    stance,
  } satisfies DebateAssumption
}

export function withDebateReason(value: unknown, reason: string) {
  const assumption = normalizeDebateAssumption(value)
  if (assumption.stance === 'agree') return { ...assumption, agreeReason: reason }
  if (assumption.stance === 'challenge') return { ...assumption, challengeReason: reason }
  return assumption
}

export function debateOutcomeLabel(outcome: unknown, language: 'th' | 'en') {
  const normalized = normalizeDebateOutcome(outcome)
  const labels: Record<Exclude<DebateOutcome, ''>, { th: string; en: string }> = {
    'OUR DIRECTION STAYED THE SAME': { th: 'ใช้ Direction เดิมต่อ', en: 'KEEP THE CURRENT DIRECTION' },
    'WE REFINED OUR DIRECTION': { th: 'ใช้ Direction เดิม แต่ปรับบางส่วน', en: 'REFINE THE CURRENT DIRECTION' },
    'WE CHANGED OUR DIRECTION': { th: 'เปลี่ยน Direction', en: 'CHANGE THE DIRECTION' },
  }
  return normalized ? labels[normalized][language] : ''
}

export function debateDecisionLines(value: unknown, language: 'th' | 'en') {
  return normalizeDebateAssumptions(value)
    .filter((assumption) => assumption.text.trim())
    .map((assumption, index) => {
      const reason = debateReason(assumption).trim()
      if (language === 'th') {
        const decision = assumption.stance === 'agree' ? 'เดินหน้าต่อชั่วคราว' : assumption.stance === 'challenge' ? 'ปรับ Direction' : 'ยังไม่ตัดสินใจ'
        const reasonText = reason ? ` — เหตุผล: ${reason}` : ''
        const changeText = assumption.stance === 'challenge' && assumption.change.trim() ? ` — สิ่งที่จะเปลี่ยน: ${assumption.change.trim()}` : ''
        return `${index + 1}. ${assumption.text.trim()} — ${decision}${reasonText}${changeText}`
      }
      const decision = assumption.stance === 'agree' ? 'Proceed for now' : assumption.stance === 'challenge' ? 'Adjust the direction' : 'Not decided'
      const reasonText = reason ? ` — Reason: ${reason}` : ''
      const changeText = assumption.stance === 'challenge' && assumption.change.trim() ? ` — Change: ${assumption.change.trim()}` : ''
      return `${index + 1}. ${assumption.text.trim()} — ${decision}${reasonText}${changeText}`
    })
}

export function buildDebateSummary(
  assumptions: unknown,
  outcome: unknown,
  language: 'th' | 'en',
) {
  const outcomeLabel = debateOutcomeLabel(outcome, language)
  const lines = debateDecisionLines(assumptions, language)
  if (!outcomeLabel && !lines.length) return ''

  if (language === 'th') {
    return [outcomeLabel ? `ผลต่อ Direction: ${outcomeLabel}` : '', ...lines].filter(Boolean).join('\n')
  }
  return [outcomeLabel ? `Direction outcome: ${outcomeLabel}` : '', ...lines].filter(Boolean).join('\n')
}

export function resolveDebateSummary(debate: DebateRecord, language: 'th' | 'en') {
  const generated = buildDebateSummary(debate.assumptions, debate.directionResult, language)
  const saved = stringValue(debate.whatChanged).trim()
  if (debate.summaryCustomized === true) return saved || generated
  // Projects completed before automatic summaries existed have no marker. Keep
  // their owner-written conclusion instead of silently replacing it.
  if (debate.summaryCustomized === undefined && saved) return saved
  return generated || saved
}

export function debateDecisionMarkdown(value: unknown, language: 'th' | 'en') {
  const lines = debateDecisionLines(value, language)
  return lines.length ? lines.map((line) => `- ${line.replace(/^\d+\.\s*/, '')}`).join('\n') : '- Not recorded'
}
