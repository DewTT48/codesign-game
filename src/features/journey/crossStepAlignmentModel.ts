import type { Json } from '../../lib/supabase/database.types'
import type { PhaseEntry } from './journey.service'

export type AlignmentStatus = '' | 'aligned' | 'clarifies' | 'revision'

export function normalizeAlignmentStatus(value: Json | undefined): AlignmentStatus {
  return value === 'aligned' || value === 'clarifies' || value === 'revision' ? value : ''
}

export function alignmentIsReady(input: {
  status: AlignmentStatus
  note: string
  confirmed: boolean
  allowRevision?: boolean
}) {
  if (!input.status || !input.confirmed) return false
  if ((input.status === 'clarifies' || input.status === 'revision') && !input.note.trim()) return false
  if (input.status === 'revision' && !input.allowRevision) return false
  return true
}

export function entriesToRecord(entries: PhaseEntry[] | undefined) {
  return Object.fromEntries((entries ?? []).map((entry) => [entry.fieldKey, entry.content])) as Record<string, Json>
}
