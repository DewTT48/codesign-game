import { requireSupabase } from '../../lib/supabase/client'
import type {
  AppBuildRow,
  DecisionRow,
  FeedbackEntryRow,
  Json,
  PrdSnapshotRow,
  ProjectRow,
} from '../../lib/supabase/database.types'

export type PhaseCode = 'C' | 'O' | 'D' | 'E' | 'S' | 'PRD' | 'I' | 'G' | 'N'

export type PhaseEntry = {
  id: string
  fieldKey: string
  content: Json
  status: 'captured' | 'locked' | 'superseded'
}

export type PrdSource = Partial<
  Record<'C' | 'O' | 'D' | 'E' | 'S', Record<string, Json>>
>

export type JourneyExportData = {
  phases: Partial<Record<PhaseCode, Record<string, Json>>>
  prd: PrdSnapshotRow | null
  build: AppBuildRow | null
  feedback: FeedbackEntryRow[]
  decisions: DecisionRow[]
}

export async function getProject(projectId: string): Promise<ProjectRow> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (error) throw error
  return data
}

export async function getPhaseEntries(
  projectId: string,
  phase: PhaseCode,
): Promise<PhaseEntry[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('phase_entries')
    .select('id, field_key, content, status')
    .eq('project_id', projectId)
    .eq('phase', phase)
    .eq('is_current', true)

  if (error) throw error
  return data.map((entry) => ({
    id: entry.id,
    fieldKey: entry.field_key,
    content: entry.content,
    status: entry.status,
  }))
}

export async function savePhaseEntry(input: {
  projectId: string
  phase: PhaseCode
  section: string
  fieldKey: string
  content: Json
}) {
  const client = requireSupabase()
  const { data: existing, error: findError } = await client
    .from('phase_entries')
    .select('id, status')
    .eq('project_id', input.projectId)
    .eq('phase', input.phase)
    .eq('section', input.section)
    .eq('field_key', input.fieldKey)
    .eq('is_current', true)
    .maybeSingle()

  if (findError) throw findError
  if (existing?.status === 'locked') {
    throw new Error('A locked entry must be revised through decision history.')
  }

  if (existing) {
    const { error } = await client
      .from('phase_entries')
      .update({ content: input.content, status: 'captured' })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await client.from('phase_entries').insert({
    project_id: input.projectId,
    phase: input.phase,
    section: input.section,
    field_key: input.fieldKey,
    content: input.content,
  })
  if (error) throw error
}

export async function completePhase(
  projectId: string,
  phase: PhaseCode,
): Promise<ProjectRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('complete_phase', {
    target_project_id: projectId,
    target_phase: phase,
  })
  if (error) throw error
  return data
}

export async function getPrdSource(projectId: string): Promise<PrdSource> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('phase_entries')
    .select('phase, field_key, content')
    .eq('project_id', projectId)
    .in('phase', ['C', 'O', 'D', 'E', 'S'])
    .eq('is_current', true)

  if (error) throw error

  const source: PrdSource = {}
  for (const entry of data) {
    const phase = entry.phase as keyof PrdSource
    source[phase] ??= {}
    source[phase]![entry.field_key] = entry.content
  }
  return source
}

export async function lockPrd(
  projectId: string,
  markdown: string,
): Promise<ProjectRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('lock_prd', {
    target_project_id: projectId,
    target_markdown: markdown,
  })
  if (error) throw error
  return data
}

export async function completeImplementation(input: {
  projectId: string
  appUrl: string
  repositoryUrl?: string
}): Promise<ProjectRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('complete_implementation', {
    target_project_id: input.projectId,
    target_app_url: input.appUrl,
    target_repository_url: input.repositoryUrl || null,
  })
  if (error) throw error
  return data
}

export async function completeFeedback(input: {
  projectId: string
  creatorTest: Json
  userTest: Json
}): Promise<ProjectRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('complete_feedback', {
    target_project_id: input.projectId,
    target_creator_test: input.creatorTest,
    target_user_test: input.userTest,
  })
  if (error) throw error
  return data
}

export async function completeNextIteration(
  projectId: string,
  decision: Json,
): Promise<ProjectRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('complete_next_iteration', {
    target_project_id: projectId,
    target_decision: decision,
  })
  if (error) throw error
  return data
}

export async function getJourneyExportData(
  projectId: string,
): Promise<JourneyExportData> {
  const client = requireSupabase()
  const [entriesResult, prdResult, buildResult, feedbackResult, decisionsResult] = await Promise.all([
    client.from('phase_entries').select('phase, field_key, content').eq('project_id', projectId).eq('is_current', true),
    client.from('prd_snapshots').select('*').eq('project_id', projectId).eq('status', 'locked').order('version', { ascending: false }).limit(1).maybeSingle(),
    client.from('app_builds').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    client.from('feedback_entries').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    client.from('decisions').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
  ])

  const error = entriesResult.error ?? prdResult.error ?? buildResult.error ?? feedbackResult.error ?? decisionsResult.error
  if (error) throw error

  const phases: JourneyExportData['phases'] = {}
  for (const entry of entriesResult.data ?? []) {
    const phase = entry.phase as PhaseCode
    phases[phase] ??= {}
    phases[phase]![entry.field_key] = entry.content
  }

  return {
    phases,
    prd: prdResult.data,
    build: buildResult.data,
    feedback: feedbackResult.data ?? [],
    decisions: decisionsResult.data ?? [],
  }
}
