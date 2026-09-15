import { describe, expect, it } from 'vitest'
import {
  buildUpdateIsReady,
  buildUpdatePrompt,
  mergeBuildUpdateDocuments,
  normalizeBuildUpdateDocuments,
} from './buildUpdateModel'

describe('build update model', () => {
  it('keeps valid Markdown documents and ignores malformed entries', () => {
    expect(normalizeBuildUpdateDocuments([
      { name: 'BUILD.md', content: '# Build', size: 7 },
      { name: 'notes.txt', content: 'skip', size: 4 },
      null,
    ])).toEqual([{ name: 'BUILD.md', content: '# Build', size: 7 }])
  })

  it('replaces a same-name document without requiring a fixed file set', () => {
    const result = mergeBuildUpdateDocuments(
      [{ name: 'BUILD.md', content: 'old', size: 3 }],
      [{ name: 'build.md', content: 'new', size: 3 }, { name: 'EVIDENCE.md', content: 'ok', size: 2 }],
    )
    expect(result).toEqual([
      { name: 'build.md', content: 'new', size: 3 },
      { name: 'EVIDENCE.md', content: 'ok', size: 2 },
    ])
  })

  it('asks for a concise optional summary without exposing secrets', () => {
    const prompt = buildUpdatePrompt('Career Growth', true)
    expect(prompt).toContain('CODESIGN_BUILD_UPDATE.md')
    expect(prompt).toContain('ไม่จำเป็นต้องทำเป็นชุดหลายไฟล์')
    expect(prompt).toContain('Private Repository URL')
  })

  it('allows a skipped update and requires confirmation only after an upload', () => {
    const documents = [{ name: 'BUILD.md', content: '# Build', size: 7 }]
    expect(buildUpdateIsReady([], '', false)).toBe(true)
    expect(buildUpdateIsReady(documents, 'BUILD.md', false)).toBe(false)
    expect(buildUpdateIsReady(documents, 'BUILD.md', true)).toBe(true)
  })
})
