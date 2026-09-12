import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GuidedRuleField } from './GuidedRuleField'

describe('GuidedRuleField', () => {
  it('uses an example as editable starting text', () => {
    const onChange = vi.fn()
    render(
      <GuidedRuleField
        id="return-rule"
        title="กติกาการกลับมาใช้งาน"
        question="ผู้ใช้กลับมาทำอะไรได้บ้าง?"
        value=""
        examples={['กลับมาอ่านและแก้ไขได้']}
        advisory="ตรวจผลกระทบของกติกานี้"
        isThai
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'กลับมาอ่านและแก้ไขได้' }))
    expect(onChange).toHaveBeenCalledWith('กลับมาอ่านและแก้ไขได้')
    expect(screen.getByRole('status')).toHaveTextContent('ตรวจผลกระทบของกติกานี้')

    fireEvent.change(screen.getByLabelText('กติกาของ Product นี้'), { target: { value: 'กติกาที่เขียนเอง' } })
    expect(onChange).toHaveBeenCalledWith('กติกาที่เขียนเอง')
  })
})
