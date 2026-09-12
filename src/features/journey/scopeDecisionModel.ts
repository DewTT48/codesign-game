export type ScopeStatus = 'must-have' | 'non-goal'

export type ScopeLists = {
  mustHaves: string[]
  nonGoals: string[]
}

export type ScopeConflict = {
  text: string
  mustHaveIndex: number
  nonGoalIndex: number
}

export const SUGGESTED_MAX_MUST_HAVES = 8

export function normalizeScopeList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => typeof item === 'string' ? item : '')
    : []
}

export function moveScopeDecision(
  lists: ScopeLists,
  from: ScopeStatus,
  index: number,
  to: ScopeStatus,
): ScopeLists {
  if (from === to) return lists

  const source = from === 'must-have' ? lists.mustHaves : lists.nonGoals
  const item = source[index]
  if (item === undefined) return lists
  return from === 'must-have'
    ? {
        mustHaves: lists.mustHaves.filter((_, itemIndex) => itemIndex !== index),
        nonGoals: [...lists.nonGoals, item],
      }
    : {
        mustHaves: [...lists.mustHaves, item],
        nonGoals: lists.nonGoals.filter((_, itemIndex) => itemIndex !== index),
      }
}

export function findExactScopeConflicts(mustHaves: string[], nonGoals: string[]): ScopeConflict[] {
  const nonGoalsByText = new Map<string, { text: string; index: number }>()
  nonGoals.forEach((text, index) => {
    const normalized = normalizeScopeText(text)
    if (normalized && !nonGoalsByText.has(normalized)) nonGoalsByText.set(normalized, { text: text.trim(), index })
  })

  const seen = new Set<string>()
  return mustHaves.flatMap((text, mustHaveIndex) => {
    const normalized = normalizeScopeText(text)
    const match = nonGoalsByText.get(normalized)
    if (!normalized || !match || seen.has(normalized)) return []
    seen.add(normalized)
    return [{ text: text.trim() || match.text, mustHaveIndex, nonGoalIndex: match.index }]
  })
}

function normalizeScopeText(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
