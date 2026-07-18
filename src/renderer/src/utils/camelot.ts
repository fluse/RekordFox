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
// Smart mode options
// ---------------------------------------------------------------------------

export type BpmTolerance = 'strict' | 'normal' | 'loose'
export type TargetEnergy = 'chill' | 'balanced' | 'high_energy'
export type SetProfile = 'classic_peak' | 'rollercoaster' | 'steady'

export interface SmartModeOptions {
  /** Hard filter on candidate BPM deviation from the current track. */
  bpmTolerance: BpmTolerance
  /** Global bias towards/away from energy-changing (boost/drop) transitions. */
  targetEnergy: TargetEnergy
  /** Shape of the energy curve across the generated chain. */
  setProfile: SetProfile
  /** Chain length; also the denominator for phase-progress calculations. */
  maxTracks: number
}

export const DEFAULT_SMART_MODE_OPTIONS: SmartModeOptions = {
  bpmTolerance: 'normal',
  targetEnergy: 'balanced',
  setProfile: 'classic_peak',
  maxTracks: 20
}

// Hard-filter thresholds: candidates whose BPM deviates from the current
// track by more than this fraction are excluded (unless that would leave no
// candidates at all - see `pickNextTrack`).
const BPM_TOLERANCE_RATIO: Record<BpmTolerance, number> = {
  strict: 0.03,
  normal: 0.06,
  loose: 0.1
}

// ---------------------------------------------------------------------------
// Harmonic transition classification
//
// The Camelot wheel has 12 numeric positions (1-12) arranged in a circle,
// each with an 'A' (minor) and 'B' (major) side. Unlike a plain distance
// metric, the direction of the step matters here: going from 8A to 10A
// ("+2", an energy boost) is not the same transition as going from 8A to
// 6A ("-2", an energy drop), even though both are two wheel steps away.
// ---------------------------------------------------------------------------

export type HarmonicTransition =
  | 'perfect'
  | 'seamless'
  | 'moodShift'
  | 'energyBoost'
  | 'energyDrop'
  | 'incompatible'

const BASE_SCORES: Record<HarmonicTransition, number> = {
  perfect: 100,
  seamless: 80,
  moodShift: 70,
  energyBoost: 50,
  energyDrop: 40,
  incompatible: 0
}

// Signed step count from `fromNum` to `toNum` around the 12-position wheel,
// normalized to the range -6..+6 (e.g. 8 -> 10 is +2, 8 -> 6 is -2, and a
// step that wraps past 12 back to 1 is still counted as the shorter +/-
// distance, e.g. 11 -> 1 is +2, not +10 or -10).
function signedWheelStep(fromNum: number, toNum: number): number {
  const normalized = (((toNum - fromNum) % 12) + 12) % 12 // always 0..11
  return normalized > 6 ? normalized - 12 : normalized
}

// Classifies the transition from `current` to `candidate` per the harmonic
// mixing rules: perfect (identical key), seamless (+/-1 step, same letter),
// mood shift (same number, letter flips), energy boost (+2, same letter),
// energy drop (-2, same letter), otherwise incompatible.
function classifyTransition(current: CamelotKey, candidate: CamelotKey): HarmonicTransition {
  const sameLetter = current.letter === candidate.letter
  const step = signedWheelStep(current.num, candidate.num)

  if (step === 0 && sameLetter) return 'perfect'
  if (sameLetter && (step === 1 || step === -1)) return 'seamless'
  if (step === 0 && !sameLetter) return 'moodShift'
  if (sameLetter && step === 2) return 'energyBoost'
  if (sameLetter && step === -2) return 'energyDrop'
  return 'incompatible'
}

// ---------------------------------------------------------------------------
// Target energy - a global bias applied on top of the phase curve below.
// ---------------------------------------------------------------------------

// Multiplier overrides per transition; anything not listed defaults to 1
// (target energy only ever tunes the energy-changing transitions).
const ENERGY_MULTIPLIERS: Record<TargetEnergy, Partial<Record<HarmonicTransition, number>>> = {
  chill: { energyBoost: 0, energyDrop: 1.8 },
  balanced: {},
  high_energy: { energyBoost: 1.8, energyDrop: 0 }
}

function energyMultiplierFor(targetEnergy: TargetEnergy, transition: HarmonicTransition): number {
  return ENERGY_MULTIPLIERS[targetEnergy][transition] ?? 1
}

