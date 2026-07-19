import type { ElectronAPI } from '@electron-toolkit/preload'
import { Playlist, Track, AppSettings } from '@main/db'
import type { WaveformPeak } from '@main/export/pioneer/ExportQueueManager'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getPlaylists: () => Promise<Playlist[]>
      addPlaylist: (
        url: string
      ) => Promise<{ success: boolean; playlist?: Playlist; error?: string }>
      deletePlaylist: (id: string) => Promise<{ success: boolean; error?: string }>
      syncPlaylist: (id: string) => Promise<{ success: boolean; error?: string }>
      renamePlaylist: (
        id: string,
        newTitle: string
      ) => Promise<{ success: boolean; error?: string }>
      getTracks: (playlistId?: string) => Promise<Track[]>
      updateTrackBpm: (
        trackId: string,
        playlistId: string,
        bpm: number
      ) => Promise<{ success: boolean; error?: string }>
      updateTrackRating: (
        trackId: string,
        playlistId: string,
        rating: number
      ) => Promise<{ success: boolean; error?: string }>
      updateTrackPlayed: (
        trackId: string,
        playlistId: string,
        played: boolean
      ) => Promise<{ success: boolean; error?: string }>
      reorderTracks: (
        playlistId: string,
        trackIds: string[]
      ) => Promise<{ success: boolean; error?: string }>
      getSettings: () => Promise<AppSettings>
      updateSettings: (
        settings: Partial<AppSettings>
      ) => Promise<{ success: boolean; error?: string }>
      migrateSettings: (
        newPath: string,
        moveFiles: boolean
      ) => Promise<{ success: boolean; error?: string }>
      selectDirectory: () => Promise<string | null>
      confirmMigration: () => Promise<'move' | 'change' | 'cancel'>
      selectXmlFile: () => Promise<string | null>
      exportRekordboxXml: () => Promise<{ success: boolean; error?: string }>
      openPath: (path: string) => Promise<{ success: boolean; error?: string }>
      onRenamingStatus: (
        callback: (data: { active: boolean; current: number; total: number }) => void
      ) => () => void
      onTracksUpdated: (callback: () => void) => () => void
      onSyncStatusChanged: (
        callback: (playlistId: string, status: string, lastSync?: string) => void
      ) => () => void
      onDownloadProgress: (
        callback: (data: {
          playlistId: string
          trackId: string
          title: string
          percent: number
          current: number
          total: number
        }) => void
      ) => () => void
      onBpmAnalyzed: (
        callback: (trackId: string, playlistId: string, bpm: number) => void
      ) => () => void
      onKeyAnalyzed: (
        callback: (trackId: string, playlistId: string, key: string) => void
      ) => () => void
      onTrackFilepathChanged: (
        callback: (changes: { id: string; filepath: string }[]) => void
      ) => () => void
      analyzeTrackBpm: (
        trackId: string,
        playlistId: string,
        filepath: string
      ) => Promise<{ success: boolean; bpm?: number; error?: string }>
      analyzeTrackKey: (
        trackId: string,
        playlistId: string,
        filepath: string
      ) => Promise<{ success: boolean; key?: string; error?: string }>
      getUsbDrives: () => Promise<{ name: string; path: string; isPioneerInitialized: boolean }[]>
      exportPlaylist: (
        playlistId: string,
        usbPath: string,
        forceOverwrite?: boolean
      ) => Promise<{ success: boolean; exists?: boolean; error?: string }>
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
      sendWaveformAnalysisResponse: (
        trackId: string,
        result: { peaks: WaveformPeak[]; rms: WaveformPeak[] }
      ) => void
      logError: (message: string) => void
      windowMinimize: () => void
      windowMaximizeToggle: () => void
      windowClose: () => void
      windowIsMaximized: () => Promise<boolean>
      onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
    }
  }
}
