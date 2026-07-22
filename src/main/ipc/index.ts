import { ExportQueueManager } from '../export/pioneer/ExportQueueManager'
import { registerPlaylistsIpc } from './playlists'
import { registerTracksIpc } from './tracks'
import { registerSettingsIpc } from './settings'
import { registerDialogsIpc } from './dialogs'
import { registerRekordboxIpc } from './rekordbox'
import { registerUsbIpc } from './usb'
import { registerPioneerExportIpc } from './pioneerExport'
import { registerSystemIpc } from './system'
import { registerExploreIpc } from './explore'

export function registerIpcHandlers(exportQueueManager: ExportQueueManager): void {
  registerPlaylistsIpc()
  registerTracksIpc()
  registerSettingsIpc()
  registerDialogsIpc()
  registerRekordboxIpc()
  registerUsbIpc()
  registerPioneerExportIpc(exportQueueManager)
  registerSystemIpc()
  registerExploreIpc()
}
