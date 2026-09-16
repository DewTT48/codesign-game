export type BillingMode = 'test'

export type PassPurchaseStatus =
  | 'checkout_created'
  | 'payment_pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'disputed'

/**
 * Phase 1 intentionally exposes no price or checkout implementation. Those values
 * stay server-side and are decision-gated before the Stripe Test Mode phase.
 */
export const billingMode: BillingMode = 'test'
