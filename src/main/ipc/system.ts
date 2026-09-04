import { ipcMain } from 'electron'
import { withMainWindow } from '../app/window'

export function registerSystemIpc(): void {
  ipcMain.on('log-error', (_, msg) => {
    console.error('[Renderer Error]', msg)
  })

  ipcMain.on('window:minimize', () => {
    withMainWindow((win) => win.minimize())
  })

  ipcMain.on('window:maximize-toggle', () => {
    withMainWindow((win) => {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    })
  })

  ipcMain.on('window:close', () => {
    withMainWindow((win) => win.close())
  })

  ipcMain.handle('window:is-maximized', () => withMainWindow((win) => win.isMaximized()) ?? false)
}
