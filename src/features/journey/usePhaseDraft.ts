import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { Json } from '../../lib/supabase/database.types'
import {
  getPhaseEntries,
  savePhaseEntry,
  type PhaseCode,
} from './journey.service'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type PhaseEntrySave = Parameters<typeof savePhaseEntry>[0]

// Keep writes ordered across route unmounts/remounts. Without a shared queue, a
// slower stale request can finish after a newer value and overwrite it.
const phaseSaveQueues = new Map<string, Promise<void>>()

function phaseSaveKey(input: Pick<PhaseEntrySave, 'projectId' | 'phase' | 'section' | 'fieldKey'>) {
  return `${input.projectId}:${input.phase}:${input.section}:${input.fieldKey}`
}

function queuePhaseEntrySave(input: PhaseEntrySave) {
  const key = phaseSaveKey(input)
  const previous = phaseSaveQueues.get(key) ?? Promise.resolve()
  const next = previous.catch(() => undefined).then(() => savePhaseEntry(input))
  phaseSaveQueues.set(key, next)
  void next.then(
    () => {
      if (phaseSaveQueues.get(key) === next) phaseSaveQueues.delete(key)
    },
    () => {
      if (phaseSaveQueues.get(key) === next) phaseSaveQueues.delete(key)
    },
  )
  return next
}

async function waitForQueuedPhaseSaves(projectId: string, phase: PhaseCode) {
  const prefix = `${projectId}:${phase}:`
  const pending = [...phaseSaveQueues.entries()]
    .filter(([key]) => key.startsWith(prefix))
    .map(([, save]) => save)
  await Promise.all(pending)
}

export function usePhaseDraft<T extends Record<string, Json>>(input: {
  projectId: string
  phase: PhaseCode
  initialValues: T
}) {
  const [values, setValues] = useState<T>(input.initialValues)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const hydrated = useRef(false)
  const pendingSaves = useRef(new Map<keyof T, { timer: number; value: Json }>())
  const queryInstance = useId()

  const entries = useQuery({
    // A per-mount key prevents an old route instance from hydrating this form
    // with its cached snapshot before the queued save and fresh fetch finish.
    queryKey: ['phase-entries', input.projectId, input.phase, queryInstance],
    queryFn: async () => {
      await waitForQueuedPhaseSaves(input.projectId, input.phase)
      return getPhaseEntries(input.projectId, input.phase)
    },
    gcTime: 0,
  })

  const saveEntry = useMutation({
    mutationFn: (entry: { key: keyof T; value: Json }) =>
      queuePhaseEntrySave({
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
      const queued = [...pendingSaves.current.entries()]
      for (const pending of pendingSaves.current.values()) window.clearTimeout(pending.timer)
      pendingSaves.current.clear()
      if (queued.length) {
        void Promise.all(queued.map(([key, pending]) => queuePhaseEntrySave({
          projectId: input.projectId,
          phase: input.phase,
          section: 'form',
          fieldKey: String(key),
          content: pending.value,
        }))).catch(() => undefined)
      }
    },
    [input.phase, input.projectId],
  )

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((current) => ({ ...current, [key]: value }))
      setSaveState('idle')
      const existing = pendingSaves.current.get(key)
      if (existing) window.clearTimeout(existing.timer)
      const timer = window.setTimeout(() => {
        const pending = pendingSaves.current.get(key)
        if (!pending || pending.timer !== timer) return
        pendingSaves.current.delete(key)
        saveEntry.mutate({ key, value })
      }, 700)
      pendingSaves.current.set(key, { timer, value })
    },
    [saveEntry],
  )

  const saveAll = useCallback(async (overrides?: Partial<T>) => {
    for (const pending of pendingSaves.current.values()) window.clearTimeout(pending.timer)
    pendingSaves.current.clear()
    setSaveState('saving')
    const valuesToSave = { ...values, ...overrides }
    if (overrides) setValues(valuesToSave)
    try {
      await Promise.all(
        Object.entries(valuesToSave).map(([key, value]) =>
          queuePhaseEntrySave({
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
