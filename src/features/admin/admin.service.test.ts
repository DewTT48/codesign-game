import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectPassRow } from '../../lib/supabase/database.types'
import { grantAdminProjectPass } from './admin.service'

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
