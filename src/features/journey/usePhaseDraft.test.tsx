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

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
    }), { wrapper })

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
})
