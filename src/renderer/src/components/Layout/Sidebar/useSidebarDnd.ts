import { useState } from 'react'
import { toast } from 'sonner'
import type { Playlist, Track } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import { canDropTrack } from '@renderer/utils/playlistSource'

interface PendingDrop {
  track: Track
  targetPlaylist: Playlist
}

interface UseSidebarDndParams {
  playlists: Playlist[]
  onDropTrackToPlaylist: (track: Track, targetPlaylistId: string) => void
  onMoveTrackToPlaylist: (track: Track, targetPlaylistId: string) => void
}

export interface UseSidebarDndResult {
  dropTargetId: string | null
  setDropTargetId: React.Dispatch<React.SetStateAction<string | null>>
  pendingDrop: PendingDrop | null
  cancelPendingDrop: () => void
  handleTrackDragOver: (e: React.DragEvent, playlistId: string) => void
  handleTrackDrop: (e: React.DragEvent, targetPlaylist: Playlist) => void
  handleDropChoice: (mode: 'copy' | 'move') => void
}

// Drag-and-drop of tracks onto playlists. A drop is not committed immediately; it opens a
// copy/move choice (pendingDrop) that the caller resolves via handleDropChoice.
export function useSidebarDnd({
  playlists,
  onDropTrackToPlaylist,
  onMoveTrackToPlaylist
}: UseSidebarDndParams): UseSidebarDndResult {
  const { t } = useLanguage()
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)

  const handleTrackDragOver = (e: React.DragEvent, playlistId: string): void => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropTargetId(playlistId)
  }

  const handleTrackDrop = (e: React.DragEvent, targetPlaylist: Playlist): void => {
    e.preventDefault()
    setDropTargetId(null)
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    let track: Track
    try {
      track = JSON.parse(raw)
    } catch {
      return
    }
    const sourcePlaylist = playlists.find((p) => p.id === track.playlistId)
    if (!canDropTrack(sourcePlaylist, targetPlaylist)) {
      toast.error(t('sidebar.dropBlockedYoutube'))
      return
    }
    if (track.playlistId === targetPlaylist.id) return
    setPendingDrop({ track, targetPlaylist })
  }

  const handleDropChoice = (mode: 'copy' | 'move'): void => {
    if (!pendingDrop) return
    const { track, targetPlaylist } = pendingDrop
    if (mode === 'copy') {
      onDropTrackToPlaylist(track, targetPlaylist.id)
    } else {
      onMoveTrackToPlaylist(track, targetPlaylist.id)
    }
    setPendingDrop(null)
  }

  const cancelPendingDrop = (): void => setPendingDrop(null)

  return {
    dropTargetId,
    setDropTargetId,
    pendingDrop,
    cancelPendingDrop,
    handleTrackDragOver,
    handleTrackDrop,
    handleDropChoice
  }
}
