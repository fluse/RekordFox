import { ipcMain } from 'electron'
import { getPlaylists, getSettings, getTracks } from '../db'
import { writeRekordboxXml } from '../export/rekordbox/rekordboxXmlExporter'
import { getErrorMessage, ipcTry } from '../errors'

export function registerRekordboxIpc(): void {
  ipcMain.handle('rekordbox:export-xml', () =>
    ipcTry(
      () => {
        const settings = getSettings()
        if (!settings.rekordboxXmlPath) {
          throw new Error('Kein XML-Exportpfad konfiguriert')
        }
        const playlists = getPlaylists()
        const tracks = getTracks()
        writeRekordboxXml(settings.rekordboxXmlPath, playlists, tracks)
        return {}
      },
      { formatError: (e) => getErrorMessage(e) || 'Export fehlgeschlagen' }
    )
  )
}
