import { requireSupabase } from '../../lib/supabase/client'
import type { AdminOverview, AdminUserRow } from '../../lib/supabase/database.types'

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
