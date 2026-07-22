import { ipcMain } from 'electron'
import { detectUsbDrives } from '../usb'

export function registerUsbIpc(): void {
  ipcMain.handle('usb:get-drives', async () => {
    return detectUsbDrives()
  })
}
