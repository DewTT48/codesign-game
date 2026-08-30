import { describe, expect, it } from 'vitest'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { assembleJournal } from './assembleJournal'

const project: ProjectRow = {
  id: 'project-1', owner_id: 'user-1', mode: 'guided', title: '21 DAYS OF WRITING', topic: 'Writing',
  content_readiness: 'idea', status: 'completed', current_phase: 'COMPLETE', solidification_stage: 'BUILD_READY',
  created_at: '2026-08-29T00:00:00Z', updated_at: '2026-08-30T00:00:00Z', completed_at: '2026-08-30T00:00:00Z',
}

describe('assembleJournal', () => {
  it('preserves the learner journey and build evidence', () => {
    const journal = assembleJournal(project, {
      phases: { C: { who: 'New writers', goal: 'Write daily' }, N: { change: 'Clarify the first step', because: 'Tester paused', expectedResult: 'Faster start' } },
      prd: null,
      build: { id: 'build-1', project_id: 'project-1', version_label: 'v1', app_url: 'https://example.com', repository_url: null, created_at: '2026-08-30T00:00:00Z' },
      feedback: [],
      decisions: [],
    })
    expect(journal).toContain('# CODESIGN JOURNAL — 21 DAYS OF WRITING')
    expect(journal).toContain('New writers')
    expect(journal).toContain('https://example.com')
    expect(journal).toContain('Clarify the first step')
  })
})

