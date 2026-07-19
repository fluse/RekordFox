import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings } from '@main/db'
import type { WaveformPeak } from '@main/export/pioneer/ExportQueueManager'

// Custom APIs for renderer
const api = {
  getPlaylists: () => ipcRenderer.invoke('playlists:get'),
  addPlaylist: (url: string) => ipcRenderer.invoke('playlists:add', url),
  deletePlaylist: (id: string) => ipcRenderer.invoke('playlists:delete', id),
  syncPlaylist: (id: string) => ipcRenderer.invoke('playlists:sync', id),
  renamePlaylist: (id: string, newTitle: string) =>
    ipcRenderer.invoke('playlists:rename', id, newTitle),

  getTracks: (playlistId?: string) => ipcRenderer.invoke('tracks:get', playlistId),
  updateTrackBpm: (trackId: string, playlistId: string, bpm: number) =>
    ipcRenderer.invoke('tracks:update-bpm', trackId, playlistId, bpm),
  updateTrackRating: (trackId: string, playlistId: string, rating: number) =>
    ipcRenderer.invoke('tracks:update-rating', trackId, playlistId, rating),
  updateTrackPlayed: (trackId: string, playlistId: string, played: boolean) =>
    ipcRenderer.invoke('tracks:update-played', trackId, playlistId, played),
  reorderTracks: (playlistId: string, trackIds: string[]) =>
    ipcRenderer.invoke('tracks:reorder', playlistId, trackIds),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke('settings:update', settings),
  migrateSettings: (newPath: string, moveFiles: boolean) =>
    ipcRenderer.invoke('settings:migrate', newPath, moveFiles),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  confirmMigration: () => ipcRenderer.invoke('dialog:confirm-migration'),
  selectXmlFile: () => ipcRenderer.invoke('dialog:select-xml-file'),
  exportRekordboxXml: () => ipcRenderer.invoke('rekordbox:export-xml'),
  openPath: (path: string) => ipcRenderer.invoke('settings:open-path', path),

  onRenamingStatus: (
    callback: (data: { active: boolean; current: number; total: number }) => void
  ): (() => void) => {
    const subscription = (
      _event: unknown,
      data: { active: boolean; current: number; total: number }
    ): void => callback(data)
    ipcRenderer.on('renaming-status', subscription)
    return (): void => {
      ipcRenderer.removeListener('renaming-status', subscription)
    }
  },

  onTracksUpdated: (callback: () => void): (() => void) => {
    const subscription = (): void => callback()
    ipcRenderer.on('tracks-updated', subscription)
    return (): void => {
      ipcRenderer.removeListener('tracks-updated', subscription)
    }
  },

  // Sync / Download events listeners
  onSyncStatusChanged: (
    callback: (playlistId: string, status: string, lastSync?: string) => void
  ): (() => void) => {
    const subscription = (
      _event: unknown,
      playlistId: string,
      status: string,
      lastSync?: string
    ): void => callback(playlistId, status, lastSync)
    ipcRenderer.on('sync-status-changed', subscription)
    return (): void => {
      ipcRenderer.removeListener('sync-status-changed', subscription)
    }
  },

  onDownloadProgress: (
    callback: (data: {
      playlistId: string
      trackId: string
      title: string
      percent: number
      current: number
      total: number
    }) => void
  ): (() => void) => {
    const subscription = (
      _event: unknown,
      data: {
        playlistId: string
        trackId: string
        title: string
        percent: number
        current: number
        total: number
      }
    ): void => callback(data)
    ipcRenderer.on('download-progress', subscription)
    return (): void => {
      ipcRenderer.removeListener('download-progress', subscription)
    }
  },

  // BPM analyzed event: fires when main process completes BPM analysis for a track
  onBpmAnalyzed: (
    callback: (trackId: string, playlistId: string, bpm: number) => void
  ): (() => void) => {
    const subscription = (
      _event: unknown,
      trackId: string,
      playlistId: string,
      bpm: number
    ): void => callback(trackId, playlistId, bpm)
    ipcRenderer.on('bpm-analyzed', subscription)
    return (): void => {
      ipcRenderer.removeListener('bpm-analyzed', subscription)
    }
  },

  // Key analyzed event: fires when main process completes key analysis for a track
  onKeyAnalyzed: (
    callback: (trackId: string, playlistId: string, key: string) => void
  ): (() => void) => {
    const subscription = (
      _event: unknown,
      trackId: string,
      playlistId: string,
      key: string
    ): void => callback(trackId, playlistId, key)
    ipcRenderer.on('key-analyzed', subscription)
    return (): void => {
      ipcRenderer.removeListener('key-analyzed', subscription)
    }
  },

  // Filepath changed event: fires when the main process renames one or more track
  // files on disk (e.g. after reordering or a BPM update that changes the filename)
  onTrackFilepathChanged: (
    callback: (changes: { id: string; filepath: string }[]) => void
  ): (() => void) => {
    const subscription = (_event: unknown, changes: { id: string; filepath: string }[]): void =>
      callback(changes)
    ipcRenderer.on('tracks-filepath-changed', subscription)
    return (): void => {
      ipcRenderer.removeListener('tracks-filepath-changed', subscription)
    }
  },

  // Trigger on-demand BPM re-analysis for a single track
  analyzeTrackBpm: (trackId: string, playlistId: string, filepath: string) =>
    ipcRenderer.invoke('tracks:analyze-bpm', trackId, playlistId, filepath),

  // Trigger on-demand Key analysis for a single track
  analyzeTrackKey: (trackId: string, playlistId: string, filepath: string) =>
    ipcRenderer.invoke('tracks:analyze-key', trackId, playlistId, filepath),

  getUsbDrives: () => ipcRenderer.invoke('usb:get-drives'),
  exportPlaylist: (playlistId: string, usbPath: string, forceOverwrite?: boolean) =>
    ipcRenderer.invoke('playlists:export', playlistId, usbPath, forceOverwrite),
  onExportProgress: (
    callback: (data: {
      playlistId: string
      current: number
      total: number
      trackTitle: string
    }) => void
  ): (() => void) => {
    const subscription = (
      _event: unknown,
      data: {
        playlistId: string
        current: number
        total: number
        trackTitle: string
      }
    ): void => callback(data)
    ipcRenderer.on('export-progress', subscription)
    return (): void => {
      ipcRenderer.removeListener('export-progress', subscription)
    }
  },

  startPioneerExport: (playlistId: string, usbPath: string) =>
    ipcRenderer.invoke('pioneer:export-start', playlistId, usbPath),

  cancelPioneerExport: () => ipcRenderer.invoke('pioneer:export-cancel'),

  onPioneerExportProgress: (
    callback: (data: {
      currentTrack: number
      totalTracks: number
      statusText: string
      progressPercent: number
    }) => void
  ): (() => void) => {
    const subscription = (
      _event: unknown,
      data: {
        currentTrack: number
        totalTracks: number
        statusText: string
        progressPercent: number
      }
    ): void => callback(data)
    ipcRenderer.on('pioneer:export-progress', subscription)
    return (): void => {
      ipcRenderer.removeListener('pioneer:export-progress', subscription)
    }
  },

  onWaveformAnalysisRequest: (
    callback: (data: { trackId: string; filepath: string }) => void
  ): (() => void) => {
    const subscription = (_event: unknown, data: { trackId: string; filepath: string }): void =>
      callback(data)
    ipcRenderer.on('waveform:analysis-request', subscription)
    return (): void => {
      ipcRenderer.removeListener('waveform:analysis-request', subscription)
    }
  },

  sendWaveformAnalysisResponse: (
    trackId: string,
    result: { peaks: WaveformPeak[]; rms: WaveformPeak[] }
  ): void => {
    ipcRenderer.send('waveform:analysis-response', trackId, result)
  },

  logError: (message: string) => ipcRenderer.send('log-error', message),

  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximizeToggle: () => ipcRenderer.send('window:maximize-toggle'),
  windowClose: () => ipcRenderer.send('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void): (() => void) => {
    const subscription = (_event: unknown, isMaximized: boolean): void => callback(isMaximized)
    ipcRenderer.on('window:maximized-change', subscription)
    return (): void => {
      ipcRenderer.removeListener('window:maximized-change', subscription)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Error exposing preload api:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
