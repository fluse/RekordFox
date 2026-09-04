import { ipcMain } from 'electron'
import {
  getPlaylists,
  getPlaylistStats,
  addPlaylist as addPlaylistToDb,
  deletePlaylist as deletePlaylistFromDb,
  renamePlaylist,
  Playlist
} from '../db'
import { getPlaylistInfo } from '../media/downloader'
import { getSpotifyPlaylistInfo } from '../auth/spotifyApi'
import { syncPlaylist } from '../sync/syncManager'
import { exportPlaylistToUsb } from '../export/m3u8/m3u8Exporter'
import { ipcTry } from '../utils/errors'
import { getMainWindow } from '../app/window'

export function registerPlaylistsIpc(): void {
  ipcMain.handle('playlists:get', () => {
    return getPlaylists()
  })

  ipcMain.handle('playlists:stats', () => {
    return getPlaylistStats()
  })

  ipcMain.handle('playlists:add', (_, url: string, platform: 'youtube' | 'spotify' = 'youtube') =>
    ipcTry(
      async () => {
        const { id, title } =
          platform === 'spotify' ? await getSpotifyPlaylistInfo(url) : await getPlaylistInfo(url)
        const newPlaylist: Playlist = {
          id,
          title,
          url,
          syncStatus: 'idle',
          lastSync: '',
          source: platform === 'spotify' ? 'spotify' : 'local'
        }
        addPlaylistToDb(newPlaylist)

        // Trigger sync in background immediately
        const mainWindow = getMainWindow()
        if (mainWindow) {
          syncPlaylist(newPlaylist, mainWindow).catch((err) => console.error('Sync failed:', err))
        }

        return { playlist: newPlaylist }
      },
      { onError: (e) => console.error('Error adding playlist:', e) }
    )
  )

  ipcMain.handle('playlists:delete', (_, id: string) =>
    ipcTry(() => {
      deletePlaylistFromDb(id)
      return {}
    })
  )

  ipcMain.handle('playlists:rename', (_, id: string, newTitle: string) =>
    ipcTry(() => {
      renamePlaylist(id, newTitle)
      return {}
    })
  )

  // Awaits the full sync so the renderer's manual-sync button can show a completion toast
  // instead of the fire-and-forget "started" response it used to get (the 'syncing' progress
  // state itself is still driven by the separate sync-status-changed events, sent as soon as the
  // sync begins, so the spinner isn't affected by this now taking longer to resolve).
  ipcMain.handle('playlists:sync', async (_, id: string) => {
    const playlist = getPlaylists().find((p) => p.id === id)
    const mainWindow = getMainWindow()
    if (!playlist || !mainWindow) {
      return { success: false, error: 'Playlist not found' }
    }
    try {
      await syncPlaylist(playlist, mainWindow)
    } catch (err) {
      // e.g. pullYoutubeOAuthPlaylist throwing an actionable "reconnect your account" message
      // for a needs-reauth link — surface it verbatim rather than a generic failure.
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
    const finished = getPlaylists().find((p) => p.id === id)
    if (finished?.syncStatus === 'error') {
      return { success: false, error: 'Sync failed. Check the logs for details.' }
    }
    return { success: true }
  })

  ipcMain.handle(
    'playlists:export',
    async (_, playlistId: string, usbPath: string, forceOverwrite?: boolean) => {
      const mainWindow = getMainWindow()
      if (!mainWindow) return { success: false, error: 'Main window not available' }
      return exportPlaylistToUsb(playlistId, usbPath, mainWindow, forceOverwrite)
    }
  )
}
