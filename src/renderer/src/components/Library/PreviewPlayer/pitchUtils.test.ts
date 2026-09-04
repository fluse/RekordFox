import { describe, expect, it } from 'vitest'
import {
  PITCH_MIN,
  PITCH_MAX,
  clampAndSnapPitch,
  formatPitchPercent,
  formatAdjustedBpm,
  computePitchFillRange
} from './pitchUtils'

describe('clampAndSnapPitch', () => {
  it('leaves values inside the range and outside the snap zone untouched', () => {
    expect(clampAndSnapPitch(1.05)).toBe(1.05)
    expect(clampAndSnapPitch(0.95)).toBe(0.95)
  })

  it('clamps values beyond the min/max range', () => {
    expect(clampAndSnapPitch(0.5)).toBe(PITCH_MIN)
    expect(clampAndSnapPitch(2)).toBe(PITCH_MAX)
    expect(clampAndSnapPitch(PITCH_MIN - 0.01)).toBe(PITCH_MIN)
    expect(clampAndSnapPitch(PITCH_MAX + 0.01)).toBe(PITCH_MAX)
  })

  it('snaps values close to 1.0 (dead center) exactly onto 1.0, from either side', () => {
    expect(clampAndSnapPitch(1.002)).toBe(1.0)
    expect(clampAndSnapPitch(0.998)).toBe(1.0)
    expect(clampAndSnapPitch(1.0)).toBe(1.0)
  })

  it('does not snap values clearly outside the dead zone', () => {
    expect(clampAndSnapPitch(1.02)).toBe(1.02)
    expect(clampAndSnapPitch(0.99)).toBe(0.99)
  })
})

describe('formatPitchPercent', () => {
  it('formats the unmodified tempo as +0.0%', () => {
    expect(formatPitchPercent(1.0)).toBe('+0.0%')
  })

  it('formats a sped-up tempo with a leading plus sign', () => {
    expect(formatPitchPercent(1.05)).toBe('+5.0%')
  })

  it('formats a slowed-down tempo with a leading minus sign', () => {
    expect(formatPitchPercent(0.95)).toBe('-5.0%')
  })

  it('rounds to one decimal place', () => {
    expect(formatPitchPercent(1.0049)).toBe('+0.5%')
  })
})

describe('formatAdjustedBpm', () => {
  it('scales the original BPM by the pitch ratio', () => {
    expect(formatAdjustedBpm(128, 1.05)).toBe('134.4')
  })

  it('returns the unscaled BPM at the default pitch', () => {
    expect(formatAdjustedBpm(120, 1.0)).toBe('120.0')
  })

  it('returns null when no BPM has been analyzed yet', () => {
    expect(formatAdjustedBpm(0, 1.05)).toBeNull()
    expect(formatAdjustedBpm(-1, 1.05)).toBeNull()
  })
})

describe('computePitchFillRange', () => {
  it('collapses to a single point at dead center', () => {
    expect(computePitchFillRange(1.0)).toEqual([50, 50])
  })

  it('fills from center to the max end when pitched all the way up', () => {
    expect(computePitchFillRange(PITCH_MAX)).toEqual([50, 100])
  })

  it('fills from the min end to center when pitched all the way down', () => {
    expect(computePitchFillRange(PITCH_MIN)).toEqual([0, 50])
  })

  it('fills proportionally for an intermediate value', () => {
    const [start, end] = computePitchFillRange(1.05)
    expect(start).toBe(50)
    expect(end).toBeCloseTo(75, 5)
  })
})
