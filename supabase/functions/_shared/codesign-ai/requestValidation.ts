import {
  codesignAiActions,
  type CodesignAiAction,
  type CodesignAiLocale,
  type JsonValue,
} from './promptAssembly.ts'

export type CodesignAiRequestBody = {
  projectId: string
  action: CodesignAiAction
  userDraft: JsonValue
  locale: CodesignAiLocale
  idempotencyKey: string
}

export type CodesignAiRequestValidation =
  | { success: true; data: CodesignAiRequestBody }
  | { success: false; error: string }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true
  if (['string', 'boolean'].includes(typeof value)) return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isJsonValue)
  if (typeof value !== 'object') return false
  return Object.values(value).every(isJsonValue)
}

export function validateCodesignAiRequest(value: unknown): CodesignAiRequestValidation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { success: false, error: 'Request body must be a JSON object.' }
  }

  const body = value as Record<string, unknown>
  const allowedKeys = new Set(['projectId', 'action', 'userDraft', 'locale', 'idempotencyKey'])
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    return { success: false, error: 'Request body contains unsupported fields.' }
  }
  if (typeof body.projectId !== 'string' || !uuidPattern.test(body.projectId)) {
    return { success: false, error: 'A valid Project ID is required.' }
  }
  if (typeof body.action !== 'string' || !codesignAiActions.includes(body.action as CodesignAiAction)) {
    return { success: false, error: 'Unsupported AI action.' }
  }
  if (body.locale !== 'th' && body.locale !== 'en') {
    return { success: false, error: 'Locale must be th or en.' }
  }
  if (!isJsonValue(body.userDraft)) {
    return { success: false, error: 'User draft must be valid JSON data.' }
  }
  if (JSON.stringify(body.userDraft).length > 100_000) {
    return { success: false, error: 'User draft exceeds the 100,000 character limit.' }
  }
  if (
    typeof body.idempotencyKey !== 'string'
    || body.idempotencyKey.trim().length < 8
    || body.idempotencyKey.trim().length > 200
  ) {
    return { success: false, error: 'A valid idempotency key is required.' }
  }

  return {
    success: true,
    data: {
      projectId: body.projectId,
      action: body.action as CodesignAiAction,
      userDraft: body.userDraft,
      locale: body.locale,
      idempotencyKey: body.idempotencyKey.trim(),
    },
  }
}
