import type { Track } from '@main/db'

export interface CamelotKey {
  num: number
  letter: 'A' | 'B'
}

const CAMELOT_PATTERN = /^(\d{1,2})([AB])$/i

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const hNorm = h / 360
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hue2rgb(p, q, hNorm + 1 / 3) * 255,
    hue2rgb(p, q, hNorm) * 255,
    hue2rgb(p, q, hNorm - 1 / 3) * 255
  ]
}

// Camelot wheel color – maps the number (1–12) to a hue on the color wheel
export function camelotColor(camelot: string): string {
  const num = parseInt(camelot)
  if (isNaN(num)) return '#52525b'
  const hue = ((num - 1) / 12) * 360
  return `hsl(${hue}, 65%, 52%)`
}

// Picks black or white text depending on the perceived brightness of the camelot color,
// so hues like blue/purple (dark) stay readable next to yellow/green (light).
export function camelotTextColor(camelot: string): string {
  const num = parseInt(camelot)
  if (isNaN(num)) return '#fafafa'
  const hue = ((num - 1) / 12) * 360
  const [r, g, b] = hslToRgb(hue, 0.65, 0.52)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 150 ? '#09090b' : '#fafafa'
}

export function parseCamelotKey(raw: string | undefined | null): CamelotKey | null {
  if (!raw) return null
  const match = CAMELOT_PATTERN.exec(raw.trim())
  if (!match) return null
  const num = parseInt(match[1], 10)
  if (num < 1 || num > 12) return null
  return { num, letter: match[2].toUpperCase() as 'A' | 'B' }
}

// ---------------------------------------------------------------------------
// Harmonic scoring
//
// The Camelot wheel has 12 numeric positions (1-12) arranged in a circle,
// each with an 'A' (minor) and 'B' (major) side. Unlike a plain distance
// metric, the direction of the step matters here: going from 8A to 10A
// ("+2", an energy boost) is not the same transition as going from 8A to
// 6A ("-2", an energy drop), even though both are two wheel steps away.
// ---------------------------------------------------------------------------

// Signed step count from `fromNum` to `toNum` around the 12-position wheel,
// normalized to the range -6..+6 (e.g. 8 -> 10 is +2, 8 -> 6 is -2, and a
// step that wraps past 12 back to 1 is still counted as the shorter +/-
// distance, e.g. 11 -> 1 is +2, not +10 or -10).
function signedWheelStep(fromNum: number, toNum: number): number {
  const normalized = (((toNum - fromNum) % 12) + 12) % 12 // always 0..11
  return normalized > 6 ? normalized - 12 : normalized
}

// Scores how well `candidate` follows `current` on the Camelot wheel, per
// the harmonic mixing rules:
//   100 - Perfect match: identical key (e.g. 8A -> 8A)
//    80 - Seamless: one step away, same letter (e.g. 8A -> 7A or 8A -> 9A)
//    70 - Mood shift: same number, letter flips (e.g. 8A -> 8B)
//    50 - Energy boost: two steps up, same letter (e.g. 8A -> 10A)
//    40 - Energy drop: two steps down, same letter (e.g. 8A -> 6A)
//     0 - anything else is not considered a harmonically compatible mix
function harmonicScore(current: CamelotKey, candidate: CamelotKey): number {
  const sameLetter = current.letter === candidate.letter
  const step = signedWheelStep(current.num, candidate.num)

  if (step === 0 && sameLetter) return 100
  if (sameLetter && (step === 1 || step === -1)) return 80
  if (step === 0 && !sameLetter) return 70
  if (sameLetter && step === 2) return 50
  if (sameLetter && step === -2) return 40
  return 0
}

// Harmonic score between two tracks, treating an unparseable/missing key on
// either side as "no known compatibility" (0) rather than guessing.
function trackHarmonicScore(current: Track, candidate: Track): number {
  const currentKey = parseCamelotKey(current.key)
  const candidateKey = parseCamelotKey(candidate.key)
  if (!currentKey || !candidateKey) return 0
  return harmonicScore(currentKey, candidateKey)
}

