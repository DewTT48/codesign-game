import { describe, expect, it } from 'vitest'
import type { ProjectRow } from '../../../lib/supabase/database.types'
import { assemblePrd } from './assemblePrd'

const project: ProjectRow = {
  id: 'project-1',
  owner_id: 'user-1',
  mode: 'guided',
  title: '21 DAYS OF WRITING',
  topic: 'Writing',
  content_readiness: 'idea',
  status: 'in_progress',
  current_phase: 'PRD',
  solidification_stage: 'SOLID',
  created_at: '2026-08-29T00:00:00Z',
  updated_at: '2026-08-29T00:00:00Z',
  completed_at: null,
}

describe('assemblePrd', () => {
  it('assembles locked phase records into a deterministic Codex handoff', () => {
    const markdown = assemblePrd(project, {
      C: { who: 'New writers', goal: 'Write daily', success: '21 entries', importantContext: 'Short sessions', constraints: '10 minutes' },
      E: { direction: 'A calm daily writing companion', mustHaves: ['Daily prompt'], nonGoals: ['Social feed', 'AI writing'] },
      S: {
        flowSteps: ['Open app', 'Write', 'Complete day'],
        screens: [{ name: 'Today', sees: 'Prompt', actions: 'Write', next: 'Completion' }],
        dayFields: ['Title', 'Prompt'],
        browserState: ['Completed days'],
        acceptanceCriteria: ['User can write', 'App remembers progress'],
        mobileRule: 'Stack content in one column',
      },
    })

    expect(markdown).toContain('# 21 DAYS OF WRITING')
    expect(markdown).toContain('A calm daily writing companion')
    expect(markdown).toContain('1. Open app')
    expect(markdown).toContain('### 1. Today')
    expect(markdown).toContain('- No backend.')
    expect(markdown).toContain('PRODUCT DECISION REQUIRED')
  })

  it('assembles the simplified Specify model into a companion-file handoff', () => {
    const markdown = assemblePrd(project, {
      C: { who: 'New writers', goal: 'Write daily', success: '21 entries' },
      E: { direction: 'A calm daily writing companion', mustHaves: ['Complete one activity'], nonGoals: ['Social feed'] },
      S: {
        specificationVersion: 2,
        journeySummary: 'Open → do today’s activity → save → see progress',
        dailyCompletionRule: 'Save one reflection',
        returnRule: 'allow-edit',
        sequenceRule: 'sequential',
        storageRule: 'browser-device',
        productLanguage: 'en',
        contentArcs: [{ range: 'DAY 01–07', title: 'Notice', goal: 'Build awareness' }],
        dailyContent: [{ day: 1, title: 'Begin', objective: 'Start', content: 'Read', exercise: 'Write', reflection: 'Notice', record: 'Answer', completion: 'Save', duration: '5 min', reviewed: true }],
        selectedExperience: 'Calm Focus',
        experienceOwnerConfirmed: true,
        alignmentStatus: 'clarifies',
        alignmentNote: 'The ten-minute duration covers in-product reading and recording only.',
        alignmentConfirmed: true,
      },
    })

    expect(markdown).toContain('# CODESIGN HANDOFF — 21 DAYS OF WRITING')
    expect(markdown).toContain('`CONTENT_PACK.md`')
    expect(markdown).toContain('Owner-selected direction:** Calm Focus')
    expect(markdown).toContain('Thai content must use natural word wrapping')
    expect(markdown).toContain('No embedded AI')
    expect(markdown).toContain('## 13. Cross-step Alignment Record')
    expect(markdown).toContain('Step E → Step S relationship:** clarifies')
    expect(markdown).toContain('Owner reviewed both steps together:** YES')
  })
})
