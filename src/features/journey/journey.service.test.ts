import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { startPhaseRevision } from './journey.service'

const supabaseMocks = vi.hoisted(() => ({
  requireSupabase: vi.fn(),
}))

vi.mock('../../lib/supabase/client', () => supabaseMocks)

function queryResult<T>(result: T) {
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'in', 'update', 'single']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (resolve: (value: T) => unknown) => Promise.resolve(result).then(resolve)
  return builder
}

const completedProject: ProjectRow = {
  id: 'project-1',
  owner_id: 'owner-1',
  title: 'Revision test',
  topic: 'testing',
  content_readiness: 'ready',
  mode: 'guided',
  status: 'completed',
  current_phase: 'COMPLETE',
  solidification_stage: 'BUILD_READY',
  completed_at: '2026-09-09T00:00:00.000Z',
  created_at: '2026-09-09T00:00:00.000Z',
  updated_at: '2026-09-09T00:00:00.000Z',
}

describe('startPhaseRevision', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes stale confirmations after a successful older hosted RPC', async () => {
    const projectQuery = queryResult({ data: completedProject, error: null })
    const entriesQuery = queryResult({
      data: [
        { id: 'reviewed', phase: 'PRD', field_key: 'confirmedFilesV2', content: ['handoff', 'contentPack', 'experienceDirection'] },
        { id: 'outcome', phase: 'PRD', field_key: 'reviewOutcomeV2', content: 'files' },
        { id: 'working', phase: 'I', field_key: 'workingApp', content: true },
        { id: 'document', phase: 'PRD', field_key: 'markdownDraft', content: '# Preserved' },
      ],
      error: null,
    })
    const updateQueries = [
      queryResult({ data: null, error: null }),
      queryResult({ data: null, error: null }),
      queryResult({ data: null, error: null }),
    ]
    const from = vi.fn()
      .mockReturnValueOnce(projectQuery)
      .mockReturnValueOnce(entriesQuery)
      .mockReturnValueOnce(updateQueries[0])
      .mockReturnValueOnce(updateQueries[1])
      .mockReturnValueOnce(updateQueries[2])
    const rpc = vi.fn().mockResolvedValue({
      data: { ...completedProject, status: 'in_progress', current_phase: 'PRD', completed_at: null },
      error: null,
    })
    supabaseMocks.requireSupabase.mockReturnValue({ from, rpc })

    const result = await startPhaseRevision({
      projectId: 'project-1',
      targetPhase: 'PRD',
      reason: 'Recheck the handoff',
    })

    expect(result.current_phase).toBe('PRD')
    expect(rpc).toHaveBeenCalledWith('start_phase_revision', {
      target_project_id: 'project-1',
      target_phase: 'PRD',
      change_reason: 'Recheck the handoff',
    })
    expect(updateQueries[0].update).toHaveBeenCalledWith({ content: [] })
    expect(updateQueries[1].update).toHaveBeenCalledWith({ content: '' })
    expect(updateQueries[2].update).toHaveBeenCalledWith({ content: false })
    expect(from).toHaveBeenCalledTimes(5)
  })
})
