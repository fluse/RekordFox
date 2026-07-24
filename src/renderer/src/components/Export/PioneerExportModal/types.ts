export type PioneerExportStep = 'exporting' | 'success' | 'error' | 'canceled'

export interface PioneerProgress {
  currentTrack: number
  totalTracks: number
  statusText: string
  progressPercent: number
}

export interface PioneerExportModalProps {
  isOpen: boolean
  onClose: () => void
  playlistId: string
  playlistTitle: string
  usbPath: string
}