// ---------------------------------------------------------------------------
// Phase curve - shapes how strongly boosts/drops score as the chain
// progresses, per `setProfile`.
// ---------------------------------------------------------------------------

interface PhaseContext {
  name: string
  perfectSeamlessMultiplier: number
  boostMultiplier: number
  dropMultiplier: number
  // Points awarded per BPM of positive tempo change, on top of the harmonic
  // score - used to nudge the chain towards rising energy during build-ups.
  bpmIncreaseBonusWeight: number
}

const NEUTRAL_PHASE: PhaseContext = {
  name: 'steady',
  perfectSeamlessMultiplier: 1,
  boostMultiplier: 1,
  dropMultiplier: 1,
  bpmIncreaseBonusWeight: 0
}

// classic_peak: a 4-phase arc across the chain (warm-up, build-up,
// cool-down, final peak), driven by how far `trackIndex` is into `maxTracks`.
function computeClassicPeakPhase(options: SmartModeOptions, trackIndex: number): PhaseContext {
  const progress = options.maxTracks > 0 ? trackIndex / options.maxTracks : 0

  if (progress < 0.25) {
    return {
      name: 'warmup',
      perfectSeamlessMultiplier: 1,
      boostMultiplier: 0.2,
      dropMultiplier: 0.2,
      bpmIncreaseBonusWeight: 0
    }
  }
  if (progress < 0.6) {
    return {
      name: 'buildup',
      perfectSeamlessMultiplier: 1,
      boostMultiplier: 2.6,
      dropMultiplier: 1,
      bpmIncreaseBonusWeight: 3
    }
  }
  if (progress < 0.75) {
    return {
      name: 'cooldown',
      perfectSeamlessMultiplier: 1,
      boostMultiplier: 0.3,
      dropMultiplier: 2.5,
      bpmIncreaseBonusWeight: 0
    }
  }
  return {
    name: 'finalPeak',
    perfectSeamlessMultiplier: 1,
    boostMultiplier: 3.2,
    dropMultiplier: 0.1,
    bpmIncreaseBonusWeight: 0
  }
}

// rollercoaster: fast, repeated swings between "favor boost" and "favor
// drop" rather than one long arc - the cycle length scales with maxTracks
// but stays short, so the energy visibly zig-zags every few tracks.
function computeRollercoasterPhase(options: SmartModeOptions, trackIndex: number): PhaseContext {
  const cycleLength = Math.max(2, Math.round(options.maxTracks / 6))
  const bias = Math.sin((2 * Math.PI * trackIndex) / cycleLength) // -1..1

  return {
    name: 'rollercoaster',
    perfectSeamlessMultiplier: 1,
    boostMultiplier: bias > 0 ? 1 + bias * 1.6 : 1 - Math.abs(bias) * 0.7,
    dropMultiplier: bias < 0 ? 1 + Math.abs(bias) * 1.6 : 1 - bias * 0.7,
    bpmIncreaseBonusWeight: bias > 0 ? bias * 2 : 0
  }
}

function resolvePhaseContext(options: SmartModeOptions, trackIndex: number): PhaseContext {
  switch (options.setProfile) {
    case 'classic_peak':
      return computeClassicPeakPhase(options, trackIndex)
    case 'rollercoaster':
      return computeRollercoasterPhase(options, trackIndex)
    case 'steady':
    default:
      return NEUTRAL_PHASE
  }
}

function phaseMultiplierFor(phase: PhaseContext, transition: HarmonicTransition): number {
  switch (transition) {
    case 'perfect':
    case 'seamless':
      return phase.perfectSeamlessMultiplier
    case 'energyBoost':
      return phase.boostMultiplier
    case 'energyDrop':
      return phase.dropMultiplier
    default:
      return 1
  }
}

// ---------------------------------------------------------------------------
// BPM rules
// ---------------------------------------------------------------------------

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

