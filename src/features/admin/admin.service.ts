import { requireSupabase } from '../../lib/supabase/client'
import type {
  AdminOverview,
  AdminUserRow,
  ProjectPassRow,
} from '../../lib/supabase/database.types'

export type GrantProjectPassInput = {
  userId: string
  grantKey: string
  note?: string
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('current_user_is_admin')
  if (error) throw error
  return data
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_admin_overview')
  if (error) throw error
  return data
}

export async function getAdminUsers(searchText = ''): Promise<AdminUserRow[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_admin_users', {
    search_text: searchText.trim() || null,
    page_limit: 50,
    page_offset: 0,
  })
  if (error) throw error
  return data
}

export async function getAdminProjectPasses(): Promise<ProjectPassRow[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('project_passes')
    .select('*')
    .order('granted_at', { ascending: false })
  if (error) throw error
  return data
}

export function createAdminGrantKey(userId: string): string {
  const uniquePart = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `admin:${userId}:${uniquePart}`
}

export async function grantAdminProjectPass({
  userId,
  grantKey,
  note = '',
}: GrantProjectPassInput): Promise<ProjectPassRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_grant_project_pass', {
    target_user_id: userId,
    target_source: 'admin',
    target_grant_key: grantKey,
    target_note: note.trim() || null,
  })
  if (error) throw error
  return data
}
