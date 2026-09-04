import React from 'react'
import { Music, Pause, Play } from 'lucide-react'
import type { Track } from '@main/db'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { useLanguage } from '@renderer/i18n'
import { formatDuration, getMediaUrl } from '@renderer/utils/audio'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'

interface HistoryRowProps {
  track: Track
  onContextMenu: (track: Track, e: React.MouseEvent) => void
  onPlay: (track: Track) => void
}

// A single draggable row in the history list: cover (doubles as a play/stop button), title/artist,
// duration.
export function HistoryRow({ track, onContextMenu, onPlay }: HistoryRowProps): React.JSX.Element {
  const { t } = useLanguage()
  const previewTrack = usePreviewStore((s) => s.previewTrack)
  const isPlaying = usePreviewStore((s) => s.isPlaying)
  const stopTrack = usePreviewStore((s) => s.stopTrack)
  const isCurrentlyPlaying = previewTrack?.id === track.id && isPlaying
  const coverUrl = track.coverPath ? getMediaUrl(track.coverPath) : ''

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(track))
        e.dataTransfer.setData('application/react-track-id', track.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onContextMenu={(e) => onContextMenu(track, e)}
      className="group flex cursor-grab items-center gap-3 py-2.5 hover:bg-zinc-900/30 active:cursor-grabbing"
    >
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
        {coverUrl ? (
          <img src={coverUrl} alt="cover" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            <Music className="h-4 w-4" />
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e): void => {
                e.stopPropagation()
                if (isCurrentlyPlaying) {
                  stopTrack()
                } else {
                  onPlay(track)
                }
              }}
              className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-200 cursor-pointer ${
                isCurrentlyPlaying
                  ? 'opacity-100 text-primary'
                  : 'opacity-0 group-hover:opacity-100 text-zinc-100 hover:text-primary hover:scale-105'
              }`}
            >
              {isCurrentlyPlaying ? (
                <Pause className="h-4 w-4 fill-primary text-primary" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isCurrentlyPlaying
              ? t('tracklist.previewStopTooltip')
              : t('tracklist.previewPlayTooltip')}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-sm text-zinc-200">{track.title}</div>
        <div className="truncate text-xs text-zinc-500">{track.artist}</div>
      </div>
      <div className="flex-shrink-0 font-mono text-xs text-zinc-500">
        {formatDuration(track.duration)}
      </div>
    </div>
  )
}
