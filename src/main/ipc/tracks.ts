import { ipcMain } from 'electron'
import {
  getTracksForPlaylist,
  getTracks,
  updateTrackBpm,
  updateTrackRating,
  updateTrackPlayed,
  updateTrackPositions,
  addTrackToPlaylist
} from '../db'
import { analyzeAndNotifyBpm, analyzeAndNotifyKey } from '../trackAnalysis'
import { ipcTry } from '../errors'
import { getMainWindow, sendToRenderer } from '../window'

export function registerTracksIpc(): void {
  ipcMain.handle('tracks:get', (_, playlistId?: string) => {
    if (playlistId) {
      return getTracksForPlaylist(playlistId)
    }
    return getTracks()
  })

  ipcMain.handle('tracks:update-bpm', (_, trackId: string, playlistId: string, bpm: number) =>
    ipcTry(() => {
      const change = updateTrackBpm(trackId, playlistId, bpm)
      if (change) {
        sendToRenderer('tracks-filepath-changed', [change])
      }
      return {}
    })
  )

  // On-demand BPM re-analysis for a single track
  ipcMain.handle('tracks:analyze-bpm', (_, trackId: string, playlistId: string, filepath: string) =>
    ipcTry(async () => {
      const bpm = await analyzeAndNotifyBpm(trackId, playlistId, filepath, getMainWindow())
      return { bpm }
    })
  )

  // On-demand Key analysis for a single track
  ipcMain.handle('tracks:analyze-key', (_, trackId: string, playlistId: string, filepath: string) =>
    ipcTry(async () => {
      const key = await analyzeAndNotifyKey(trackId, playlistId, filepath, getMainWindow())
      return { key }
    })
  )

  ipcMain.handle('tracks:update-rating', (_, trackId: string, playlistId: string, rating: number) =>
    ipcTry(() => {
      updateTrackRating(trackId, playlistId, rating)
      return {}
    })
  )

  ipcMain.handle(
    'tracks:update-played',
    (_, trackId: string, playlistId: string, played: boolean) =>
      ipcTry(() => {
        updateTrackPlayed(trackId, playlistId, played)
        return {}
      })
  )

  ipcMain.handle('tracks:reorder', (_, playlistId: string, trackIds: string[]) =>
    ipcTry(() => {
      const changes = updateTrackPositions(playlistId, trackIds)
      if (changes.length > 0) {
        sendToRenderer('tracks-filepath-changed', changes)
      }
      return {}
    })
  )

  ipcMain.handle('tracks:add-to-playlist', (_, trackId: string, targetPlaylistId: string) =>
    ipcTry(() => {
      const track = addTrackToPlaylist(trackId, targetPlaylistId)
      return { track }
    })
  )
}
