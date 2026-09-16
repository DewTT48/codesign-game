import { describe, expect, it } from 'vitest'
import { evaluateAiReservation, type AiBudgetSnapshot } from './aiGuardrails'

const budget: AiBudgetSnapshot = {
  status: 'enabled',
  maxRequests: 10,
  usedRequests: 2,
  reservedRequests: 0,
  maxInputTokens: 1_000,
  usedInputTokens: 200,
  reservedInputTokens: 0,
  maxOutputTokens: 500,
  usedOutputTokens: 100,
  reservedOutputTokens: 0,
  maxTotalTokens: 1_500,
  maxCostMicros: 10_000,
  usedCostMicros: 2_000,
  reservedCostMicros: 0,
}

describe('AI cost guardrails', () => {
  it('allows a reservation inside every configured hard limit', () => {
    expect(evaluateAiReservation(budget, {
      estimatedInputTokens: 100,
      reservedOutputTokens: 100,
      reservedCostMicros: 1_000,
    })).toEqual({ allowed: true })
  })

  it('fails closed when allowance is disabled or a limit would be exceeded', () => {
    expect(evaluateAiReservation({ ...budget, status: 'disabled' }, {
      estimatedInputTokens: 1,
      reservedOutputTokens: 1,
      reservedCostMicros: 1,
    })).toEqual({ allowed: false, reason: 'allowance_disabled' })

    expect(evaluateAiReservation(budget, {
      estimatedInputTokens: 801,
      reservedOutputTokens: 1,
      reservedCostMicros: 1,
    })).toEqual({ allowed: false, reason: 'input_token_limit' })

    expect(evaluateAiReservation(budget, {
      estimatedInputTokens: 1,
      reservedOutputTokens: 1,
      reservedCostMicros: 8_001,
    })).toEqual({ allowed: false, reason: 'cost_limit' })
  })

  it('rejects invalid reservation values before evaluating allowance', () => {
    expect(evaluateAiReservation(budget, {
      estimatedInputTokens: -1,
      reservedOutputTokens: 1,
      reservedCostMicros: 1,
    })).toEqual({ allowed: false, reason: 'invalid_reservation' })

    expect(evaluateAiReservation(budget, {
      estimatedInputTokens: 1,
      reservedOutputTokens: 0,
      reservedCostMicros: 1,
    })).toEqual({ allowed: false, reason: 'invalid_reservation' })
  })
})
