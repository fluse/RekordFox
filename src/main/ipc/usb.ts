import { ipcMain } from 'electron'
import { detectUsbDrives } from '../media/usb'

export function registerUsbIpc(): void {
  ipcMain.handle('usb:get-drives', async () => {
    return detectUsbDrives()
  })
}
