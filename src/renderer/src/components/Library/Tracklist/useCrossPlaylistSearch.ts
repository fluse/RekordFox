import { useEffect, useMemo, useState } from 'react'
import type { Playlist, Track } from '@main/db'
import type { SortField, SortOrder } from './columns'
import { sortTracks } from './sortTracks'

export interface TrackSearchGroup {
  playlistId: string
  playlistTitle: string
  tracks: Track[]
}

interface UseCrossPlaylistSearchOptions {
  search: string
  playlists: Playlist[]
  sortField: SortField
  sortOrder: SortOrder
  // Bumping this (e.g. when the open playlist's tracks change) triggers a refetch.
  refreshOn: unknown
}

interface UseCrossPlaylistSearchResult {
  isSearching: boolean
  searchGroups: TrackSearchGroup[]
  applyRatingUpdate: (trackId: string, rating: number) => void
}

// Searching in the tracklist looks across every playlist, not just the one currently
// open, so this fetches the full track list on demand and clusters matches by playlist.
export function useCrossPlaylistSearch({
  search,
  playlists,
  sortField,
  sortOrder,
  refreshOn
}: UseCrossPlaylistSearchOptions): UseCrossPlaylistSearchResult {
  const isSearching = !!search.trim()
  const [allTracks, setAllTracks] = useState<Track[]>([])

  useEffect(() => {
    if (!isSearching) return

    let cancelled = false
    window.api
      .getTracks()
      .then((list) => {
        if (!cancelled) setAllTracks(list)
      })
      .catch((err) => console.error('Failed to load tracks for search:', err))

    return (): void => {
      cancelled = true
    }
  }, [isSearching, refreshOn])

  const searchGroups = useMemo((): TrackSearchGroup[] => {
    if (!isSearching) return []

    const q = search.trim().toLowerCase()
    const matches = allTracks.filter(
      (track) => track.title.toLowerCase().includes(q) || track.artist.toLowerCase().includes(q)
    )

    const byPlaylist = new Map<string, Track[]>()
    for (const track of matches) {
      const list = byPlaylist.get(track.playlistId)
      if (list) {
        list.push(track)
      } else {
        byPlaylist.set(track.playlistId, [track])
      }
    }

    const groups = Array.from(byPlaylist.entries()).map(([pid, groupTracks]) => ({
      playlistId: pid,
      playlistTitle: playlists.find((p) => p.id === pid)?.title ?? '',
      tracks: sortTracks(groupTracks, sortField, sortOrder)
    }))

    groups.sort((a, b) => a.playlistTitle.localeCompare(b.playlistTitle))
    return groups
  }, [isSearching, allTracks, search, playlists, sortField, sortOrder])

  // Keeps the locally cached search results in sync with rating changes made
  // from within the grouped search view, without needing a full refetch.
  const applyRatingUpdate = (trackId: string, rating: number): void => {
    setAllTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, rating } : t)))
  }

  return { isSearching, searchGroups, applyRatingUpdate }
}