// ---------------------------------------------------------------------------
// BPM rules
// ---------------------------------------------------------------------------

// Hard filter threshold: candidates whose BPM deviates from the current
// track by more than this fraction are excluded from consideration (unless
// excluding them would leave no candidates at all).
const BPM_HARD_FILTER_RATIO = 0.06

// Percentage BPM deviation between two tracks. Returns Infinity when either
// BPM is unknown (0/unanalyzed), so such tracks never win a comparison
// against a track with known, close BPM.
function bpmDeviationRatio(current: Track, candidate: Track): number {
  if (!current.bpm || !candidate.bpm) return Infinity
  return Math.abs(candidate.bpm - current.bpm) / current.bpm
}

// Ranks a candidate for the harmonic tie-break: a slight tempo increase of
// 0-2 BPM is the single best category (ranked 0, 1 or 2 - lower wins),
// ahead of every other candidate regardless of how close their BPM is.
// Outside that window, the closest BPM (in either direction) wins.
function bpmTieBreakRank(current: Track, candidate: Track): number {
  if (!current.bpm || !candidate.bpm) return Infinity
  const diff = candidate.bpm - current.bpm
  if (diff >= 0 && diff <= 2) return diff
  return 3 + Math.abs(diff)
}

// ---------------------------------------------------------------------------
// Greedy harmonic chaining
// ---------------------------------------------------------------------------

// Picks the best next track for `current` out of `pool` (which is never
// empty when this is called):
//
// 1. Hard filter - drop every candidate whose BPM deviates more than +/-6%
//    from `current`, unless that would remove every remaining candidate (in
//    that case the filter is skipped entirely, to avoid a dead end).
// 2. Score each surviving candidate with the harmonic Camelot rules above,
//    ignoring the ones that score 0 (no known compatibility).
// 3. Among the harmonically compatible candidates, pick the highest score;
//    ties are broken by `bpmTieBreakRank` (a small tempo increase wins).
// 4. Fallback - if no candidate scored above 0, pick whichever candidate has
//    the smallest raw percentage BPM deviation from `current`, so the chain
//    always has somewhere to go next.
function pickNextTrack(current: Track, pool: Track[]): Track {
  const withinBpmRange = pool.filter(
    (candidate) => bpmDeviationRatio(current, candidate) <= BPM_HARD_FILTER_RATIO
  )
  const candidates = withinBpmRange.length > 0 ? withinBpmRange : pool

  let best: Track | null = null
  let bestScore = 0
  let bestTieBreak = Infinity

  for (const candidate of candidates) {
    const score = trackHarmonicScore(current, candidate)
    if (score === 0) continue

    const tieBreak = bpmTieBreakRank(current, candidate)
    if (!best || score > bestScore || (score === bestScore && tieBreak < bestTieBreak)) {
      best = candidate
      bestScore = score
      bestTieBreak = tieBreak
    }
  }

  if (best) return best

  // Fallback: nothing was harmonically compatible - avoid a dead end by
  // taking whoever has the smallest percentage BPM deviation, ignoring the
  // "prefer a slight increase" preference used in the tie-break above.
  let fallback = candidates[0]
  let fallbackDeviation = bpmDeviationRatio(current, fallback)
  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i]
    const deviation = bpmDeviationRatio(current, candidate)
    if (deviation < fallbackDeviation) {
      fallback = candidate
      fallbackDeviation = deviation
    }
  }
  return fallback
}

// Greedy harmonic chain starting from `start`: at each step, picks the
// remaining track that best continues the mix from the current track (see
// `pickNextTrack`), appends it, and repeats from there.
export function buildSmartQueueOrder(start: Track, pool: Track[]): Track[] {
  const remaining = [...pool]
  const ordered: Track[] = []
  let current = start

  while (remaining.length > 0) {
    const next = pickNextTrack(current, remaining)
    remaining.splice(remaining.indexOf(next), 1)
    ordered.push(next)
    current = next
  }

  return ordered
}
