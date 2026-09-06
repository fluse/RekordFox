import { BeatGridEntry } from './AnlzBuilder'

/**
 * Synthesizes a constant-tempo beat grid from a track's analyzed BPM and
 * grid phase, for the ANLZ `PQTZ` tag. This mirrors the same assumption the
 * Rekordbox XML exporter already makes (`gridOffset` anchors a beat,
 * extrapolated forward/backward at constant BPM) — this codebase has no
 * downbeat/bar detection, so `beatNumber` just cycles 1-4 from that phase.
 * A CDJ needs *some* consistent bar-phase to quantize/sync against, even
 * though it isn't guaranteed to land on the track's true first bar.
 *
 * Returns an empty array (meaning: omit the `PQTZ` tag entirely) when there
 * is no usable BPM or duration.
 */
export function synthesizeBeatGrid(
  bpm: number,
  gridOffsetSec: number,
  durationSec: number
): BeatGridEntry[] {
  if (!Number.isFinite(bpm) || bpm <= 0) return []
  if (!Number.isFinite(durationSec) || durationSec <= 0) return []

  const beatPeriodMs = 60000 / bpm
  const tempoHundredths = Math.round(bpm * 100)
  const durationMs = durationSec * 1000

  let firstBeatMs = ((gridOffsetSec || 0) * 1000) % beatPeriodMs
  if (firstBeatMs < 0) firstBeatMs += beatPeriodMs

  const beats: BeatGridEntry[] = []
  let n = 0
  for (let t = firstBeatMs; t <= durationMs; t += beatPeriodMs) {
    beats.push({ beatNumber: (n % 4) + 1, tempo: tempoHundredths, timeMs: t })
    n++
  }
  return beats
}
