import { ipcMain, shell } from 'electron'
import {
  getSettings,
  updateSettings,
  renameAllTracksFilenameAsync,
  migrateDownloadsFolder,
  getStorageStats,
  AppSettings
} from '../db'
import { isAnyPlaylistSyncing } from '../sync'
import { ipcTry } from '../errors'
import { sendToRenderer } from '../window'

function getFilenameFormatChangeBlockedMessage(language: string | undefined): string {
  switch (language) {
    case 'fr':
      return 'Impossible de modifier le format du nom de fichier pendant une synchronisation active.'
    case 'es':
      return 'No se puede cambiar el formato del nombre de archivo mientras una sincronización está activa.'
    case 'de':
      return 'Dateiformat kann nicht geändert werden, während eine Synchronisation läuft.'
    default:
      return 'Cannot change filename format while a synchronization is active.'
  }
}

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => {
    return getSettings()
  })

  ipcMain.handle('settings:update', (_, settings: Partial<AppSettings>) =>
    ipcTry(() => {
      const oldSettings = getSettings()
      const oldTemplate = oldSettings.filenameTemplate || 'custom'
      const newTemplate = settings.filenameTemplate

      if (newTemplate && newTemplate !== oldTemplate && isAnyPlaylistSyncing()) {
        throw new Error(getFilenameFormatChangeBlockedMessage(oldSettings.language || 'de'))
      }

      updateSettings(settings)

      if (newTemplate && newTemplate !== oldTemplate) {
        sendToRenderer('renaming-status', { active: true, current: 0, total: 0 })

        // Run async renaming task
        renameAllTracksFilenameAsync(newTemplate, (current, total) => {
          sendToRenderer('renaming-status', { active: true, current, total })
        })
          .then(() => {
            sendToRenderer('renaming-status', { active: false, current: 0, total: 0 })
            sendToRenderer('tracks-updated')
          })
          .catch((err) => {
            console.error('Async renaming failed:', err)
            sendToRenderer('renaming-status', { active: false, current: 0, total: 0 })
          })
      }

      return {}
    })
  )

  ipcMain.handle('settings:migrate', (_, newPath: string, moveFiles: boolean) =>
    ipcTry(async () => {
      await migrateDownloadsFolder(newPath, moveFiles)
      return {}
    })
  )

  ipcMain.handle('settings:open-path', (_, folderPath: string) =>
    ipcTry(async () => {
      await shell.openPath(folderPath)
      return {}
    })
  )

  ipcMain.handle('settings:get-storage-stats', () => {
    return getStorageStats()
  })
}
