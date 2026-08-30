import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Json } from '../../lib/supabase/database.types'
import {
  getPhaseEntries,
  savePhaseEntry,
  type PhaseCode,
} from './journey.service'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function usePhaseDraft<T extends Record<string, Json>>(input: {
  projectId: string
  phase: PhaseCode
  initialValues: T
}) {
  const [values, setValues] = useState<T>(input.initialValues)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const hydrated = useRef(false)
  const timers = useRef(new Map<keyof T, number>())

  const entries = useQuery({
    queryKey: ['phase-entries', input.projectId, input.phase],
    queryFn: () => getPhaseEntries(input.projectId, input.phase),
  })

  const saveEntry = useMutation({
    mutationFn: (entry: { key: keyof T; value: Json }) =>
      savePhaseEntry({
        projectId: input.projectId,
        phase: input.phase,
        section: 'form',
        fieldKey: String(entry.key),
        content: entry.value,
      }),
    onMutate: () => setSaveState('saving'),
    onSuccess: () => setSaveState('saved'),
    onError: () => setSaveState('error'),
  })

  useEffect(() => {
    if (!entries.data || hydrated.current) return
    const restored = { ...input.initialValues }
    for (const entry of entries.data) {
      if (entry.fieldKey in restored) {
        restored[entry.fieldKey as keyof T] = entry.content as T[keyof T]
      }
    }
    setValues(restored)
    hydrated.current = true
  }, [entries.data, input.initialValues])

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) window.clearTimeout(timer)
    },
    [],
  )

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((current) => ({ ...current, [key]: value }))
      setSaveState('idle')
      const existingTimer = timers.current.get(key)
      if (existingTimer) window.clearTimeout(existingTimer)
      const timer = window.setTimeout(() => {
        timers.current.delete(key)
        saveEntry.mutate({ key, value })
      }, 700)
      timers.current.set(key, timer)
    },
    [saveEntry],
  )

  const saveAll = useCallback(async () => {
    for (const timer of timers.current.values()) window.clearTimeout(timer)
    timers.current.clear()
    setSaveState('saving')
    try {
      await Promise.all(
        Object.entries(values).map(([key, value]) =>
          savePhaseEntry({
            projectId: input.projectId,
            phase: input.phase,
            section: 'form',
            fieldKey: key,
            content: value,
          }),
        ),
      )
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      throw error
    }
  }, [input.phase, input.projectId, values])

  return {
    values,
    setField,
    saveAll,
    saveState,
    loading: entries.isLoading,
    loadError: entries.isError,
  }
}
