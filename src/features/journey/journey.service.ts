import { requireSupabase } from '../../lib/supabase/client'
import type {
  AppBuildRow,
  DecisionRow,
  FeedbackEntryRow,
  Json,
  PrdSnapshotRow,
  ProjectRow,
} from '../../lib/supabase/database.types'
import type { PrdDrafts } from './prd/prdPackage'
import { affectedRevisionPhases, solidificationBeforePhase } from './phaseRevision'

export type PhaseCode = 'C' | 'O' | 'D' | 'E' | 'S' | 'PRD' | 'I' | 'G' | 'N'

export type PhaseEntry = {
  id: string
  fieldKey: string
  content: Json
  status: 'captured' | 'locked' | 'superseded'
}

export type PhaseEntryVersion = PhaseEntry & {
  section: string
  version: number
  isCurrent: boolean
  createdAt: string
  updatedAt: string
}

export type PhaseRevisionRecord = {
  id: string
  version: number
  targetPhase: PhaseCode
  sourceCurrentPhase: ProjectRow['current_phase']
  affectedPhases: readonly PhaseCode[]
  reason: string | null
  createdAt: string
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

export async function getPhaseEntryHistory(
  projectId: string,
  phase: PhaseCode,
): Promise<PhaseEntryVersion[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('phase_entries')
    .select('id, section, field_key, content, status, version, is_current, created_at, updated_at')
    .eq('project_id', projectId)
    .eq('phase', phase)
    .eq('is_current', false)
    .order('version', { ascending: false })

  if (error) throw error
  return data.map((entry) => ({
    id: entry.id,
    section: entry.section,
    fieldKey: entry.field_key,
    content: entry.content,
    status: entry.status,
    version: entry.version,
    isCurrent: entry.is_current,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }))
}

function isPhaseCode(value: unknown): value is PhaseCode {
  return typeof value === 'string' && ['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N'].includes(value)
}

function parsePhaseRevision(decision: DecisionRow): PhaseRevisionRecord | null {
  const content = decision.content
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null
  const targetPhase = content.targetPhase
  const sourceCurrentPhase = content.sourceCurrentPhase
  const affectedPhases = content.affectedPhases
  if (!isPhaseCode(targetPhase)) return null
  if (sourceCurrentPhase !== 'COMPLETE' && !isPhaseCode(sourceCurrentPhase)) return null
  if (!Array.isArray(affectedPhases) || !affectedPhases.every(isPhaseCode)) return null
  return {
    id: decision.id,
    version: decision.version,
    targetPhase,
    sourceCurrentPhase,
    affectedPhases,
    reason: decision.reason_for_change,
    createdAt: decision.created_at,
  }
}

export async function getLatestPhaseRevision(projectId: string): Promise<PhaseRevisionRecord | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('decisions')
    .select('*')
    .eq('project_id', projectId)
    .eq('decision_type', 'phase_revision')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? parsePhaseRevision(data) : null
}

export async function getPhaseRevisions(
  projectId: string,
  phase: PhaseCode,
): Promise<PhaseRevisionRecord[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('decisions')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase', phase)
    .eq('decision_type', 'phase_revision')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(parsePhaseRevision).filter((revision): revision is PhaseRevisionRecord => Boolean(revision))
}

