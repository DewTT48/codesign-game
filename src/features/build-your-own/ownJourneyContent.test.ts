import { describe, expect, it } from 'vitest'
import {
  getOwnJourneyInitialValues,
  nextOwnJourneyPhase,
  ownJourneyDefinitions,
  ownJourneyPhases,
  validateOwnJourneyValues,
} from './ownJourneyContent'

describe('Own Journey content contract', () => {
  it('defines the full CODESIGN flow and terminates after PRD', () => {
    expect(ownJourneyPhases).toEqual(['C', 'O', 'D', 'E', 'S', 'PRD'])
    expect(nextOwnJourneyPhase('C')).toBe('O')
    expect(nextOwnJourneyPhase('S')).toBe('PRD')
    expect(nextOwnJourneyPhase('PRD')).toBe('COMPLETE')
  })

  it.each(ownJourneyPhases)('provides bilingual content, fields, and one AI action for %s', (phase) => {
    const definition = ownJourneyDefinitions[phase]
    expect(definition.headline.th).not.toBe('')
    expect(definition.headline.en).not.toBe('')
    expect(definition.sections.length).toBeGreaterThan(0)
    expect(definition.sections.flatMap((section) => section.fields).length).toBeGreaterThan(0)
    expect(definition.aiAction).toBeTruthy()
  })

  it('blocks completion until every required field meets its detail gate', () => {
    const definition = ownJourneyDefinitions.C
    const empty = getOwnJourneyInitialValues(definition)
    const requiredCount = definition.sections.flatMap((section) => section.fields).filter((field) => field.required).length

    expect(validateOwnJourneyValues(definition, empty)).toHaveLength(requiredCount)

    const complete = { ...empty }
    for (const field of definition.sections.flatMap((section) => section.fields)) {
      if (field.required) complete[field.key] = 'x'.repeat(field.minLength)
    }
    expect(validateOwnJourneyValues(definition, complete)).toEqual([])
  })
})
