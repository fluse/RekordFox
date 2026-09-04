import { ipcMain } from 'electron'
import {
  getTracksForPlaylist,
  getTracks,
  isDownloadAbandoned,
  updateTrackBpm,
  updateTrackRating,
  updateTrackPlayed,
  updateTrackPositions,
  addTrackToPlaylist,
  removeTrackFromPlaylist
} from '../db'
import { analyzeAndNotifyBpm, analyzeAndNotifyKey } from '../analysis/trackAnalysis'
import { ipcTry } from '../utils/errors'
import { getMainWindow, sendToRenderer } from '../app/window'

export function registerTracksIpc(): void {
  ipcMain.handle('tracks:get', (_, playlistId?: string) => {
    const tracks = playlistId ? getTracksForPlaylist(playlistId) : getTracks()
    // Tracks abandoned after too many failed download attempts are excluded from the UI
    // entirely (see isDownloadAbandoned) — they stay in the db so sync doesn't retry them.
    return tracks.filter((t) => !isDownloadAbandoned(t))
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

  ipcMain.handle('tracks:remove-from-playlist', (_, trackId: string, playlistId: string) =>
    ipcTry(() => {
      removeTrackFromPlaylist(trackId, playlistId)
      return {}
    })
  )
}
