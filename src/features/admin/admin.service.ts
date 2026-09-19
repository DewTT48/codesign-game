import { requireSupabase } from '../../lib/supabase/client'
import type {
  AdminProjectRecord,
  AdminProjectRow,
  AdminOwnProjectRow,
  AdminOverview,
  AdminUserRow,
  AiProjectBudgetRow,
  ProjectPassRow,
} from '../../lib/supabase/database.types'

export type AdminProjectFilters = {
  searchText?: string
  mode?: AdminProjectRow['mode'] | 'all'
  status?: AdminProjectRow['project_status'] | 'all'
}

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

export async function getAdminOwnProjects(): Promise<AdminOwnProjectRow[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_admin_own_projects')
  if (error) throw error
  return data
}

export async function getAdminProjects({
  searchText = '',
  mode = 'all',
  status = 'all',
}: AdminProjectFilters = {}): Promise<AdminProjectRow[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_admin_projects', {
    search_text: searchText.trim() || null,
    mode_filter: mode === 'all' ? null : mode,
    status_filter: status === 'all' ? null : status,
    page_limit: 100,
    page_offset: 0,
  })
  if (error) throw error
  return data
}

export async function getAdminProjectRecord(projectId: string): Promise<AdminProjectRecord> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_admin_project_record', {
    target_project_id: projectId,
  })
  if (error) throw error
  return data
}

export async function enableAdminAiTestAllowance(projectId: string): Promise<AiProjectBudgetRow> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_enable_ai_test_allowance', {
    target_project_id: projectId,
  })
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
