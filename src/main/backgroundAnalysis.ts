import { existsSync } from 'fs'
import { getTracks, Track } from './db'
import { analyzeAndNotifyBpm, analyzeAndNotifyKey } from './trackAnalysis'
import { getMainWindow } from './window'

const STARTUP_DELAY_MS = 3000
const KEY_ANALYSIS_STAGGER_MS = 1000
const ANALYSIS_STEP_DELAY_MS = 200

async function analyzeBpmNext(tracks: Track[], index: number): Promise<void> {
  if (index >= tracks.length) {
    console.log('[BPM] Background analysis complete.')
    return
  }
  const track = tracks[index]
  try {
    await analyzeAndNotifyBpm(track.id, track.playlistId, track.filepath, getMainWindow())
  } catch (err) {
    console.error(`[BPM] Failed for ${track.id}:`, err)
  }
  setTimeout(() => analyzeBpmNext(tracks, index + 1), ANALYSIS_STEP_DELAY_MS)
}

async function analyzeKeyNext(tracks: Track[], index: number): Promise<void> {
  if (index >= tracks.length) {
    console.log('[Key] Background analysis complete.')
    return
  }
  const track = tracks[index]
  try {
    await analyzeAndNotifyKey(track.id, track.playlistId, track.filepath, getMainWindow())
  } catch (err) {
    console.error(`[Key] Failed for ${track.id}:`, err)
  }
  setTimeout(() => analyzeKeyNext(tracks, index + 1), ANALYSIS_STEP_DELAY_MS)
}

// Analyze BPM and Key for existing tracks missing either value.
// Runs in background after startup to not block the UI.
export function scheduleStartupAnalysis(): void {
  setTimeout(() => {
    const mainWindow = getMainWindow()
    if (!mainWindow || mainWindow.isDestroyed()) return
    const allTracks = getTracks()

    const needsBpm = allTracks.filter((t) => t.bpm === 0 && t.filepath && existsSync(t.filepath))
    const needsKey = allTracks.filter(
      (t) => (!t.key || t.key === '') && t.filepath && existsSync(t.filepath)
    )

    console.log(`[Analysis] ${needsBpm.length} tracks need BPM, ${needsKey.length} tracks need Key`)

    analyzeBpmNext(needsBpm, 0)
    // Stagger key analysis to avoid peak CPU with BPM analysis
    setTimeout(() => analyzeKeyNext(needsKey, 0), KEY_ANALYSIS_STAGGER_MS)
  }, STARTUP_DELAY_MS)
}
