import { useState } from 'react'
import type { Playlist } from '@main/db'

export interface UsePlaylistRenameResult {
  editingPlaylistId: string | null
  editingTitle: string
  setEditingTitle: (value: string) => void
  startEditing: (playlist: Playlist) => void
  saveRename: (id: string) => void
  cancelRename: () => void
}

// Inline playlist renaming: tracks which playlist is being edited and commits the trimmed title
// only when it actually changed.
export function usePlaylistRename(
  playlists: Playlist[],
  onRenamePlaylist: (id: string, newTitle: string) => void
): UsePlaylistRenameResult {
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')

  const startEditing = (playlist: Playlist): void => {
    setEditingPlaylistId(playlist.id)
    setEditingTitle(playlist.title)
  }

  const saveRename = (id: string): void => {
    const trimmed = editingTitle.trim()
    if (trimmed && trimmed !== playlists.find((p) => p.id === id)?.title) {
      onRenamePlaylist(id, trimmed)
    }
    setEditingPlaylistId(null)
  }

  const cancelRename = (): void => {
    setEditingPlaylistId(null)
  }

  return {
    editingPlaylistId,
    editingTitle,
    setEditingTitle,
    startEditing,
    saveRename,
    cancelRename
  }
}
