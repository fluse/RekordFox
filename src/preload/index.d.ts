import type { ElectronAPI } from '@electron-toolkit/preload'
import { Playlist, Track, AppSettings, StorageStats, OAuthAccount, PlaylistStats } from '@main/db'
import type { WaveformPeak } from '@main/export/pioneer/ExportQueueManager'
import type { RecommendedTrack } from '@main/media/explore'
import type { RemotePlaylistSummary } from '@main/sync/youtubeSync'

type PublicOAuthAccount = Omit<OAuthAccount, 'accessTokenEnc' | 'refreshTokenEnc'>

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getPlaylists: () => Promise<Playlist[]>
      getPlaylistStats: () => Promise<Record<string, PlaylistStats>>
      addPlaylist: (
        url: string,
        platform?: 'youtube' | 'spotify'
      ) => Promise<{ success: boolean; playlist?: Playlist; error?: string }>
      createEmptyPlaylist: (
        title: string
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
      addTrackToPlaylist: (
        trackId: string,
        targetPlaylistId: string
      ) => Promise<{ success: boolean; track?: Track | null; error?: string }>
      removeTrackFromPlaylist: (
        trackId: string,
        playlistId: string
      ) => Promise<{ success: boolean; error?: string }>
      getYoutubeAccounts: () => Promise<PublicOAuthAccount[]>
      connectYoutubeAccount: (openBrowser?: boolean) => Promise<{
        success: boolean
        account?: PublicOAuthAccount
        linkedPlaylists?: Playlist[]
        error?: string
      }>
      onYoutubeAuthUrlReady: (callback: (url: string) => void) => () => void
      disconnectYoutubeAccount: (accountId: string) => Promise<{
        success: boolean
        unlinkedPlaylists?: Playlist[]
        error?: string
      }>
      listMyYoutubePlaylists: (
        accountId: string
      ) => Promise<{ success: boolean; playlists?: RemotePlaylistSummary[]; error?: string }>
      importYoutubePlaylist: (
        accountId: string,
        remotePlaylistId: string
      ) => Promise<{ success: boolean; playlist?: Playlist; error?: string }>
      syncPlaylistOrderToYoutube: (
        playlistId: string,
        orderedTrackIds: string[]
      ) => Promise<{ success: boolean; error?: string }>
      reconcileYoutubePlaylists: (
        accountId: string
      ) => Promise<{ success: boolean; linkedPlaylists?: Playlist[]; error?: string }>
      testYoutubeConnection: (
        clientId: string,
        clientSecret: string
      ) => Promise<{ success: boolean; error?: string }>
      testSpotifyConnection: (
        clientId: string,
        clientSecret: string
      ) => Promise<{ success: boolean; error?: string }>
      getSpotifyAccount: () => Promise<PublicOAuthAccount | null>
      connectSpotifyAccount: (openBrowser?: boolean) => Promise<{
        success: boolean
        account?: PublicOAuthAccount
        error?: string
      }>
      onSpotifyAuthUrlReady: (callback: (url: string) => void) => () => void
      disconnectSpotifyAccount: () => Promise<{ success: boolean; error?: string }>
      onYoutubePlaylistsLinked: (callback: (linkedPlaylists: Playlist[]) => void) => () => void
      onYoutubePlaylistsUnlinked: (callback: (unlinkedPlaylists: Playlist[]) => void) => () => void
      copyToClipboard: (text: string) => void
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
      getStorageStats: () => Promise<StorageStats>
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
      sendPlayerState: (state: {
        title: string
        artist: string
        isPlaying: boolean
        hasTrack: boolean
      }) => void
      onTrayControl: (callback: (action: 'play-pause' | 'next' | 'previous') => void) => () => void
      getRecommendations: (
        playlistId: string,
        seedTrackId?: string,
        limit?: number
      ) => Promise<{ success: boolean; recommendations?: RecommendedTrack[]; error?: string }>
      addDiscoverTrack: (
        playlistId: string,
        track: RecommendedTrack
      ) => Promise<{ success: boolean; error?: string }>
      blacklistDiscoverTrack: (videoId: string) => Promise<{ success: boolean; error?: string }>
      unblacklistDiscoverTrack: (videoId: string) => Promise<{ success: boolean; error?: string }>
      prefetchDiscoverStreams: (videoIds: string[]) => void
      windowMinimize: () => void
      windowMaximizeToggle: () => void
      windowClose: () => void
      windowIsMaximized: () => Promise<boolean>
      onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
    }
  }
}