function bpmIncreaseBonus(current: Track, candidate: Track, weight: number): number {
  if (weight <= 0 || !current.bpm || !candidate.bpm) return 0
  const delta = candidate.bpm - current.bpm
  if (delta <= 0) return 0
  return Math.min(delta, 4) * weight
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

// Combines transition base score, target-energy bias and phase multiplier
// into the final candidate score. Returns 0 for anything harmonically
// incompatible, or explicitly zeroed out by the target energy setting.
function scoreCandidate(
  current: Track,
  candidate: Track,
  options: SmartModeOptions,
  phase: PhaseContext
): number {
  const currentKey = parseCamelotKey(current.key)
  const candidateKey = parseCamelotKey(candidate.key)
  if (!currentKey || !candidateKey) return 0

  const transition = classifyTransition(currentKey, candidateKey)
  const base = BASE_SCORES[transition]
  if (base === 0) return 0

  const energyMultiplier = energyMultiplierFor(options.targetEnergy, transition)
  if (energyMultiplier === 0) return 0

  const score = base * phaseMultiplierFor(phase, transition) * energyMultiplier
  return score + bpmIncreaseBonus(current, candidate, phase.bpmIncreaseBonusWeight)
}

// ---------------------------------------------------------------------------
// Greedy harmonic chaining
// ---------------------------------------------------------------------------

function pickClosestBpm(current: Track, candidates: Track[]): Track {
  let fallback = candidates[0]
  let fallbackDeviation = bpmDeviationRatio(current, fallback)
  for (let i = 1; i < candidates.length; i++) {
    const deviation = bpmDeviationRatio(current, candidates[i])
    if (deviation < fallbackDeviation) {
      fallback = candidates[i]
      fallbackDeviation = deviation
    }
  }
  return fallback
}

// Picks the best next track for `current` out of `pool` (which is never
// empty when this is called):
//
// 1. Hard filter - drop every candidate whose BPM deviates more than the
//    configured tolerance from `current`, unless that would remove every
//    remaining candidate (in that case the filter is skipped, to avoid a
//    dead end).
// 2. Score each surviving candidate (harmonic base score, then target-energy
//    and phase-curve multipliers, plus any BPM-increase bonus).
// 3. Among candidates that scored above 0, pick the highest score; ties are
//    broken by `bpmTieBreakRank` (a small tempo increase wins).
// 4. Fallback - if nothing scored above 0, pick whichever candidate has the
//    smallest raw percentage BPM deviation from `current`.
function pickNextTrack(
  current: Track,
  pool: Track[],
  options: SmartModeOptions,
  trackIndex: number
): Track {
  const toleranceRatio = BPM_TOLERANCE_RATIO[options.bpmTolerance]
  const withinBpmRange = pool.filter(
    (candidate) => bpmDeviationRatio(current, candidate) <= toleranceRatio
  )
  const candidates = withinBpmRange.length > 0 ? withinBpmRange : pool
  const phase = resolvePhaseContext(options, trackIndex)

  let best: Track | null = null
  let bestScore = 0
  let bestTieBreak = Infinity

  for (const candidate of candidates) {
    const score = scoreCandidate(current, candidate, options, phase)
    if (score <= 0) continue

    const tieBreak = bpmTieBreakRank(current, candidate)
    if (!best || score > bestScore || (score === bestScore && tieBreak < bestTieBreak)) {
      best = candidate
      bestScore = score
      bestTieBreak = tieBreak
    }
  }

  return best ?? pickClosestBpm(current, candidates)
}

// Builds a harmonic chain starting from `start`: at each step, picks the
// remaining track that best continues the mix from the current track (see
// `pickNextTrack`), appends it, and repeats until `pool` is exhausted or
// `options.maxTracks` tracks have been chained.
export function buildHarmonicChain(
  start: Track,
  pool: Track[],
  options?: Partial<SmartModeOptions>
): Track[] {
  const resolvedOptions: SmartModeOptions = { ...DEFAULT_SMART_MODE_OPTIONS, ...options }
  const remaining = [...pool]
  const ordered: Track[] = []
  let current = start

  while (remaining.length > 0 && ordered.length < resolvedOptions.maxTracks) {
    const next = pickNextTrack(current, remaining, resolvedOptions, ordered.length)
    remaining.splice(remaining.indexOf(next), 1)
    ordered.push(next)
    current = next
  }

  return ordered
}

// Convenience entry point for the preview queue: reorders the *entire*
// upcoming pool (not capped to a fixed track count) by using the pool size
// itself as `maxTracks`, so the phase curve still spans the whole chain.
// Any `maxTracks` passed in `options` is ignored for that reason.
export function buildSmartQueueOrder(
  start: Track,
  pool: Track[],
  options?: Partial<Omit<SmartModeOptions, 'maxTracks'>>
): Track[] {
  return buildHarmonicChain(start, pool, { ...options, maxTracks: pool.length })
}
