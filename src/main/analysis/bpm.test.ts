import { unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { analyzeBeatGrid, detectBeatGrid } from './bpm'

const SAMPLE_RATE = 22050

// Builds a synthetic "click track": short percussive-like bursts at a steady BPM,
// starting at `firstBeatSec`, on an otherwise silent signal. Lets detectBeatGrid be
// tested against a known-ground-truth tempo and phase without a real audio fixture.
function buildClickTrack(
  durationSec: number,
  bpm: number,
  firstBeatSec: number,
  sampleRate = SAMPLE_RATE
): Float32Array {
  const totalSamples = Math.floor(sampleRate * durationSec)
  const samples = new Float32Array(totalSamples)
  const period = (60 / bpm) * sampleRate
  const clickLength = Math.floor(sampleRate * 0.03)

  for (let beat = firstBeatSec * sampleRate; beat < totalSamples; beat += period) {
    const start = Math.round(beat)
    for (let i = 0; i < clickLength && start + i < totalSamples; i++) {
      const t = i / sampleRate
      samples[start + i] = Math.sin(2 * Math.PI * 1000 * t) * (1 - i / clickLength)
    }
  }

  return samples
}

function writeWavFile(path: string, samples: Float32Array, sampleRate: number): void {
  const dataSize = samples.length * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2)
  }

  writeFileSync(path, buffer)
}

describe('detectBeatGrid', () => {
  it('detects the BPM of a steady 128 BPM click track', () => {
    const samples = buildClickTrack(10, 128, 0.1)
    const { bpm } = detectBeatGrid(samples, SAMPLE_RATE)
    expect(bpm).toBeGreaterThan(126)
    expect(bpm).toBeLessThan(130)
  })

  it('detects a different BPM correctly (not hardcoded to one tempo)', () => {
    const samples = buildClickTrack(10, 100, 0.1)
    const { bpm } = detectBeatGrid(samples, SAMPLE_RATE)
    expect(bpm).toBeGreaterThan(98)
    expect(bpm).toBeLessThan(102)
  })

  it('finds the grid phase close to the true first-beat offset', () => {
    const samples = buildClickTrack(10, 128, 0.12)
    const { gridOffset } = detectBeatGrid(samples, SAMPLE_RATE)
    expect(Math.abs(gridOffset - 0.12)).toBeLessThan(0.02)
  })

  it('reports a phase near zero when the beat starts exactly at t=0', () => {
    const samples = buildClickTrack(10, 128, 0)
    const { gridOffset } = detectBeatGrid(samples, SAMPLE_RATE)
    expect(gridOffset).toBeLessThan(0.02)
  })

  it('keeps the grid phase within one beat period', () => {
    const bpm = 128
    const samples = buildClickTrack(10, bpm, 0.3)
    const result = detectBeatGrid(samples, SAMPLE_RATE)
    expect(result.gridOffset).toBeGreaterThanOrEqual(0)
    expect(result.gridOffset).toBeLessThan(60 / result.bpm)
  })

  it('normalizes into the 80-185 BPM range even on silence', () => {
    const samples = new Float32Array(SAMPLE_RATE * 10)
    const { bpm, gridOffset } = detectBeatGrid(samples, SAMPLE_RATE)
    expect(bpm).toBeGreaterThanOrEqual(80)
    expect(bpm).toBeLessThanOrEqual(185)
    expect(gridOffset).toBeGreaterThanOrEqual(0)
  })
})

describe('analyzeBeatGrid', () => {
  it('decodes a real audio file via ffmpeg and detects its BPM', async () => {
    const samples = buildClickTrack(10, 128, 0.1)
    const wavPath = join(tmpdir(), `bpm-test-${Date.now()}.wav`)
    writeWavFile(wavPath, samples, SAMPLE_RATE)
    try {
      const { bpm } = await analyzeBeatGrid(wavPath)
      expect(bpm).toBeGreaterThan(125)
      expect(bpm).toBeLessThan(131)
    } finally {
      unlinkSync(wavPath)
    }
  })

  it('returns bpm 0 for audio shorter than the 4-second minimum', async () => {
    const samples = new Float32Array(SAMPLE_RATE * 2)
    const wavPath = join(tmpdir(), `bpm-test-short-${Date.now()}.wav`)
    writeWavFile(wavPath, samples, SAMPLE_RATE)
    try {
      const result = await analyzeBeatGrid(wavPath)
      expect(result).toEqual({ bpm: 0, gridOffset: 0 })
    } finally {
      unlinkSync(wavPath)
    }
  })
})
