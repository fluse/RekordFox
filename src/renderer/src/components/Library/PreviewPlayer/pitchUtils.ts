export const PITCH_MIN = 0.9
export const PITCH_MAX = 1.1

// Dragging within this distance of 1.0 (dead center = original tempo) snaps
// exactly onto it, so it's easy to land back on the unmodified BPM by feel.
const PITCH_SNAP_THRESHOLD = 0.004

export function clampAndSnapPitch(value: number): number {
  const clamped = Math.max(PITCH_MIN, Math.min(PITCH_MAX, value))
  return Math.abs(clamped - 1.0) < PITCH_SNAP_THRESHOLD ? 1.0 : clamped
}

export function formatPitchPercent(pitch: number): string {
  const percent = (pitch - 1.0) * 100
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
}

export function formatAdjustedBpm(bpm: number, pitch: number): string | null {
  if (!(bpm > 0)) return null
  return (bpm * pitch).toFixed(1)
}

/** Bipolar fill range [start%, end%] for a gradient that grows from the
 *  center (pitch === 1.0) toward the thumb, in either direction. */
export function computePitchFillRange(pitch: number): [number, number] {
  // Rounded to guard against float noise (e.g. 0.9 isn't exact in binary),
  // which would otherwise show up as a slightly-off center point.
  const fillPercent = Math.round(((pitch - PITCH_MIN) / (PITCH_MAX - PITCH_MIN)) * 100000) / 1000
  return fillPercent >= 50 ? [50, fillPercent] : [fillPercent, 50]
}
