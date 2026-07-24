import type { Playlist } from '@main/db'

export interface DiscoverContext {
  playlistId: string
  seedTrack?: { id: string; title: string }
}

export interface DiscoverViewProps {
  playlists: Playlist[]
  context: DiscoverContext | null
  onContextChange: (context: DiscoverContext) => void
}
