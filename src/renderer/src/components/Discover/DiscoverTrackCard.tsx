import React from 'react'
import { Ban, Check, Loader2, Music, Pause, Play, Plus } from 'lucide-react'
import type { RecommendedTrack } from '@main/explore'
import { useLanguage } from '@renderer/i18n'
import { formatDuration } from '@renderer/utils/audio'

interface DiscoverTrackCardProps {
  track: RecommendedTrack
  isAdded: boolean
  isPending: boolean
  isSelected: boolean
  isPreviewPlaying: boolean
  onToggleSelect: () => void
  onAdd: () => void
  onTogglePreview: () => void
  onBlacklist: () => void
}

export default function DiscoverTrackCard({
  track,
  isAdded,
  isPending,
  isSelected,
  isPreviewPlaying,
  onToggleSelect,
  onAdd,
  onTogglePreview,
  onBlacklist
}: DiscoverTrackCardProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-lg border bg-card transition ${
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border'
      }`}
    >
      {!isAdded && (
        <button
          type="button"
          onClick={onToggleSelect}
          className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border transition cursor-pointer ${
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background/80 text-transparent hover:border-primary'
          }`}
          title={isSelected ? t('discover.clearSelection') : t('discover.selectAll')}
        >
          <Check className="h-3 w-3" />
        </button>
      )}

      {!isAdded && (
        <button
          type="button"
          onClick={onBlacklist}
          className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border border-border bg-background/80 text-muted-foreground opacity-0 transition hover:border-red-500 hover:text-red-500 cursor-pointer group-hover:opacity-100"
          title={t('discover.blacklistButton')}
        >
          <Ban className="h-3 w-3" />
        </button>
      )}

      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {track.thumbnailUrl ? (
          <img
            src={track.thumbnailUrl}
            alt={track.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Music className="h-8 w-8" />
          </div>
        )}

        <button
          type="button"
          onClick={onTogglePreview}
          className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-200 cursor-pointer ${
            isPreviewPlaying
              ? 'opacity-100 text-primary'
              : 'opacity-0 group-hover:opacity-100 text-white hover:text-primary hover:scale-105'
          }`}
        >
          {isPreviewPlaying ? (
            <Pause className="h-6 w-6 fill-current" />
          ) : (
            <Play className="h-6 w-6 fill-current" />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="truncate text-sm font-semibold text-foreground" title={track.title}>
          {track.title}
        </div>
        <div className="truncate text-xs text-muted-foreground" title={track.artist}>
          {track.artist}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-mono text-[11px] text-muted-foreground">
            {track.durationMs ? formatDuration(Math.round(track.durationMs / 1000)) : '--:--'}
          </span>
          <button
            type="button"
            onClick={onAdd}
            disabled={isAdded || isPending}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              isAdded
                ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60'
            }`}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isAdded ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {isAdded ? t('discover.added') : t('discover.addButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
