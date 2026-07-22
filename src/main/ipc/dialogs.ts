import { dialog, ipcMain } from 'electron'
import { getMainWindow } from '../window'

export function registerDialogsIpc(): void {
  ipcMain.handle('dialog:select-directory', async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:confirm-migration', async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return 'cancel'
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Ja, verschieben', 'Nein, nur Pfad ändern', 'Abbrechen'],
      defaultId: 0,
      title: 'Speicherort verschieben',
      message:
        'Möchtest du die existierenden Musikdateien und Playlisten in den neuen Ordner verschieben?',
      detail:
        'Wenn du Verschieben wählst, werden alle MP3s und Cover an den neuen Ort kopiert/verschoben. Wenn du Nein wählst, verbleiben sie am alten Ort.'
    })
    if (result.response === 0) return 'move'
    if (result.response === 1) return 'change'
    return 'cancel'
  })

  ipcMain.handle('dialog:select-xml-file', async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Rekordbox XML Speicherort wählen',
      defaultPath: 'rekordbox.xml',
      filters: [{ name: 'XML-Dateien', extensions: ['xml'] }]
    })
    if (result.canceled || !result.filePath) {
      return null
    }
    return result.filePath
  })
}
