import React from 'react'
import { ListMusic, Loader2 } from 'lucide-react'
import type { Playlist } from '@main/db'
import type { RecommendedTrack } from '@main/explore'
import { useLanguage } from '@renderer/i18n'
import DiscoverTrackCard from '../DiscoverTrackCard'

interface DiscoverGridProps {
  playlists: Playlist[]
  loading: boolean
  error: string | null
  recommendations: RecommendedTrack[]
  addedIds: Set<string>
  pendingIds: Set<string>
  selectedIds: Set<string>
  previewTrackId: string | undefined
  isAnyPreviewPlaying: boolean
  onToggleSelect: (videoId: string) => void
  onAdd: (track: RecommendedTrack) => void
  onTogglePreview: (track: RecommendedTrack) => void
  onBlacklist: (track: RecommendedTrack) => void
}

export default function DiscoverGrid({
  playlists,
  loading,
  error,
  recommendations,
  addedIds,
  pendingIds,
  selectedIds,
  previewTrackId,
  isAnyPreviewPlaying,
  onToggleSelect,
  onAdd,
  onTogglePreview,
  onBlacklist
}: DiscoverGridProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
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
              isPreviewPlaying={previewTrackId === track.videoId && isAnyPreviewPlaying}
              onToggleSelect={() => onToggleSelect(track.videoId)}
              onAdd={() => onAdd(track)}
              onTogglePreview={() => onTogglePreview(track)}
              onBlacklist={() => onBlacklist(track)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
