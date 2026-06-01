import { WaveformPeak } from '@renderer/components/Deck/waveformDrawHelpers'

export interface WaveformWindowData {
  peak: WaveformPeak
  rms: WaveformPeak
}

export interface WaveformAnalysisResult {
  peaks: WaveformPeak[]
  rms: WaveformPeak[]
}

export interface WaveformAnalyzerOptions {
  samplesPerWindow?: number
  lowCutoff?: number
  highCutoff?: number
}

/**
 * Runs the 3-band crossover filter network on a Float32Array of mono audio
 * using OfflineAudioContext.
 *
 * @param channelData The raw mono audio samples.
 * @param sampleRate The sample rate of the audio (e.g. 44100).
 * @param lowCutoff The crossover frequency for bass (default 150 Hz).
 * @param highCutoff The crossover frequency for highs (default 4000 Hz).
 * @returns Filtered channel buffers for low, mid, and high bands.
 */
export async function runCrossoverFilters(
  channelData: Float32Array,
  sampleRate: number,
  lowCutoff = 150,
  highCutoff = 4000
): Promise<{
  low: Float32Array
  mid: Float32Array
  high: Float32Array
}> {
  const length = channelData.length

  // Create OfflineAudioContext with 3 channels for low, mid, high outputs
  const offlineCtx = new OfflineAudioContext(3, length, sampleRate)

  // Create input buffer and load the channel data
  const sourceBuffer = offlineCtx.createBuffer(1, length, sampleRate)
  sourceBuffer.getChannelData(0).set(channelData)

  const sourceNode = offlineCtx.createBufferSource()
  sourceNode.buffer = sourceBuffer

  // 1. Low-pass filter for the bass band (< 150 Hz)
  const lowFilter = offlineCtx.createBiquadFilter()
  lowFilter.type = 'lowpass'
  lowFilter.frequency.value = lowCutoff
  lowFilter.Q.value = 1.0

  // 2. Mid-pass filter chain (150 Hz to 4000 Hz)
  const midHighpass = offlineCtx.createBiquadFilter()
  midHighpass.type = 'highpass'
  midHighpass.frequency.value = lowCutoff
  midHighpass.Q.value = 1.0

  const midLowpass = offlineCtx.createBiquadFilter()
  midLowpass.type = 'lowpass'
  midLowpass.frequency.value = highCutoff
  midLowpass.Q.value = 1.0

  // 3. High-pass filter for the highs band (> 4000 Hz)
  const highFilter = offlineCtx.createBiquadFilter()
  highFilter.type = 'highpass'
  highFilter.frequency.value = highCutoff
  highFilter.Q.value = 1.0

  // Create merger to map individual filter outputs to the context's 3 output channels
  const merger = offlineCtx.createChannelMerger(3)

  // Connect low band to destination channel 0
  sourceNode.connect(lowFilter)
  lowFilter.connect(merger, 0, 0)

  // Connect mid band (chained highpass + lowpass) to destination channel 1
  sourceNode.connect(midHighpass)
  midHighpass.connect(midLowpass)
  midLowpass.connect(merger, 0, 1)

  // Connect high band to destination channel 2
  sourceNode.connect(highFilter)
  highFilter.connect(merger, 0, 2)

  // Connect merger to offline context destination
  merger.connect(offlineCtx.destination)

  // Start rendering
  sourceNode.start(0)
  const renderedBuffer = await offlineCtx.startRendering()

  return {
    low: renderedBuffer.getChannelData(0),
    mid: renderedBuffer.getChannelData(1),
    high: renderedBuffer.getChannelData(2)
  }
}

/**
 * Iterates over the raw and filtered channel data to calculate
 * Peak and RMS values for consecutive time windows.
 * Optimized to avoid allocating memory inside the sample loop.
 */
export function computePeaksAndRms(
  lowData: Float32Array,
  midData: Float32Array,
  highData: Float32Array,
  allData: Float32Array,
  samplesPerWindow: number
): WaveformAnalysisResult {
  const length = allData.length
  const numWindows = Math.ceil(length / samplesPerWindow)

  const peaks: WaveformPeak[] = new Array(numWindows)
  const rms: WaveformPeak[] = new Array(numWindows)

  for (let w = 0; w < numWindows; w++) {
    const start = w * samplesPerWindow
    const end = Math.min(start + samplesPerWindow, length)
    const windowSize = end - start

    let peakLow = 0
    let peakMid = 0
    let peakHigh = 0
    let peakAll = 0

    let sumSqLow = 0
    let sumSqMid = 0
    let sumSqHigh = 0
    let sumSqAll = 0

    // Local registers to speed up access and avoid property lookups
    for (let i = start; i < end; i++) {
      const valLow = lowData[i]
      const valMid = midData[i]
      const valHigh = highData[i]
      const valAll = allData[i]

      // Absolute values for Peak extraction
      const absLow = valLow < 0 ? -valLow : valLow
      const absMid = valMid < 0 ? -valMid : valMid
      const absHigh = valHigh < 0 ? -valHigh : valHigh
      const absAll = valAll < 0 ? -valAll : valAll

      if (absLow > peakLow) peakLow = absLow
      if (absMid > peakMid) peakMid = absMid
      if (absHigh > peakHigh) peakHigh = absHigh
      if (absAll > peakAll) peakAll = absAll

      // Squared sum for RMS extraction
      sumSqLow += valLow * valLow
      sumSqMid += valMid * valMid
      sumSqHigh += valHigh * valHigh
      sumSqAll += valAll * valAll
    }

    // Compute final RMS values
    const rmsLow = Math.sqrt(sumSqLow / windowSize)
    const rmsMid = Math.sqrt(sumSqMid / windowSize)
    const rmsHigh = Math.sqrt(sumSqHigh / windowSize)
    const rmsAll = Math.sqrt(sumSqAll / windowSize)

    peaks[w] = {
      low: peakLow,
      mid: peakMid,
      high: peakHigh,
      all: peakAll
    }

    rms[w] = {
      low: rmsLow,
      mid: rmsMid,
      high: rmsHigh,
      all: rmsAll
    }
  }

  return { peaks, rms }
}

/**
 * Main entry point for analyzing a raw audio buffer's mono channel.
 * Performs frequency crossover filtering and computes peak/RMS values.
 *
 * @param channelData The raw mono float32 audio samples.
 * @param sampleRate The sample rate of the audio (e.g. 44100).
 * @param options Configurations for window size and filters.
 * @returns Resulting peak and RMS arrays.
 */
export async function analyzeWaveform(
  channelData: Float32Array,
  sampleRate: number,
  options: WaveformAnalyzerOptions = {}
): Promise<WaveformAnalysisResult> {
  // Default to 512 samples per window (approx. 86Hz sampling resolution at 44.1kHz)
  const samplesPerWindow = options.samplesPerWindow ?? 512
  const lowCutoff = options.lowCutoff ?? 150
  const highCutoff = options.highCutoff ?? 4000

  // Run the signal processing offline crossover filters
  const filtered = await runCrossoverFilters(channelData, sampleRate, lowCutoff, highCutoff)

  // Compute Peaks and RMS values
  return computePeaksAndRms(
    filtered.low,
    filtered.mid,
    filtered.high,
    channelData,
    samplesPerWindow
  )
}
