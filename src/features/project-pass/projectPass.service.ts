import { requireSupabase } from '../../lib/supabase/client'
import type { ProjectPassRow } from '../../lib/supabase/database.types'

export type ProjectPassSummary = {
  available: number
  consumed: number
  revoked: number
}

export function summarizeProjectPasses(
  passes: ProjectPassRow[],
): ProjectPassSummary {
  return passes.reduce<ProjectPassSummary>(
    (summary, pass) => ({
      ...summary,
      [pass.status]: summary[pass.status] + 1,
    }),
    { available: 0, consumed: 0, revoked: 0 },
  )
}

export async function listMyProjectPasses(): Promise<ProjectPassRow[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_my_project_passes')
  if (error) throw error
  return data
}
