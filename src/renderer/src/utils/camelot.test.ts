import { describe, expect, it } from 'vitest'
import { parseCamelotKey } from './camelot'

describe('parseCamelotKey', () => {
  it('parses a valid camelot key', () => {
    expect(parseCamelotKey('8A')).toEqual({ num: 8, letter: 'A' })
    expect(parseCamelotKey('12B')).toEqual({ num: 12, letter: 'B' })
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(parseCamelotKey('8a')).toEqual({ num: 8, letter: 'A' })
    expect(parseCamelotKey('  10b  ')).toEqual({ num: 10, letter: 'B' })
  })

  it('rejects numbers outside the 1-12 wheel range', () => {
    expect(parseCamelotKey('0A')).toBeNull()
    expect(parseCamelotKey('13A')).toBeNull()
  })

  it('rejects malformed or missing input', () => {
    expect(parseCamelotKey('8')).toBeNull()
    expect(parseCamelotKey('A8')).toBeNull()
    expect(parseCamelotKey('')).toBeNull()
    expect(parseCamelotKey(undefined)).toBeNull()
    expect(parseCamelotKey(null)).toBeNull()
  })
})
