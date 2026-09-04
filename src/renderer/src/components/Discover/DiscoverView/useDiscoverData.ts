import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Playlist } from '@main/db'
import type { RecommendedTrack } from '@main/media/explore'
import { useLanguage } from '@renderer/i18n'

export interface UseDiscoverDataResult {
  recommendations: RecommendedTrack[]
  loading: boolean
  error: string | null
  refresh: () => void
  addedIds: Set<string>
  pendingIds: Set<string>
  selectedIds: Set<string>
  selectableIds: string[]
  allSelected: boolean
  toggleSelected: (videoId: string) => void
  toggleSelectAll: () => void
  handleAdd: (track: RecommendedTrack) => Promise<void>
  handleAddSelected: () => Promise<void>
  handleBlacklist: (track: RecommendedTrack) => Promise<void>
}

// Owns all Discover data + interaction state: fetching recommendations for the active playlist /
// seed, tracking which are added/pending/selected, and the add / add-selected / blacklist actions.
// Kept as one hook because these pieces are tightly coupled (the fetch resets selection, add-all
// reads selection, blacklist prunes selection).
export function useDiscoverData(
  activePlaylistId: string | null,
  activePlaylist: Playlist | null,
  seedTrackId: string | undefined
): UseDiscoverDataResult {
  const { t } = useLanguage()
  const [recommendations, setRecommendations] = useState<RecommendedTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!activePlaylistId) return
    let cancelled = false

    const fetchRecommendations = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      setSelectedIds(new Set())
      setAddedIds(new Set())
      try {
        const res = await window.api.getRecommendations(activePlaylistId, seedTrackId)
        if (cancelled) return
        if (res.success && res.recommendations) {
          setRecommendations(res.recommendations)
          // Warm up stream URLs for the visible results in the background so pressing play
          // doesn't have to wait on yt-dlp resolving one on demand.
          window.api.prefetchDiscoverStreams(res.recommendations.map((r) => r.videoId))
        } else {
          setError(res.error || String(res))
          setRecommendations([])
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err))
          setRecommendations([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRecommendations()
    return () => {
      cancelled = true
    }
  }, [activePlaylistId, seedTrackId, refreshKey])

  const refresh = (): void => setRefreshKey((k) => k + 1)

  const handleAdd = useCallback(
    async (track: RecommendedTrack): Promise<void> => {
      if (!activePlaylistId || !activePlaylist) return
      setPendingIds((prev) => new Set(prev).add(track.videoId))
      try {
        const res = await window.api.addDiscoverTrack(activePlaylistId, track)
        if (res.success) {
          setAddedIds((prev) => new Set(prev).add(track.videoId))
          toast.success(
            t('discover.addedToast', { title: track.title, playlist: activePlaylist.title })
          )
        } else {
          toast.error(t('discover.addErrorToast', { title: track.title, error: res.error || '' }))
        }
      } catch (err) {
        toast.error(t('discover.addErrorToast', { title: track.title, error: String(err) }))
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(track.videoId)
          return next
        })
      }
    },
    [activePlaylistId, activePlaylist, t]
  )

  const handleAddSelected = useCallback(async (): Promise<void> => {
    const toAdd = recommendations.filter(
      (r) => selectedIds.has(r.videoId) && !addedIds.has(r.videoId)
    )
    for (const track of toAdd) {
      // Sequential on purpose: each add kicks off its own background download, so this loop
      // only needs to fire the requests in order, not wait for downloads to finish.
      await handleAdd(track)
    }
    setSelectedIds(new Set())
  }, [recommendations, selectedIds, addedIds, handleAdd])

  const handleBlacklist = useCallback(
    async (track: RecommendedTrack): Promise<void> => {
      const originalIndex = recommendations.findIndex((r) => r.videoId === track.videoId)

      // Optimistic removal — the track disappears immediately, before the IPC round-trip.
      setRecommendations((prev) => prev.filter((r) => r.videoId !== track.videoId))
      setSelectedIds((prev) => {
        if (!prev.has(track.videoId)) return prev
        const next = new Set(prev)
        next.delete(track.videoId)
        return next
      })

      try {
        const res = await window.api.blacklistDiscoverTrack(track.videoId)
        if (!res.success) throw new Error(res.error || '')

        toast.success(t('discover.blacklistedToast', { title: track.title }), {
          action: {
            label: t('discover.undo'),
            onClick: () => {
              window.api.unblacklistDiscoverTrack(track.videoId).catch(console.error)
              setRecommendations((prev) => {
                if (prev.some((r) => r.videoId === track.videoId)) return prev
                const next = [...prev]
                next.splice(Math.min(originalIndex, next.length), 0, track)
                return next
              })
            }
          }
        })
      } catch (err) {
        // Revert the optimistic removal on failure.
        setRecommendations((prev) => {
          if (prev.some((r) => r.videoId === track.videoId)) return prev
          const next = [...prev]
          next.splice(Math.min(originalIndex, next.length), 0, track)
          return next
        })
        toast.error(t('discover.blacklistErrorToast', { title: track.title, error: String(err) }))
      }
    },
    [recommendations, t]
  )

  const toggleSelected = (videoId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(videoId)) next.delete(videoId)
      else next.add(videoId)
      return next
    })
  }

  const selectableIds = recommendations
    .filter((r) => !addedIds.has(r.videoId))
    .map((r) => r.videoId)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))

  const toggleSelectAll = (): void => {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds))
  }

  return {
    recommendations,
    loading,
    error,
    refresh,
    addedIds,
    pendingIds,
    selectedIds,
    selectableIds,
    allSelected,
    toggleSelected,
    toggleSelectAll,
    handleAdd,
    handleAddSelected,
    handleBlacklist
  }
}
