import type { Json } from '../../../lib/supabase/database.types'
import { countChangedLines, prdFiles, type PrdDrafts, type PrdFileKey } from './prdPackage'
import { getUiReviewForwardPlan, getUiReviewResolutionAnswers } from './uiReview'

export type UiReviewFileEvidence = {
  changed: boolean
  beforeCharacters: number
  afterCharacters: number
  changedLines: number
  beforeFingerprint: string
  afterFingerprint: string
}

export type UiReviewFinalizationEvidence = {
  schemaVersion: 1
  version: number
  finalizedAt: string
  files: Record<PrdFileKey, UiReviewFileEvidence>
}

export type UiReviewIntegrityCheck = {
  status: 'checking' | 'valid' | 'invalid'
  errors: string[]
  warnings: string[]
}

const emptyIntegrityCheck: UiReviewIntegrityCheck = {
  status: 'checking',
  errors: [],
  warnings: [],
}

function fallbackFingerprint(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}-${value.length}`
}

export async function fingerprintText(value: string) {
  if (!globalThis.crypto?.subtle) return fallbackFingerprint(value)
  const buffer = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const digest = Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `sha256-${digest}`
}

export async function createUiReviewFinalizationEvidence(
  before: PrdDrafts,
  after: PrdDrafts,
  version = 1,
  finalizedAt = new Date().toISOString(),
): Promise<UiReviewFinalizationEvidence> {
  const entries = await Promise.all(prdFiles.map(async ({ key }) => {
    const [beforeFingerprint, afterFingerprint] = await Promise.all([
      fingerprintText(before[key]),
      fingerprintText(after[key]),
    ])
    return [key, {
      changed: before[key] !== after[key],
      beforeCharacters: before[key].length,
      afterCharacters: after[key].length,
      changedLines: countChangedLines(before[key], after[key]),
      beforeFingerprint,
      afterFingerprint,
    }] as const
  }))

  return {
    schemaVersion: 1,
    version,
    finalizedAt,
    files: Object.fromEntries(entries) as Record<PrdFileKey, UiReviewFileEvidence>,
  }
}

function isFileEvidence(value: unknown): value is UiReviewFileEvidence {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return typeof record.changed === 'boolean'
    && typeof record.beforeCharacters === 'number'
    && typeof record.afterCharacters === 'number'
    && typeof record.changedLines === 'number'
    && typeof record.beforeFingerprint === 'string'
    && typeof record.afterFingerprint === 'string'
}

export function parseUiReviewFinalizationEvidence(value: Json | undefined): UiReviewFinalizationEvidence | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, Json | undefined>
  const files = record.files
  if (record.schemaVersion !== 1 || typeof record.version !== 'number' || typeof record.finalizedAt !== 'string') return null
  if (!files || typeof files !== 'object' || Array.isArray(files)) return null
  const fileRecord = files as Record<string, Json | undefined>
  if (!prdFiles.every(({ key }) => isFileEvidence(fileRecord[key]))) return null
  return value as unknown as UiReviewFinalizationEvidence
}

export function uiReviewFinalizationEvidenceToJson(evidence: UiReviewFinalizationEvidence): Json {
  return evidence as unknown as Json
}

export function checkingUiReviewIntegrity(): UiReviewIntegrityCheck {
  return { ...emptyIntegrityCheck }
}

export async function validateUiReviewFinalization(
  files: PrdDrafts,
  evidence: UiReviewFinalizationEvidence,
  review: string,
  resolution: string,
): Promise<UiReviewIntegrityCheck> {
  const errors: string[] = []
  const warnings: string[] = []
  const marker = /##\s+CODESIGN UI Review\s+—\s+Owner Approved/i
  const resolutionAnswers = getUiReviewResolutionAnswers(review, resolution)
  const plan = getUiReviewForwardPlan(review)

  if (!marker.test(files.handoff)) errors.push('CODESIGN_HANDOFF.md ยังไม่มีส่วน UI Review ที่อนุมัติแล้ว')
  if (!marker.test(files.experienceDirection)) errors.push('EXPERIENCE_DIRECTION.md ยังไม่มีส่วน UI Review ที่อนุมัติแล้ว')

  const currentFingerprints = Object.fromEntries(await Promise.all(prdFiles.map(async ({ key }) => [key, await fingerprintText(files[key])] as const))) as Record<PrdFileKey, string>
  if (currentFingerprints.handoff === evidence.files.handoff.beforeFingerprint) errors.push('CODESIGN_HANDOFF.md ยังไม่เปลี่ยนจากฉบับก่อน Prototype')
  if (currentFingerprints.experienceDirection === evidence.files.experienceDirection.beforeFingerprint) errors.push('EXPERIENCE_DIRECTION.md ยังไม่เปลี่ยนจากฉบับก่อน Prototype')
  if (currentFingerprints.contentPack !== evidence.files.contentPack.beforeFingerprint) errors.push('CONTENT_PACK.md เปลี่ยนจากฉบับที่อนุมัติก่อน Prototype')

  for (const item of plan.ownerQuestions) {
    const answer = resolutionAnswers[item.id]
    if (!answer) {
      errors.push(`ยังไม่พบบันทึกคำตอบ ${item.id}`)
      continue
    }
    if (!files.handoff.includes(answer) || !files.experienceDirection.includes(answer)) {
      errors.push(`คำตอบ ${item.id} ยังไม่อยู่ครบใน Final PRD`)
    }
  }

  for (const key of ['handoff', 'experienceDirection'] as const) {
    if (currentFingerprints[key] !== evidence.files[key].afterFingerprint) {
      warnings.push(`${prdFiles.find((file) => file.key === key)?.fileName} มีการแก้ไขเพิ่มเติมหลัง Consolidate`)
    }
  }

  return {
    status: errors.length ? 'invalid' : 'valid',
    errors,
    warnings,
  }
}
