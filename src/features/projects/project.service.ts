import { requireSupabase } from '../../lib/supabase/client'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { createProjectSchema, type CreateProjectInput } from './project.schemas'

export async function listProjects(): Promise<ProjectRow[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error(
      'Failed to list projects',
      JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }),
    )
    throw error
  }
  return data
}

export async function createGuidedProject(
  rawInput: CreateProjectInput,
): Promise<ProjectRow> {
  const input = createProjectSchema.parse(rawInput)
  const client = requireSupabase()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Sign in is required to create a project.')

  const topic = input.topic.trim()
  const { data, error } = await client
    .from('projects')
    .insert({
      owner_id: user.id,
      title: `21 DAYS OF ${topic.toUpperCase()}`,
      topic,
      content_readiness: input.contentReadiness,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}
