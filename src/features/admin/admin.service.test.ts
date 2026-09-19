import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectPassRow } from '../../lib/supabase/database.types'
import {
  enableAdminAiTestAllowance,
  getAdminProjectRecord,
  getAdminProjects,
  grantAdminProjectPass,
} from './admin.service'

const supabaseMocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}))

vi.mock('../../lib/supabase/client', () => ({
  requireSupabase: () => ({ rpc: supabaseMocks.rpc }),
}))

const grantedPass: ProjectPassRow = {
  id: 'pass-1',
  owner_id: 'user-1',
  source: 'admin',
  status: 'available',
  grant_key: 'admin:user-1:test-grant-001',
  granted_by: 'admin-1',
  project_id: null,
  consume_key: null,
  note: 'Phase 2 testing access',
  granted_at: '2026-09-16T06:00:00.000Z',
  consumed_at: null,
  revoked_at: null,
  updated_at: '2026-09-16T06:00:00.000Z',
}

describe('grantAdminProjectPass', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the protected admin RPC with an idempotent grant key', async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: grantedPass, error: null })

    await expect(grantAdminProjectPass({
      userId: 'user-1',
      grantKey: 'admin:user-1:test-grant-001',
      note: '  Phase 2 testing access  ',
    })).resolves.toEqual(grantedPass)

    expect(supabaseMocks.rpc).toHaveBeenCalledWith('admin_grant_project_pass', {
      target_user_id: 'user-1',
      target_source: 'admin',
      target_grant_key: 'admin:user-1:test-grant-001',
      target_note: 'Phase 2 testing access',
    })
  })
})

describe('enableAdminAiTestAllowance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the protected admin RPC for the selected Own Project', async () => {
    const budget = { project_id: 'project-1', status: 'enabled' }
    supabaseMocks.rpc.mockResolvedValue({ data: budget, error: null })

    await expect(enableAdminAiTestAllowance('project-1')).resolves.toEqual(budget)
    expect(supabaseMocks.rpc).toHaveBeenCalledWith('admin_enable_ai_test_allowance', {
      target_project_id: 'project-1',
    })
  })
})

describe('admin project records', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists both project modes through the protected filtered RPC', async () => {
    const projects = [{ project_id: 'project-1', mode: 'own' }]
    supabaseMocks.rpc.mockResolvedValue({ data: projects, error: null })

    await expect(getAdminProjects({
      searchText: '  player@example.com  ',
      mode: 'own',
      status: 'in_progress',
    })).resolves.toEqual(projects)

    expect(supabaseMocks.rpc).toHaveBeenCalledWith('get_admin_projects', {
      search_text: 'player@example.com',
      mode_filter: 'own',
      status_filter: 'in_progress',
      page_limit: 100,
      page_offset: 0,
    })
  })

  it('uses null filters for the complete project directory', async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: [], error: null })

    await expect(getAdminProjects()).resolves.toEqual([])
    expect(supabaseMocks.rpc).toHaveBeenCalledWith('get_admin_projects', {
      search_text: null,
      mode_filter: null,
      status_filter: null,
      page_limit: 100,
      page_offset: 0,
    })
  })

  it('opens the selected project through the audited read-only RPC', async () => {
    const record = { project: { id: 'project-1' }, accessed_at: '2026-09-19T04:00:00.000Z' }
    supabaseMocks.rpc.mockResolvedValue({ data: record, error: null })

    await expect(getAdminProjectRecord('project-1')).resolves.toEqual(record)
    expect(supabaseMocks.rpc).toHaveBeenCalledWith('get_admin_project_record', {
      target_project_id: 'project-1',
    })
  })
})
