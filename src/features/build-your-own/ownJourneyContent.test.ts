import { describe, expect, it } from 'vitest'
import {
  getOwnJourneyInitialValues,
  nextOwnJourneyPhase,
  ownJourneyDefinitions,
  ownJourneyPhases,
  validateOwnJourneyValues,
} from './ownJourneyContent'

describe('Own Journey content contract', () => {
  it('defines the full CODESIGN flow and terminates after N', () => {
    expect(ownJourneyPhases).toEqual(['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N'])
    expect(nextOwnJourneyPhase('C')).toBe('O')
    expect(nextOwnJourneyPhase('S')).toBe('PRD')
    expect(nextOwnJourneyPhase('PRD')).toBe('I')
    expect(nextOwnJourneyPhase('I')).toBe('G')
    expect(nextOwnJourneyPhase('G')).toBe('N')
    expect(nextOwnJourneyPhase('N')).toBe('COMPLETE')
  })

  it.each(ownJourneyPhases)('provides bilingual content and fields for %s', (phase) => {
    const definition = ownJourneyDefinitions[phase]
    expect(definition.headline.th).not.toBe('')
    expect(definition.headline.en).not.toBe('')
    expect(definition.sections.length).toBeGreaterThan(0)
    expect(definition.sections.flatMap((section) => section.fields).length).toBeGreaterThan(0)
  })

  it.each(['C', 'O', 'D', 'E', 'S', 'PRD'] as const)('provides a governed AI proposal action for %s', (phase) => {
    expect(ownJourneyDefinitions[phase].aiAction).toBeTruthy()
  })

  it.each(['I', 'G', 'N'] as const)('keeps evidence-led phase %s human-authored', (phase) => {
    expect(ownJourneyDefinitions[phase].aiAction).toBeUndefined()
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
