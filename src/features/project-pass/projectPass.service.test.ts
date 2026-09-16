import { describe, expect, it } from 'vitest'
import type { ProjectPassRow } from '../../lib/supabase/database.types'
import { summarizeProjectPasses } from './projectPass.service'

const basePass: ProjectPassRow = {
  id: 'pass-1',
  owner_id: 'owner-1',
  source: 'course',
  status: 'available',
  grant_key: 'course:owner:001',
  granted_by: null,
  project_id: null,
  consume_key: null,
  note: null,
  granted_at: '2026-09-16T00:00:00.000Z',
  consumed_at: null,
  revoked_at: null,
  updated_at: '2026-09-16T00:00:00.000Z',
}

describe('summarizeProjectPasses', () => {
  it('counts each Project Pass state without treating a consumed Pass as available', () => {
    expect(
      summarizeProjectPasses([
        basePass,
        { ...basePass, id: 'pass-2', status: 'consumed' },
        { ...basePass, id: 'pass-3', status: 'revoked' },
        { ...basePass, id: 'pass-4', status: 'available' },
      ]),
    ).toEqual({ available: 2, consumed: 1, revoked: 1 })
  })
})
