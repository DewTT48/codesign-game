export type AiBudgetSnapshot = {
  status: 'disabled' | 'enabled' | 'exhausted'
  maxRequests: number
  usedRequests: number
  reservedRequests: number
  maxInputTokens: number
  usedInputTokens: number
  reservedInputTokens: number
  maxOutputTokens: number
  usedOutputTokens: number
  reservedOutputTokens: number
  maxTotalTokens: number
  maxCostMicros: number
  usedCostMicros: number
  reservedCostMicros: number
}

export type AiReservation = {
  estimatedInputTokens: number
  reservedOutputTokens: number
  reservedCostMicros: number
}

export type AiReservationDecision =
  | { allowed: true }
  | {
      allowed: false
      reason:
        | 'invalid_reservation'
        | 'allowance_disabled'
        | 'allowance_exhausted'
        | 'request_limit'
        | 'input_token_limit'
        | 'output_token_limit'
        | 'total_token_limit'
        | 'cost_limit'
    }

export function evaluateAiReservation(
  budget: AiBudgetSnapshot,
  reservation: AiReservation,
): AiReservationDecision {
  if (
    !Number.isSafeInteger(reservation.estimatedInputTokens)
    || !Number.isSafeInteger(reservation.reservedOutputTokens)
    || !Number.isSafeInteger(reservation.reservedCostMicros)
    || reservation.estimatedInputTokens < 0
    || reservation.reservedOutputTokens <= 0
    || reservation.reservedCostMicros < 0
  ) {
    return { allowed: false, reason: 'invalid_reservation' }
  }

  if (budget.status === 'disabled') return { allowed: false, reason: 'allowance_disabled' }
  if (budget.status === 'exhausted') return { allowed: false, reason: 'allowance_exhausted' }
  if (budget.usedRequests + budget.reservedRequests + 1 > budget.maxRequests) {
    return { allowed: false, reason: 'request_limit' }
  }
  if (
    budget.usedInputTokens
      + budget.reservedInputTokens
      + reservation.estimatedInputTokens
    > budget.maxInputTokens
  ) {
    return { allowed: false, reason: 'input_token_limit' }
  }
  if (
    budget.usedOutputTokens
      + budget.reservedOutputTokens
      + reservation.reservedOutputTokens
    > budget.maxOutputTokens
  ) {
    return { allowed: false, reason: 'output_token_limit' }
  }
  if (
    budget.usedInputTokens
      + budget.usedOutputTokens
      + budget.reservedInputTokens
      + budget.reservedOutputTokens
      + reservation.estimatedInputTokens
      + reservation.reservedOutputTokens
    > budget.maxTotalTokens
  ) {
    return { allowed: false, reason: 'total_token_limit' }
  }
  if (
    budget.usedCostMicros
      + budget.reservedCostMicros
      + reservation.reservedCostMicros
    > budget.maxCostMicros
  ) {
    return { allowed: false, reason: 'cost_limit' }
  }
  return { allowed: true }
}
