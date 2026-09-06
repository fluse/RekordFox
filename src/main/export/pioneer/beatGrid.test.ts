import { describe, expect, it } from 'vitest'
import { synthesizeBeatGrid } from './beatGrid'

describe('synthesizeBeatGrid', () => {
  it('places beats at the expected period and cycles beatNumber 1-4', () => {
    const beats = synthesizeBeatGrid(120, 0, 2) // 120 BPM -> 500ms/beat, 2s track
    expect(beats.map((b) => b.timeMs)).toEqual([0, 500, 1000, 1500, 2000])
    expect(beats.map((b) => b.beatNumber)).toEqual([1, 2, 3, 4, 1])
    expect(beats.every((b) => b.tempo === 12000)).toBe(true)
  })

  it('anchors the first beat to gridOffset, wrapped into [0, beatPeriod)', () => {
    const beats = synthesizeBeatGrid(120, 0.7, 1) // gridOffset > one beat period (0.5s)
    expect(beats[0].timeMs).toBeCloseTo(200, 5) // 700ms mod 500ms = 200ms
  })

  it('wraps a negative gridOffset into a positive phase', () => {
    const beats = synthesizeBeatGrid(120, -0.1, 1) // -100ms mod 500ms = 400ms
    expect(beats[0].timeMs).toBeCloseTo(400, 5)
  })

  it('returns no beats (omit the PQTZ tag) when bpm is missing or invalid', () => {
    expect(synthesizeBeatGrid(0, 0, 200)).toEqual([])
    expect(synthesizeBeatGrid(-5, 0, 200)).toEqual([])
    expect(synthesizeBeatGrid(NaN, 0, 200)).toEqual([])
  })

  it('returns no beats when duration is missing or invalid', () => {
    expect(synthesizeBeatGrid(120, 0, 0)).toEqual([])
    expect(synthesizeBeatGrid(120, 0, -1)).toEqual([])
  })

  it('rounds fractional BPM to whole hundredths for the tempo field', () => {
    const beats = synthesizeBeatGrid(127.98, 0, 1)
    expect(beats[0].tempo).toBe(12798)
    expect(beats[0].timeMs).toBe(0)
  })
})
