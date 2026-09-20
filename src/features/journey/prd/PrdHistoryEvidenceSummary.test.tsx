import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Json } from '../../../lib/supabase/database.types'
import { PrdHistoryEvidenceSummary } from './PrdHistoryEvidenceSummary'

const evidence = {
  schemaVersion: 2,
  version: 2,
  finalizedAt: '2026-09-20T02:36:28.989Z',
  files: {
    handoff: { changed: true, beforeCharacters: 10, afterCharacters: 20, changedLines: 2, beforeFingerprint: 'before-handoff', afterFingerprint: 'after-handoff' },
    contentPack: { changed: false, beforeCharacters: 30, afterCharacters: 30, changedLines: 0, beforeFingerprint: 'content', afterFingerprint: 'content' },
    experienceDirection: { changed: true, beforeCharacters: 10, afterCharacters: 22, changedLines: 4, beforeFingerprint: 'before-experience', afterFingerprint: 'after-experience' },
  },
  prototype: {
    originalFileName: 'prototype.html',
    canonicalFileName: 'APPROVED_PROTOTYPE.html',
    sizeBytes: 122336,
    expectedSha256: 'same-hash',
    actualSha256: 'same-hash',
  },
} as unknown as Json

describe('PrdHistoryEvidenceSummary', () => {
  it('explains the outcome without exposing raw fingerprints', () => {
    render(<PrdHistoryEvidenceSummary value={evidence} isThai />)

    expect(screen.getByText('Final PRD พร้อมใช้สร้าง App แล้ว')).toBeInTheDocument()
    expect(screen.getByText(/CONTENT_PACK\.md ยังคงเนื้อหา/)).toBeInTheDocument()
    expect(screen.queryByText('before-handoff')).not.toBeInTheDocument()
    expect(screen.queryByText('same-hash')).not.toBeInTheDocument()
  })
})
