import { webcrypto } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  APPROVED_PROTOTYPE_FILE_NAME,
  approvedPrototypeBlob,
  approvedPrototypeBytes,
  createApprovedPrototypeArtifact,
  extractPrototypeIntegrityReference,
  sha256Bytes,
  validateApprovedPrototype,
  verifyApprovedPrototypeArtifact,
  type ApprovedPrototypeArtifact,
} from './approvedPrototype'

const html = '<h1>Approved</h1>'
const digest = '14d5fd07c417bd6bb68e21590cb26f47bbcbc248a32052f9be1585f599c27c46'

beforeAll(() => {
  if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
})

const artifact: ApprovedPrototypeArtifact = {
  schemaVersion: 1,
  originalFileName: 'prototype-v4.html',
  canonicalFileName: APPROVED_PROTOTYPE_FILE_NAME,
  mediaType: 'text/html',
  sizeBytes: new TextEncoder().encode(html).byteLength,
  sha256: digest,
  base64: btoa(html),
}

describe('Approved Prototype custody', () => {
  it('extracts the machine-readable filename and SHA-256', () => {
    const review = `## Prototype Integrity
- **Approved prototype file:** \`prototype-v4.html\`
- **SHA-256:** \`${digest}\``

    expect(extractPrototypeIntegrityReference(review)).toEqual({
      originalFileName: 'prototype-v4.html',
      sha256: digest,
    })
  })

  it('supports the legacy review format used by existing projects', () => {
    const review = `**ไฟล์ต้นแบบ:** \`prototype-v4.html\`

SHA-256 ของ HTML ที่ตรวจ:
\`${digest}\``

    expect(extractPrototypeIntegrityReference(review)?.sha256).toBe(digest)
  })

  it('hashes raw bytes and rejects a mismatched artifact', async () => {
    expect(await sha256Bytes(new TextEncoder().encode(html))).toBe(digest)

    const review = `## Prototype Integrity
- **Approved prototype file:** \`prototype-v4.html\`
- **SHA-256:** \`${'0'.repeat(64)}\``
    const check = validateApprovedPrototype(review, artifact)
    expect(check.valid).toBe(false)
    expect(check.errors).toContain('SHA-256 ของ HTML ไม่ตรงกับค่าที่ระบุใน UI Review')
  })

  it('preserves the exact uploaded bytes through storage and export', async () => {
    const sourceBytes = new TextEncoder().encode('\ufeff<!doctype html>\r\n<meta charset="utf-8">\r\n<h1>สวัสดี</h1>\r\n')
    const file = {
      name: 'approved-thai-v16.html',
      size: sourceBytes.byteLength,
      arrayBuffer: async () => sourceBytes.buffer.slice(
        sourceBytes.byteOffset,
        sourceBytes.byteOffset + sourceBytes.byteLength,
      ),
    } as File

    const stored = await createApprovedPrototypeArtifact(file)
    const exportedBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(reader.error)
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.readAsArrayBuffer(approvedPrototypeBlob(stored))
    })
    const exportedBytes = new Uint8Array(exportedBuffer)

    expect(Array.from(approvedPrototypeBytes(stored))).toEqual(Array.from(sourceBytes))
    expect(Array.from(exportedBytes)).toEqual(Array.from(sourceBytes))
    expect(await sha256Bytes(exportedBytes)).toBe(stored.sha256)
    expect(await verifyApprovedPrototypeArtifact(stored)).toBe(true)
  })

  it('detects byte tampering even when the stored metadata is unchanged', async () => {
    const changed = {
      ...artifact,
      base64: btoa('<h1>Tampered</h1>'),
    }

    expect(await verifyApprovedPrototypeArtifact(changed)).toBe(false)
  })
})