export async function startPhaseRevision(input: {
  projectId: string
  targetPhase: PhaseCode
  reason: string
}): Promise<ProjectRow> {
  const reason = input.reason.trim()
  if (!reason) throw new Error('Please explain why this revision is needed.')

  const client = requireSupabase()
  const rpcResult = await client.rpc('start_phase_revision', {
    target_project_id: input.projectId,
    target_phase: input.targetPhase,
    change_reason: reason,
  })
  if (!rpcResult.error) return rpcResult.data
  if (!['PGRST202', '42883'].includes(rpcResult.error.code ?? '')) throw rpcResult.error

  // Backward-compatible client transaction while the atomic database function is
  // being rolled out. Every original row remains available as a superseded version.
  const project = await getProject(input.projectId)
  const affectedPhases = affectedRevisionPhases(input.targetPhase, project.current_phase)
  if (!affectedPhases.length) throw new Error('This step is not available for revision.')

  const { data: originals, error: originalError } = await client
    .from('phase_entries')
    .select('*')
    .eq('project_id', input.projectId)
    .in('phase', affectedPhases)
    .eq('is_current', true)
  if (originalError) throw originalError

  const originalIds = originals.map((entry) => entry.id)
  if (!originals.some((entry) => entry.phase === input.targetPhase)) {
    throw new Error('The target step has no saved answers to revise.')
  }
  let cloneIds: string[] = []
  let deactivatedNextIterationIds: string[] = []
  let projectUpdated = false

  try {
    if (originalIds.length) {
      const { error } = await client
        .from('phase_entries')
        .update({ is_current: false, status: 'superseded' })
        .in('id', originalIds)
      if (error) throw error

      const { data: clones, error: cloneError } = await client
        .from('phase_entries')
        .insert(originals.map((entry) => ({
          project_id: entry.project_id,
          phase: entry.phase,
          section: entry.section,
          field_key: entry.field_key,
          content: entry.content,
          status: 'captured' as const,
          version: entry.version + 1,
          is_current: true,
        })))
        .select('id')
      if (cloneError) throw cloneError
      cloneIds = clones.map((entry) => entry.id)
    }

    if (affectedPhases.includes('N')) {
      const { data: nextIterationDecisions, error: nextIterationFindError } = await client
        .from('decisions')
        .select('id')
        .eq('project_id', input.projectId)
        .eq('phase', 'N')
        .eq('decision_type', 'next_iteration')
        .eq('is_current', true)
      if (nextIterationFindError) throw nextIterationFindError
      deactivatedNextIterationIds = nextIterationDecisions.map((decision) => decision.id)
      const { error } = await client
        .from('decisions')
        .update({ is_current: false })
        .eq('project_id', input.projectId)
        .eq('phase', 'N')
        .eq('decision_type', 'next_iteration')
        .eq('is_current', true)
      if (error) throw error
    }

    const { data: nextProject, error: projectError } = await client
      .from('projects')
      .update({
        current_phase: input.targetPhase,
        solidification_stage: solidificationBeforePhase(input.targetPhase),
        status: 'in_progress',
        completed_at: null,
      })
      .eq('id', input.projectId)
      .select('*')
      .single()
    if (projectError) throw projectError
    projectUpdated = true

    const { error: decisionError } = await client.rpc('revise_decision', {
      target_project_id: input.projectId,
      target_phase: input.targetPhase,
      target_decision_type: 'phase_revision',
      next_content: {
        targetPhase: input.targetPhase,
        sourceCurrentPhase: project.current_phase,
        affectedPhases,
      },
      change_reason: reason,
    })
    if (decisionError) throw decisionError
    return nextProject
  } catch (error) {
    if (projectUpdated) {
      await client.from('projects').update({
        current_phase: project.current_phase,
        solidification_stage: project.solidification_stage,
        status: project.status,
        completed_at: project.completed_at,
      }).eq('id', input.projectId)
    }
    if (cloneIds.length) await client.from('phase_entries').delete().in('id', cloneIds)
    if (deactivatedNextIterationIds.length) {
      await client.from('decisions').update({ is_current: true }).in('id', deactivatedNextIterationIds)
    }
    await Promise.all(originals.map((entry) => client.from('phase_entries').update({
      is_current: true,
      status: entry.status,
    }).eq('id', entry.id)))
    throw error
  }
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
  files: PrdDrafts,
): Promise<ProjectRow> {
  const client = requireSupabase()
  const packageResult = await client.rpc('lock_prd_package', {
    target_project_id: projectId,
    target_markdown: files.handoff,
    target_content_pack: files.contentPack,
    target_experience_direction: files.experienceDirection,
  })
  if (!packageResult.error) return packageResult.data
  if (!['PGRST202', '42883'].includes(packageResult.error.code ?? '')) throw packageResult.error

  // Backward-compatible path while the package-snapshot migration is being applied.
  // complete_phase, called by lock_prd, still locks all three current PRD entries together.
  const legacyResult = await client.rpc('lock_prd', {
    target_project_id: projectId,
    target_markdown: files.handoff,
  })
  if (legacyResult.error) throw legacyResult.error
  return legacyResult.data
}

export async function getLatestPrdSnapshot(projectId: string): Promise<PrdSnapshotRow | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('prd_snapshots')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'locked')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
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
