import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../i18n/LanguageContext'
import { PrdPackageImport } from './PrdPackageImport'
import type { PrdDrafts } from './prdPackage'

const contentPack = `# CONTENT PACK\n${Array.from({ length: 21 }, (_, index) => `## DAY ${String(index + 1).padStart(2, '0')}\nContent`).join('\n')}`
const files: PrdDrafts = {
  handoff: '# HANDOFF\n## Must Have\nA\n## Acceptance Criteria\nB',
  contentPack,
  experienceDirection: '# EXPERIENCE\n## Owner Decision\nA\n## Visual System\nB',
}

const markdownFile = (name: string, content: string) => {
  const file = new File([content], name, { type: 'text/markdown' })
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(content) })
  return file
}

describe('PrdPackageImport', () => {
  it('waits for explicit confirmation before applying all three valid files', async () => {
    const onApply = vi.fn()
    render(<LanguageProvider><PrdPackageImport current={files} onApply={onApply} /></LanguageProvider>)

    fireEvent.change(screen.getByLabelText('เลือก 3 ไฟล์ .MD'), {
      target: { files: [
        markdownFile('CODESIGN_HANDOFF.md', `${files.handoff}\nUpdated`),
        markdownFile('CONTENT_PACK.md', files.contentPack),
        markdownFile('EXPERIENCE_DIRECTION.md', files.experienceDirection),
      ] },
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'ยืนยันแทนที่ทั้ง 3 ไฟล์' })).toBeEnabled())
    expect(onApply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันแทนที่ทั้ง 3 ไฟล์' }))
    expect(onApply).toHaveBeenCalledTimes(1)
  })
})
