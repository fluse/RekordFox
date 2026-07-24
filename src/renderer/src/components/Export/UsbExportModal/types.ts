export interface UsbDrive {
  name: string
  path: string
  isPioneerInitialized: boolean
}

export type UsbExportStep =
  | 'scanning'
  | 'select'
  | 'confirm_overwrite'
  | 'exporting'
  | 'success'
  | 'error'

export type ExportFormat = 'm3u8' | 'pioneer'

export interface ExportProgress {
  current: number
  total: number
  trackTitle: string
}

export interface UsbExportModalProps {
  isOpen: boolean
  onClose: () => void
  playlistId: string
  playlistTitle: string
  onStartPioneerExport?: (usbPath: string) => void
}
