import { describe, expect, it } from 'vitest'
import { createOwnProjectSchema } from './buildYourOwn.schemas'

describe('createOwnProjectSchema', () => {
  it('trims a valid own-project title and topic', () => {
    expect(
      createOwnProjectSchema.parse({
        title: '  Team Decision Log  ',
        topic: '  Better product decisions  ',
        creationKey: '  create:owner:001  ',
      }),
    ).toEqual({
      title: 'Team Decision Log',
      topic: 'Better product decisions',
      creationKey: 'create:owner:001',
    })
  })

  it('rejects input outside the database length boundaries', () => {
    expect(() => createOwnProjectSchema.parse({ title: 'X', topic: 'Valid topic', creationKey: 'create:1' })).toThrow()
    expect(() => createOwnProjectSchema.parse({ title: 'Valid title', topic: 'X', creationKey: 'create:1' })).toThrow()
    expect(() => createOwnProjectSchema.parse({ title: 'T'.repeat(121), topic: 'Valid topic', creationKey: 'create:1' })).toThrow()
    expect(() => createOwnProjectSchema.parse({ title: 'Valid title', topic: 'T'.repeat(81), creationKey: 'create:1' })).toThrow()
    expect(() => createOwnProjectSchema.parse({ title: 'Valid title', topic: 'Valid topic', creationKey: 'short' })).toThrow()
  })
})
