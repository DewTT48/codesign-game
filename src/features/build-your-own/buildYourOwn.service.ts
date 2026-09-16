import { requireSupabase } from '../../lib/supabase/client'
import type { ProjectRow } from '../../lib/supabase/database.types'
import {
  createOwnProjectSchema,
  type CreateOwnProjectInput,
} from './buildYourOwn.schemas'

/**
 * Creates an own-mode project and consumes one Project Pass in the same database
 * transaction. UI code must call this only after the user confirms creation.
 */
export async function createOwnProject(
  rawInput: CreateOwnProjectInput,
): Promise<ProjectRow> {
  const input = createOwnProjectSchema.parse(rawInput)
  const client = requireSupabase()
  const { data, error } = await client.rpc('create_own_project_with_pass', {
    target_title: input.title,
    target_topic: input.topic,
    target_creation_key: input.creationKey,
  })

  if (error) throw error
  return data
}
