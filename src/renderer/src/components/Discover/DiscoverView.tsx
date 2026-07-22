import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Compass, ListMusic, Loader2, Plus, RefreshCw, X } from 'lucide-react'
import type { Playlist, Track } from '@main/db'
import type { RecommendedTrack } from '@main/explore'
import { useLanguage } from '@renderer/i18n'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { getYoutubeStreamUrl } from '@renderer/utils/audio'
import { Button } from '@renderer/components/ui/button'
import DiscoverTrackCard from './DiscoverTrackCard'

export interface DiscoverContext {
  playlistId: string
  seedTrack?: { id: string; title: string }
}

interface DiscoverViewProps {
  playlists: Playlist[]
  context: DiscoverContext | null
  onContextChange: (context: DiscoverContext) => void
}

export default function DiscoverView({
  playlists,
  context,
  onContextChange
}: DiscoverViewProps): React.JSX.Element {
  const { t } = useLanguage()
  const [recommendations, setRecommendations] = useState<RecommendedTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [refreshKey, setRefreshKey] = useState(0)

  // Preview playback is routed through the app's single shared PreviewPlayer, exactly like
  // playing a regular library track — so it gets the same volume/seek/play-pause UI for free,
  // and switching to a Discover preview naturally takes over the one shared <audio> element.
  const previewTrack = usePreviewStore((s) => s.previewTrack)
  const isAnyPreviewPlaying = usePreviewStore((s) => s.isPlaying)
  const setPreviewIsPlaying = usePreviewStore((s) => s.setIsPlaying)
  const playStreamPreview = usePreviewStore((s) => s.playStreamPreview)

  const activePlaylistId = context?.playlistId ?? playlists[0]?.id ?? null
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || null
  const seedTrack = context?.seedTrack

  const togglePreview = (track: RecommendedTrack): void => {
    if (previewTrack?.id === track.videoId) {
      setPreviewIsPlaying(!isAnyPreviewPlaying)
      return
    }

    // A minimal virtual Track — deliberately not added to the real library (empty
    // playlistId, no bpm/key/rating) — just enough for the shared player to stream it.
    const virtualTrack: Track = {
      id: track.videoId,
      playlistId: activePlaylistId || '',
      title: track.title,
      artist: track.artist,
      bpm: 0,
      key: '',
      duration: Math.round((track.durationMs || 0) / 1000),
      filepath: getYoutubeStreamUrl(track.videoId),
      coverPath: track.thumbnailUrl,
      filesize: 0,
      format: 'MP3',
      rating: 0,
      bitrate: 0
    }
    playStreamPreview(virtualTrack)
  }

  useEffect(() => {
    if (!activePlaylistId) return
    let cancelled = false

    const fetchRecommendations = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      setSelectedIds(new Set())
      setAddedIds(new Set())
      try {
        const res = await window.api.getRecommendations(activePlaylistId, seedTrack?.id)
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
  }, [activePlaylistId, seedTrack?.id, refreshKey])

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

  return (
    <div className="flex flex-1 flex-col bg-background min-h-0 overflow-hidden">
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-6">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Compass className="h-5 w-5 text-primary" />
            {t('discover.title')}
          </h1>
          {!seedTrack && <p className="text-xs text-muted-foreground">{t('discover.subtitle')}</p>}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button size="sm" onClick={handleAddSelected}>
              <Plus className="h-3.5 w-3.5" />
              {t('discover.addSelected', { count: selectedIds.size })}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('discover.refresh')}
          </Button>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-6 py-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('discover.selectPlaylistLabel')}
        </label>
        <select
          value={activePlaylistId || ''}
          onChange={(e) => onContextChange({ playlistId: e.target.value })}
          disabled={playlists.length === 0}
          className="cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed"
        >
          {playlists.length === 0 && <option value="">{t('discover.noPlaylists')}</option>}
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        {seedTrack ? (
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="max-w-[220px] truncate">
              {t('discover.seedTrackLabel', { title: seedTrack.title })}
            </span>
            <button
              type="button"
              onClick={() => activePlaylistId && onContextChange({ playlistId: activePlaylistId })}
              className="cursor-pointer text-primary/70 hover:text-primary"
              title={t('discover.clearSeedTrack')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{t('discover.basedOnArtists')}</span>
        )}

        {selectableIds.length > 0 && !loading && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="ml-auto cursor-pointer text-xs font-semibold text-primary hover:underline"
          >
            {allSelected ? t('discover.clearSelection') : t('discover.selectAll')}
          </button>
        )}
      </div>

      <div className="@container min-h-0 flex-1 overflow-auto p-6">
        {playlists.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <ListMusic className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('discover.noPlaylists')}</p>
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('discover.loading')}
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-red-500">{t('discover.errorLoading', { error })}</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-muted-foreground">{t('discover.empty')}</p>
            <p className="text-xs text-muted-foreground/70">{t('discover.emptyHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5">
            {recommendations.map((track) => (
              <DiscoverTrackCard
                key={track.videoId}
                track={track}
                isAdded={addedIds.has(track.videoId)}
                isPending={pendingIds.has(track.videoId)}
                isSelected={selectedIds.has(track.videoId)}
                isPreviewPlaying={previewTrack?.id === track.videoId && isAnyPreviewPlaying}
                onToggleSelect={() => toggleSelected(track.videoId)}
                onAdd={() => handleAdd(track)}
                onTogglePreview={() => togglePreview(track)}
                onBlacklist={() => handleBlacklist(track)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
