import { spawn } from 'child_process'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'

export interface BeatGridResult {
  bpm: number
  // Seconds; position of a beat that lies exactly on the detected tempo grid. Since the grid
  // repeats every beat period, this is only ever the *phase* of the grid (mod one beat), not
  // necessarily the track's first audible beat — Rekordbox extrapolates forward/backward from
  // it using the constant BPM, so any on-grid position is equally valid as a TEMPO Inizio.
  gridOffset: number
}

/**
 * Analyzes the BPM and beat grid phase of an audio file using FFmpeg for decoding
 * and a Harmonic Product Spectrum (HPS) approach on the autocorrelation.
 * Analyzes the first 60 seconds (like Rekordbox).
 */
export async function analyzeBeatGrid(filepath: string): Promise<BeatGridResult> {
  const SAMPLE_RATE = 22050
  const TOTAL_SAMPLES = SAMPLE_RATE * 60

  const pcmData = await decodeToPcm(filepath, SAMPLE_RATE, TOTAL_SAMPLES)

  if (pcmData.length < SAMPLE_RATE * 4) {
    return { bpm: 0, gridOffset: 0 }
  }

  return detectBeatGrid(pcmData, SAMPLE_RATE)
}

/**
 * Decode audio to mono float32 PCM using FFmpeg.
 */
function decodeToPcm(
  filepath: string,
  sampleRate: number,
  maxSamples: number
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const args = [
      '-i',
      filepath,
      '-f',
      'f32le',
      '-ac',
      '1',
      '-ar',
      String(sampleRate),
      '-t',
      '60',
      'pipe:1'
    ]

    const ffmpeg = spawn(ffmpegPath.path, args, { stdio: ['ignore', 'pipe', 'pipe'] })

    const chunks: Buffer[] = []
    let totalBytes = 0
    const maxBytes = maxSamples * 4

    ffmpeg.stdout.on('data', (chunk: Buffer) => {
      if (totalBytes < maxBytes) {
        const remaining = maxBytes - totalBytes
        chunks.push(chunk.length > remaining ? chunk.slice(0, remaining) : chunk)
        totalBytes += Math.min(chunk.length, remaining)
      }
    })

    ffmpeg.on('error', (err) => reject(new Error(`FFmpeg spawn error: ${err.message}`)))

    ffmpeg.on('close', (code) => {
      if (code !== 0 && chunks.length === 0) {
        reject(new Error(`FFmpeg exited with code ${code}`))
        return
      }
      const combined = Buffer.concat(chunks)
      resolve(new Float32Array(combined.buffer, combined.byteOffset, combined.length / 4))
    })
  })
}

/**
 * BPM and beat grid phase detection using Harmonic Product Spectrum (HPS) on the autocorrelation.
 *
 * The core idea: the autocorrelation of a beat signal has peaks at the beat period
 * AND at its multiples (half-tempo, quarter-tempo, etc.). A naive search finds the
 * strongest peak, which is often the half-tempo (2x the beat period).
 *
 * HPS solves this by multiplying the autocorrelation with downsampled versions of
 * itself. Sub-tempo peaks (which don't align with harmonics) are suppressed, while
 * the true tempo peak (which aligns at all harmonic levels) is reinforced.
 *
 * This is the same principle used in Ableton Live and professional BPM analyzers.
 * Once the beat period is known, the same onset envelope is reused to find the
 * grid's phase (see step 7) so the caller can anchor a constant-tempo beat grid.
 */
