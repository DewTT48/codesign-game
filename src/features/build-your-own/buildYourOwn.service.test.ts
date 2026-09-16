import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { createOwnProject } from './buildYourOwn.service'

const supabaseMocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}))

vi.mock('../../lib/supabase/client', () => ({
  requireSupabase: () => ({ rpc: supabaseMocks.rpc }),
}))

const ownProject: ProjectRow = {
  id: 'own-project-1',
  owner_id: 'owner-1',
  mode: 'own',
  title: 'Team Decision Log',
  topic: 'Better product decisions',
  content_readiness: 'idea',
  status: 'in_progress',
  current_phase: 'C',
  solidification_stage: 'IDEA',
  created_at: '2026-09-16T00:00:00.000Z',
  updated_at: '2026-09-16T00:00:00.000Z',
  completed_at: null,
}

describe('createOwnProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses only the atomic create-and-consume RPC with normalized input', async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: ownProject, error: null })

    await expect(
      createOwnProject({
        title: '  Team Decision Log  ',
        topic: '  Better product decisions  ',
        creationKey: '  create:owner:001  ',
      }),
    ).resolves.toEqual(ownProject)

    expect(supabaseMocks.rpc).toHaveBeenCalledOnce()
    expect(supabaseMocks.rpc).toHaveBeenCalledWith('create_own_project_with_pass', {
      target_title: 'Team Decision Log',
      target_topic: 'Better product decisions',
      target_creation_key: 'create:owner:001',
    })
  })

  it('surfaces an RPC failure without attempting a client-side fallback', async () => {
    const error = { code: 'P0001', message: 'An available Project Pass is required' }
    supabaseMocks.rpc.mockResolvedValue({ data: null, error })

    await expect(
      createOwnProject({
        title: 'Team Decision Log',
        topic: 'Better decisions',
        creationKey: 'create:owner:002',
      }),
    ).rejects.toBe(error)
    expect(supabaseMocks.rpc).toHaveBeenCalledOnce()
  })
})
