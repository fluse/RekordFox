import type { Track } from '@main/db'
import { parseCamelotKey, type CamelotKey } from './camelot'

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

// A track with no local file (not yet downloaded, or permanently failed to
// download) can't actually be played, so it has no place in a generated
// queue/shuffle - callers should filter with this before building context.
export function isTrackPlayable(track: Track): boolean {
  return Boolean(track.filepath) && !track.downloadFailed
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

// A mood shift (same number, letter flips) has no "up/down" like boost/drop
// does, but flipping to the major (B) side reads brighter/more energetic
// than flipping to the minor (A) side - so target energy still gets a say,
// just a gentler one than the full on/off treatment given to boost/drop.
const MOOD_SHIFT_MULTIPLIERS: Record<TargetEnergy, { toMajor: number; toMinor: number }> = {
  chill: { toMajor: 0.8, toMinor: 1.3 },
  balanced: { toMajor: 1, toMinor: 1 },
  high_energy: { toMajor: 1.3, toMinor: 0.8 }
}

function moodShiftMultiplierFor(targetEnergy: TargetEnergy, candidateKey: CamelotKey): number {
  const direction = candidateKey.letter === 'B' ? 'toMajor' : 'toMinor'
  return MOOD_SHIFT_MULTIPLIERS[targetEnergy][direction]
}

// Target energy expressed as a signed direction (-1 chill .. +1 high_energy),
// combined with the phase's own energy direction (see `PhaseContext.energyBias`)
// to drive the continuous BPM-trend scoring below. This is what lets target
// energy and set profile influence *any* transition, not just boost/drop.
const TARGET_ENERGY_BIAS: Record<TargetEnergy, number> = {
  chill: -1,
  balanced: 0,
  high_energy: 1
}

function combinedEnergyBias(phase: PhaseContext, targetEnergy: TargetEnergy): number {
  const combined = phase.energyBias * 0.5 + TARGET_ENERGY_BIAS[targetEnergy] * 0.5
  return Math.max(-1, Math.min(1, combined))
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
  // This phase's own tempo direction (-1 falling .. +1 rising), independent
  // of target energy - combined with it in `combinedEnergyBias` to drive the
  // continuous BPM-trend score applied to every transition type.
  energyBias: number
}

const NEUTRAL_PHASE: PhaseContext = {
  name: 'steady',
  perfectSeamlessMultiplier: 1,
  boostMultiplier: 1,
  dropMultiplier: 1,
  bpmIncreaseBonusWeight: 0,
  energyBias: 0
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
      bpmIncreaseBonusWeight: 0,
      energyBias: 0
    }
  }
  if (progress < 0.6) {
    return {
      name: 'buildup',
      perfectSeamlessMultiplier: 1,
      boostMultiplier: 2.6,
      dropMultiplier: 1,
      bpmIncreaseBonusWeight: 3,
      energyBias: 0.7
    }
  }
  if (progress < 0.75) {
    return {
      name: 'cooldown',
      perfectSeamlessMultiplier: 1,
      boostMultiplier: 0.3,
      dropMultiplier: 2.5,
      bpmIncreaseBonusWeight: 0,
      energyBias: -0.7
    }
  }
  return {
    name: 'finalPeak',
    perfectSeamlessMultiplier: 1,
    boostMultiplier: 3.2,
    dropMultiplier: 0.1,
    bpmIncreaseBonusWeight: 0,
    energyBias: 1
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
    bpmIncreaseBonusWeight: bias > 0 ? bias * 2 : 0,
    energyBias: bias
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

function bpmIncreaseBonus(current: Track, candidate: Track, weight: number): number {
  if (weight <= 0 || !current.bpm || !candidate.bpm) return 0
  const delta = candidate.bpm - current.bpm
  if (delta <= 0) return 0
  return Math.min(delta, 4) * weight
}

// Points per BPM of tempo change that aligns with `bias`, capped so a single
// outlier BPM can't swamp the harmonic score. Unlike `bpmIncreaseBonus` (a
// one-sided buildup-only nudge), this is signed and applied to *every*
// transition type, so target energy/phase can flip the pick between two
// otherwise-equal candidates even when neither is a boost/drop.
const BPM_TREND_WEIGHT = 2
const BPM_TREND_CAP = 10

function bpmTrendScore(current: Track, candidate: Track, bias: number): number {
  if (bias === 0 || !current.bpm || !candidate.bpm) return 0
  const delta = candidate.bpm - current.bpm
  const clampedDelta = Math.max(-BPM_TREND_CAP, Math.min(BPM_TREND_CAP, delta))
  return clampedDelta * bias * BPM_TREND_WEIGHT
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

// Combines transition base score, target-energy bias and phase multiplier
// into the final candidate score, then layers on the continuous BPM-trend
// bias so target energy/phase can still tip the balance even between two
// candidates of the *same* transition type (e.g. two perfect-key matches at
// different BPMs) - which is the common case in key-dense real libraries.
// Returns 0 for anything harmonically incompatible, or explicitly zeroed out
// by the target energy setting.
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

  let energyMultiplier = energyMultiplierFor(options.targetEnergy, transition)
  if (transition === 'moodShift') {
    energyMultiplier *= moodShiftMultiplierFor(options.targetEnergy, candidateKey)
  }
  if (energyMultiplier === 0) return 0

  const score = base * phaseMultiplierFor(phase, transition) * energyMultiplier
  const bias = combinedEnergyBias(phase, options.targetEnergy)
  return (
    score +
    bpmIncreaseBonus(current, candidate, phase.bpmIncreaseBonusWeight) +
    bpmTrendScore(current, candidate, bias)
  )
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

// Hard BPM filter for `current`: drops every candidate whose BPM deviates
// more than the configured tolerance, unless that would remove every
// candidate (in that case the filter is skipped, to avoid a dead end).
function candidatesWithinTolerance(
  current: Track,
  pool: Track[],
  options: SmartModeOptions
): Track[] {
  const toleranceRatio = BPM_TOLERANCE_RATIO[options.bpmTolerance]
  const withinRange = pool.filter(
    (candidate) => bpmDeviationRatio(current, candidate) <= toleranceRatio
  )
  return withinRange.length > 0 ? withinRange : pool
}

interface ScoredCandidate {
  track: Track
  score: number
}

// Scores every candidate against `current` and returns the ones that scored
// above 0, best first.
function rankCandidates(
  current: Track,
  candidates: Track[],
  options: SmartModeOptions,
  phase: PhaseContext
): ScoredCandidate[] {
  return candidates
    .map((track) => ({ track, score: scoreCandidate(current, track, options, phase) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
}

const LOOKAHEAD_DEPTH = 3
const LOOKAHEAD_BREADTH = 4

// Simulates up to `steps` further greedy picks (always taking the top-ranked
// candidate at each simulated step) and sums their scores. Used only to
// compare *this* step's shortlisted candidates against each other - once a
// track is actually committed in `buildHarmonicChain`, the real next pick
// re-plans from scratch against the real remaining pool.
function simulateContinuationScore(
  current: Track,
  pool: Track[],
  options: SmartModeOptions,
  trackIndex: number,
  steps: number
): number {
  if (steps <= 0 || pool.length === 0) return 0

  const phase = resolvePhaseContext(options, trackIndex)
  const candidates = candidatesWithinTolerance(current, pool, options)
  const ranked = rankCandidates(current, candidates, options, phase)
  if (ranked.length === 0) return 0

  const best = ranked[0]
  const remaining = pool.filter((track) => track !== best.track)
  return (
    best.score +
    simulateContinuationScore(best.track, remaining, options, trackIndex + 1, steps - 1)
  )
}

// Picks the best next track for `current` out of `pool` (which is never
// empty when this is called):
//
// 1. Hard filter via `candidatesWithinTolerance`.
// 2. Rank the survivors by `scoreCandidate` (harmonic base score, then
//    target-energy/phase multipliers, mood-shift tuning, and the BPM-trend
//    bias, all layered together).
// 3. Fallback - if nothing scored above 0, pick whichever candidate has the
//    smallest raw percentage BPM deviation from `current`.
// 4. Lookahead - rather than blindly taking the single top-ranked candidate,
//    shortlist the top `LOOKAHEAD_BREADTH` and simulate `LOOKAHEAD_DEPTH - 1`
//    further greedy steps from each. This avoids a locally-perfect pick (an
//    easy same-key match) locking in a track that leads nowhere useful for
//    the next couple of steps - important for profiles whose curve only
//    shows up over several tracks (rollercoaster, classic_peak).
function pickNextTrack(
  current: Track,
  pool: Track[],
  options: SmartModeOptions,
  trackIndex: number
): Track {
  const candidates = candidatesWithinTolerance(current, pool, options)
  const phase = resolvePhaseContext(options, trackIndex)
  const ranked = rankCandidates(current, candidates, options, phase)
  if (ranked.length === 0) return pickClosestBpm(current, candidates)

  const shortlist = ranked.slice(0, LOOKAHEAD_BREADTH)
  if (shortlist.length === 1) return shortlist[0].track

  let best = shortlist[0]
  let bestTotal = -Infinity

  for (const candidate of shortlist) {
    const remaining = pool.filter((track) => track !== candidate.track)
    const total =
      candidate.score +
      simulateContinuationScore(
        candidate.track,
        remaining,
        options,
        trackIndex + 1,
        LOOKAHEAD_DEPTH - 1
      )
    if (total > bestTotal) {
      bestTotal = total
      best = candidate
    }
  }

  return best.track
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
  const remaining = pool.filter(isTrackPlayable)
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
