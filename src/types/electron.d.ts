// src/types/electron.d.ts

// Definiere hier deine Kern-Datenstrukturen
interface Track {
  id: string
  filePath: string
  title: string
  bpm: number
}

// Das ist der Vertrag zwischen Backend (Main) und Frontend (Renderer)
export interface IRekordFoxAPI {
  scanLibrary: (folderPath: string) => Promise<Track[]>
  playTrack: (trackId: string) => void
  onTrackScanned: (callback: (track: Track) => void) => void
  getUsbDrives: () => Promise<{ name: string; path: string; isPioneerInitialized: boolean }[]>
  exportPlaylist: (
    playlistId: string,
    usbPath: string,
    forceOverwrite?: boolean
  ) => Promise<{ success: boolean; exists?: boolean; error?: string }>
  renamePlaylist: (id: string, newTitle: string) => Promise<{ success: boolean; error?: string }>
  onExportProgress: (
    callback: (data: {
      playlistId: string
      current: number
      total: number
      trackTitle: string
    }) => void
  ) => () => void
  startPioneerExport: (
    playlistId: string,
    usbPath: string
  ) => Promise<{ success: boolean; error?: string }>
  cancelPioneerExport: () => Promise<void>
  onPioneerExportProgress: (
    callback: (data: {
      currentTrack: number
      totalTracks: number
      statusText: string
      progressPercent: number
    }) => void
  ) => () => void
  onWaveformAnalysisRequest: (
    callback: (data: { trackId: string; filepath: string }) => void
  ) => () => void
  sendWaveformAnalysisResponse: (trackId: string, result: { peaks: any[]; rms: any[] }) => void
}

// Mache die API global für das Window-Objekt verfügbar
declare global {
  interface Window {
    api: IRekordFoxAPI
  }
}
