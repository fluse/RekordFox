import { ipcMain } from 'electron'
import { ExportQueueManager } from '../export/pioneer/ExportQueueManager'
import { getMainWindow } from '../window'

export function registerPioneerExportIpc(exportQueueManager: ExportQueueManager): void {
  ipcMain.handle('pioneer:export-start', async (_, playlistId: string, usbPath: string) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return { success: false, error: 'Main window not available' }
    // Run asynchronously so we don't block the IPC response loop, but returns the final promise
    return exportQueueManager.exportPlaylist(playlistId, usbPath, mainWindow)
  })

  ipcMain.handle('pioneer:export-cancel', async () => {
    exportQueueManager.cancel()
    return { success: true }
  })
}