export function detectBeatGrid(samples: Float32Array, sampleRate: number): BeatGridResult {
  // --- Step 1: Compute onset strength envelope ---
  // Use a small hop for high temporal resolution.
  const HOP = 256
  const WIN = 1024

  const numFrames = Math.floor((samples.length - WIN) / HOP)
  const onset = new Float32Array(numFrames)

  let prevRms = 0
  for (let i = 0; i < numFrames; i++) {
    const offset = i * HOP
    let sum = 0
    for (let j = 0; j < WIN; j++) {
      const s = samples[offset + j] || 0
      sum += s * s
    }
    const rms = Math.sqrt(sum / WIN)
    // Half-wave rectify: only keep increases in energy (onsets)
    onset[i] = Math.max(0, rms - prevRms)
    prevRms = rms
  }

  // --- Step 2: Autocorrelate the onset envelope ---
  // Candidate BPM range: 80–185 BPM (covers house, techno, drum & bass)
  // We search DOWN to 55 BPM internally so HPS can rescue the half-tempo cases.
  const fps = sampleRate / HOP // frames per second ≈ 86.1
  const minLag = Math.max(1, Math.round((fps * 60) / 185)) // 185 BPM
  const maxLag = Math.round((fps * 60) / 55) // 55 BPM

  const acf = new Float32Array(maxLag + 1)

  // Compute normalized autocorrelation for each lag
  let power = 0
  for (let i = 0; i < onset.length; i++) power += onset[i] * onset[i]

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0
    const len = onset.length - lag
    for (let i = 0; i < len; i++) {
      sum += onset[i] * onset[i + lag]
    }
    acf[lag] = power > 0 ? sum / power : 0
  }

  // --- Step 3: Harmonic Product Spectrum ---
  // For each candidate lag L (tempo T), compute a combined score that
  // sums the autocorrelation at L and its sub-multiples (L*2, L*3):
  //
  //   hps[L] = acf[L] + w2*acf[2L] + w3*acf[3L] + w4*acf[4L]
  //
  // If L is the HALF-tempo lag (i.e., 2x the real lag), then:
  //   hps[L_half] gets a bonus from acf[L_real] (which is acf[2*L_half])
  //
  // But the TRUE tempo lag L_real gets an even bigger bonus because:
  //   hps[L_real] = acf[L_real] (strong) + w2*acf[2*L_real] (strong half-tempo) + ...
  //
  // Weight scheme: diminishing returns per harmonic level
  const w2 = 0.5 // weight for 2x lag (half tempo)
  const w3 = 0.25 // weight for 3x lag (1/3 tempo)
  const w4 = 0.125 // weight for 4x lag (1/4 tempo)

  let bestLag = minLag
  let bestScore = -Infinity

  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = acf[lag]

    const lag2 = lag * 2
    const lag3 = lag * 3
    const lag4 = lag * 4

    if (lag2 <= maxLag) score += w2 * acf[lag2]
    if (lag3 <= maxLag) score += w3 * acf[lag3]
    if (lag4 <= maxLag) score += w4 * acf[lag4]

    if (score > bestScore) {
      bestScore = score
      bestLag = lag
    }
  }

  // --- Step 4: Sub-lag refinement ---
  // The integer-lag peak is coarse (at 128 BPM one lag step is already a few
  // BPM). Fit a parabola through the peak and its neighbors to interpolate
  // the true peak position between samples, matching Rekordbox's fractional
  // (e.g. 127.98) precision instead of snapping to whole BPM values.
  const refinedLag = refinePeakLag(acf, bestLag, minLag, maxLag)

  // --- Step 5: Convert best lag → BPM ---
  const rawBpm = (fps * 60) / refinedLag

  // --- Step 6: Octave correction ---
  // Normalize into the 80–185 BPM range by doubling/halving.
  // This handles edge cases where the HPS still finds a sub-octave. Track the
  // applied scale so the beat *period* used for grid phase detection (step 7)
  // stays in sync with the reported BPM — otherwise the phase search below
  // would look for onsets every 2 (or every half) beats instead of every beat.
  let bpm = rawBpm
  let periodScale = 1
  while (bpm < 80) {
    bpm *= 2
    periodScale /= 2
  }
  while (bpm > 185) {
    bpm /= 2
    periodScale *= 2
  }

  // --- Step 7: Beat grid phase detection ---
  // With the beat period known, find the frame offset (mod one period) whose
  // onset energy, summed across the whole analyzed window, is strongest —
  // i.e. the phase most consistently hit by real beats. This is a comb filter
  // over the same onset envelope from step 1, no extra decoding needed.
  const gridPeriodFrames = Math.max(1, Math.round(refinedLag * periodScale))
  const gridPhaseFrame = findGridPhaseFrame(onset, gridPeriodFrames)
  const gridOffset = Math.round(((gridPhaseFrame * HOP) / sampleRate) * 1000) / 1000

  return { bpm: Math.round(bpm * 100) / 100, gridOffset }
}

/**
 * Finds the frame offset in [0, period) that maximizes the summed onset energy
 * at offset, offset+period, offset+2*period, ... — i.e. the beat grid's phase.
 */
function findGridPhaseFrame(onset: Float32Array, period: number): number {
  if (period <= 0 || period >= onset.length) return 0

  let bestPhase = 0
  let bestScore = -Infinity

  for (let phase = 0; phase < period; phase++) {
    let score = 0
    for (let i = phase; i < onset.length; i += period) {
      score += onset[i]
    }
    if (score > bestScore) {
      bestScore = score
      bestPhase = phase
    }
  }

  return bestPhase
}

/**
 * Quadratic (parabolic) interpolation around the discrete peak lag using its
 * immediate neighbors in the autocorrelation. Returns a fractional lag.
 */
function refinePeakLag(acf: Float32Array, lag: number, minLag: number, maxLag: number): number {
  if (lag <= minLag || lag >= maxLag) return lag

  const y0 = acf[lag - 1]
  const y1 = acf[lag]
  const y2 = acf[lag + 1]
  const denom = y0 - 2 * y1 + y2
  if (denom === 0) return lag

  const offset = (0.5 * (y0 - y2)) / denom
  // Guard against pathological offsets from near-flat neighborhoods.
  if (offset <= -1 || offset >= 1) return lag

  return lag + offset
}
