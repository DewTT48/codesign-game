import type { Json } from '../../../lib/supabase/database.types'

export const APPROVED_PROTOTYPE_FILE_NAME = 'APPROVED_PROTOTYPE.html'
export const MAX_APPROVED_PROTOTYPE_BYTES = 5 * 1024 * 1024

export type PrototypeIntegrityReference = {
  originalFileName: string
  sha256: string
}

export type ApprovedPrototypeArtifact = {
  schemaVersion: 1
  originalFileName: string
  canonicalFileName: typeof APPROVED_PROTOTYPE_FILE_NAME
  mediaType: 'text/html'
  sizeBytes: number
  sha256: string
  base64: string
}

export type ApprovedPrototypeCheck = {
  valid: boolean
  errors: string[]
  warnings: string[]
  reference: PrototypeIntegrityReference | null
}

function normalizeSha256(value: string) {
  return value.trim().toLowerCase().replace(/^sha256[-:]/, '')
}

function unquoteFileName(value: string) {
  return value.trim().replace(/^[`"']|[`"']$/g, '')
}

export function extractPrototypeIntegrityReference(markdown: string): PrototypeIntegrityReference | null {
  const source = markdown.replace(/\r\n/g, '\n')
  const hash = source.match(/SHA[\s-]?256[\s\S]{0,160}?([a-f0-9]{64})/i)?.[1]
  const labeledFileName = source.match(/(?:Approved prototype file|Prototype file|ไฟล์ต้นแบบ(?:ที่อนุมัติ)?)[^\n]*?(?:`([^`\n]+\.html)`|([\w./() -]+\.html))/i)
  const fallbackFileName = source.match(/`([^`\n]+\.html)`/i)?.[1]
  const originalFileName = unquoteFileName(labeledFileName?.[1] || labeledFileName?.[2] || fallbackFileName || '')

  if (!hash || !originalFileName) return null
  return { originalFileName, sha256: normalizeSha256(hash) }
}

export async function sha256Bytes(bytes: BufferSource) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 is not available in this browser.')
  const buffer = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

export function approvedPrototypeBytes(artifact: ApprovedPrototypeArtifact) {
  const binary = atob(artifact.base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export async function verifyApprovedPrototypeArtifact(artifact: ApprovedPrototypeArtifact) {
  try {
    const bytes = approvedPrototypeBytes(artifact)
    return bytes.byteLength === artifact.sizeBytes && await sha256Bytes(bytes) === artifact.sha256
  } catch {
    return false
  }
}

export async function createApprovedPrototypeArtifact(file: File): Promise<ApprovedPrototypeArtifact> {
  if (!/\.html?$/i.test(file.name)) throw new Error('APPROVED_PROTOTYPE_MUST_BE_HTML')
  if (file.size > MAX_APPROVED_PROTOTYPE_BYTES) throw new Error('APPROVED_PROTOTYPE_TOO_LARGE')
  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > MAX_APPROVED_PROTOTYPE_BYTES) throw new Error('APPROVED_PROTOTYPE_TOO_LARGE')
  return {
    schemaVersion: 1,
    originalFileName: file.name,
    canonicalFileName: APPROVED_PROTOTYPE_FILE_NAME,
    mediaType: 'text/html',
    sizeBytes: bytes.byteLength,
    sha256: await sha256Bytes(bytes),
    base64: bytesToBase64(new Uint8Array(bytes)),
  }
}

export function validateApprovedPrototype(
  review: string,
  artifact: ApprovedPrototypeArtifact | null,
): ApprovedPrototypeCheck {
  const errors: string[] = []
  const warnings: string[] = []
  const reference = extractPrototypeIntegrityReference(review)

  if (!reference) errors.push('UI Review ต้องระบุชื่อไฟล์ HTML และ SHA-256 ของ Prototype ที่อนุมัติ')
  if (!artifact) errors.push('ยังไม่ได้อัปโหลด HTML Prototype ที่อนุมัติ')
  if (reference && artifact) {
    if (normalizeSha256(artifact.sha256) !== reference.sha256) {
      errors.push('SHA-256 ของ HTML ไม่ตรงกับค่าที่ระบุใน UI Review')
    }
    if (artifact.originalFileName !== reference.originalFileName) {
      warnings.push(`ชื่อไฟล์ที่อัปโหลดต่างจาก UI Review (${reference.originalFileName}) แต่ยืนยันตัวตนด้วย SHA-256 ได้`)
    }
  }

  return { valid: errors.length === 0, errors, warnings, reference }
}

export function parseApprovedPrototypeArtifact(value: Json | undefined): ApprovedPrototypeArtifact | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, Json | undefined>
  if (record.schemaVersion !== 1
    || typeof record.originalFileName !== 'string'
    || record.canonicalFileName !== APPROVED_PROTOTYPE_FILE_NAME
    || record.mediaType !== 'text/html'
    || typeof record.sizeBytes !== 'number'
    || typeof record.sha256 !== 'string'
    || typeof record.base64 !== 'string') return null
  return value as unknown as ApprovedPrototypeArtifact
}

export function approvedPrototypeArtifactToJson(artifact: ApprovedPrototypeArtifact): Json {
  return artifact as unknown as Json
}

export function approvedPrototypeBlob(artifact: ApprovedPrototypeArtifact) {
  return new Blob([approvedPrototypeBytes(artifact)], { type: 'text/html;charset=utf-8' })
}
