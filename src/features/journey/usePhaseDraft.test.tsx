import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePhaseDraft } from './usePhaseDraft'

const serviceMocks = vi.hoisted(() => ({
  getPhaseEntries: vi.fn(),
  savePhaseEntry: vi.fn(),
}))

vi.mock('./journey.service', () => serviceMocks)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('usePhaseDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serviceMocks.getPhaseEntries.mockResolvedValue([])
    serviceMocks.savePhaseEntry.mockResolvedValue(undefined)
  })

  it('flushes the latest debounced value when the phase unmounts', async () => {
    const { result, unmount } = renderHook(() => usePhaseDraft({
      projectId: 'project-1',
      phase: 'N',
      initialValues: { change: '' },
    }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setField('change', 'first draft')
      result.current.setField('change', 'latest draft')
    })
    expect(serviceMocks.savePhaseEntry).not.toHaveBeenCalled()

    unmount()

    await waitFor(() => expect(serviceMocks.savePhaseEntry).toHaveBeenCalledTimes(1))
    expect(serviceMocks.savePhaseEntry).toHaveBeenCalledWith({
      projectId: 'project-1',
      phase: 'N',
      section: 'form',
      fieldKey: 'change',
      content: 'latest draft',
    })
  })

  it('waits for an unmount save before hydrating the same phase again', async () => {
    let finishSave: (() => void) | undefined
    serviceMocks.savePhaseEntry.mockReturnValue(new Promise<void>((resolve) => {
      finishSave = resolve
    }))
    serviceMocks.getPhaseEntries
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'who-v1', fieldKey: 'who', content: 'latest owner answer', status: 'captured' }])
    const sharedWrapper = createWrapper()

    const first = renderHook(() => usePhaseDraft({
      projectId: 'project-2',
      phase: 'C',
      initialValues: { who: '' },
    }), { wrapper: sharedWrapper })
    await waitFor(() => expect(first.result.current.loading).toBe(false))

    act(() => first.result.current.setField('who', 'latest owner answer'))
    first.unmount()
    await waitFor(() => expect(serviceMocks.savePhaseEntry).toHaveBeenCalledTimes(1))

    const second = renderHook(() => usePhaseDraft({
      projectId: 'project-2',
      phase: 'C',
      initialValues: { who: '' },
    }), { wrapper: sharedWrapper })
    await new Promise((resolve) => window.setTimeout(resolve, 20))
    expect(serviceMocks.getPhaseEntries).toHaveBeenCalledTimes(1)
    expect(second.result.current.loading).toBe(true)

    finishSave?.()
    await waitFor(() => expect(serviceMocks.getPhaseEntries).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(second.result.current.values.who).toBe('latest owner answer'))
    second.unmount()
  })
})
