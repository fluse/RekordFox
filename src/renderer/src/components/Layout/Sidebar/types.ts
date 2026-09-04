import type { Playlist, PlaylistStats, Track } from '@main/db'

export interface ActiveDownload {
  trackId: string
  title: string
  percent: number
}

export interface ActiveSyncState {
  status: string
  total?: number
  completedTrackIds?: string[]
  activeDownloads?: Record<string, ActiveDownload>
}

export interface RenamingStatus {
  active: boolean
  current: number
  total: number
}

export interface SidebarProps {
  playlists: Playlist[]
  playlistStats: Record<string, PlaylistStats>
  selectedPlaylistId: string | null
  onSelectPlaylist: (id: string) => void
  isHistorySelected: boolean
  onSelectHistory: () => void
  isDiscoverSelected: boolean
  onSelectDiscover: () => void
  onRenamePlaylist: (id: string, newTitle: string) => void
  onOpenAddModal: () => void
  onOpenSettings: () => void
  onDropTrackToPlaylist: (track: Track, targetPlaylistId: string) => void
  onMoveTrackToPlaylist: (track: Track, targetPlaylistId: string) => void
  isSettingsSelected: boolean
  activeSyncs: Record<string, ActiveSyncState>
  width?: number
  theme?: 'dark' | 'light'
  renamingStatus?: RenamingStatus
}
