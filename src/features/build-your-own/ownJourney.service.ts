import { requireSupabase } from '../../lib/supabase/client'
import type { ProjectRow } from '../../lib/supabase/database.types'
import type { OwnJourneyPhase } from './ownJourneyContent'

export async function completeOwnJourneyPhase(
  projectId: string,
  phase: OwnJourneyPhase,
): Promise<ProjectRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('complete_own_phase', {
    target_project_id: projectId,
    target_phase: phase,
  })
  if (error) throw error
  return data
}
