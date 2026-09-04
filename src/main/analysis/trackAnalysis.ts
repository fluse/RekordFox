import { BrowserWindow } from 'electron'
import { analyzeBpm } from './bpm'
import { analyzeKey } from './key'
import { updateTrackBpm, updateTrackKey } from '../db'

function notify(win: BrowserWindow | null, channel: string, ...args: unknown[]): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args)
  }
}

// Analyzes a track's BPM, persists it, and notifies the renderer. Shared by
// the on-demand IPC handler, the startup sweep, and playlist sync.
export async function analyzeAndNotifyBpm(
  trackId: string,
  playlistId: string,
  filepath: string,
  win: BrowserWindow | null
): Promise<number> {
  const bpm = await analyzeBpm(filepath)
  if (bpm > 0) {
    const change = updateTrackBpm(trackId, playlistId, bpm)
    notify(win, 'bpm-analyzed', trackId, playlistId, bpm)
    if (change) {
      notify(win, 'tracks-filepath-changed', [change])
    }
  }
  return bpm
}

// Analyzes a track's musical key, persists it, and notifies the renderer.
// Shared by the on-demand IPC handler, the startup sweep, and playlist sync.
export async function analyzeAndNotifyKey(
  trackId: string,
  playlistId: string,
  filepath: string,
  win: BrowserWindow | null
): Promise<string> {
  const { camelot, tkey } = await analyzeKey(filepath)
  if (camelot) {
    updateTrackKey(trackId, playlistId, camelot, tkey)
    notify(win, 'key-analyzed', trackId, playlistId, camelot)
  }
  return camelot
}
