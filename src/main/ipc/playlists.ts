import { ipcMain } from 'electron'
import {
  getPlaylists,
  addPlaylist as addPlaylistToDb,
  deletePlaylist as deletePlaylistFromDb,
  renamePlaylist,
  Playlist
} from '../db'
import { getPlaylistInfo } from '../downloader'
import { syncPlaylist } from '../syncManager'
import { exportPlaylistToUsb } from '../export/m3u8/m3u8Exporter'
import { ipcTry } from '../errors'
import { getMainWindow } from '../window'

export function registerPlaylistsIpc(): void {
  ipcMain.handle('playlists:get', () => {
    return getPlaylists()
  })

  ipcMain.handle('playlists:add', (_, url: string) =>
    ipcTry(
      async () => {
        const ytInfo = await getPlaylistInfo(url)
        const newPlaylist: Playlist = {
          id: ytInfo.id,
          title: ytInfo.title,
          url: url,
          syncStatus: 'idle',
          lastSync: '',
          source: 'local'
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

  ipcMain.handle('playlists:sync', (_, id: string) => {
    const playlist = getPlaylists().find((p) => p.id === id)
    const mainWindow = getMainWindow()
    if (playlist && mainWindow) {
      syncPlaylist(playlist, mainWindow).catch((err) => console.error('Manual sync failed:', err))
      return { success: true }
    }
    return { success: false, error: 'Playlist not found' }
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
