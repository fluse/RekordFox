import { WaveformPeak } from '@renderer/components/Deck/waveformDrawHelpers'

/**
 * Downsamples a list of float peaks (arbitrary length) to a fixed length (normally 400 peaks).
 * Uses peak-maximum selection inside each bucket to retain high-amplitude transients.
 *
 * @param peaks Array of original WaveformPeak objects.
 * @param targetLength Desired length of the output array (default 400).
 * @returns A new array of exactly targetLength peaks.
 */
export function downsampleToOverview(peaks: WaveformPeak[], targetLength = 400): WaveformPeak[] {
  const N = peaks.length
  const result: WaveformPeak[] = new Array(targetLength)

  if (N === 0) {
    // Return empty peaks
    for (let i = 0; i < targetLength; i++) {
      result[i] = { low: 0, mid: 0, high: 0, all: 0 }
    }
    return result
  }

  for (let t = 0; t < targetLength; t++) {
    // Map bin index t to source index range [start, end)
    const start = Math.floor((t / targetLength) * N)
    const end = Math.max(start + 1, Math.floor(((t + 1) / targetLength) * N))

    let maxLow = 0
    let maxMid = 0
    let maxHigh = 0
    let maxAll = 0

    // Find the maximum value in this bucket for all bands
    const limit = end < N ? end : N
    for (let i = start; i < limit; i++) {
      const p = peaks[i]
      if (p.low > maxLow) maxLow = p.low
      if (p.mid > maxMid) maxMid = p.mid
      if (p.high > maxHigh) maxHigh = p.high
      if (p.all > maxAll) maxAll = p.all
    }

    result[t] = {
      low: maxLow,
      mid: maxMid,
      high: maxHigh,
      all: maxAll
    }
  }

  return result
}

/**
 * Maps a float audio parameter (typically between 0.0 and 1.0)
 * to an integer represented by a specific number of bits.
 * Uses bitwise operations and inline checks for performance and GC efficiency.
 *
 * @param value The float value to scale (typically 0.0 to 1.0).
 * @param maxBits The number of bits for the output value (e.g. 5 for 0-31 range).
 * @returns A clamped integer in the range [0, 2^maxBits - 1].
 */
export function scaleFloatToInt(value: number, maxBits: number): number {
  const maxVal = (1 << maxBits) - 1
  const scaled = Math.round(value * maxVal)
  return scaled < 0 ? 0 : scaled > maxVal ? maxVal : scaled
}

/**
 * Scales an entire array of float-valued WaveformPeaks to their B-bit integer representations.
 * Supports a pre-allocated output array to avoid garbage collection churn.
 *
 * @param peaks Array of original WaveformPeak objects.
 * @param maxBits The number of bits for target integer scaling.
 * @param out Optional pre-allocated array of WaveformPeaks to write into.
 * @returns The scaled array (either out or a new array).
 */
export function scalePeaksToBits(
  peaks: WaveformPeak[],
  maxBits: number,
  out?: WaveformPeak[]
): WaveformPeak[] {
  const length = peaks.length
  const result = out ?? new Array<WaveformPeak>(length)

  for (let i = 0; i < length; i++) {
    const p = peaks[i]
    const low = scaleFloatToInt(p.low, maxBits)
    const mid = scaleFloatToInt(p.mid, maxBits)
    const high = scaleFloatToInt(p.high, maxBits)
    const all = scaleFloatToInt(p.all, maxBits)

    if (result[i]) {
      // Re-use existing object properties to avoid GC allocations
      const res = result[i]
      res.low = low
      res.mid = mid
      res.high = high
      res.all = all
    } else {
      result[i] = { low, mid, high, all }
    }
  }

  return result
}
