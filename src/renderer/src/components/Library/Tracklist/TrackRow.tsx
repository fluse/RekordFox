import React from 'react'
import { Loader2, Music, Star, Play, Pause } from 'lucide-react'
import type { Track } from '@main/db'
import { formatDuration, getMediaUrl } from '@renderer/utils/audio'
import { useLanguage } from '@renderer/i18n'
import { usePreviewStore } from '@renderer/store/usePreviewStore'

function formatDate(dateStr?: string): string {
  if (!dateStr) return '---'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '---'
    const pad = (n: number): string => String(n).padStart(2, '0')
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return '---'
  }
}

// Camelot wheel color – maps the number (1–12) to a hue on the color wheel
function camelotColor(camelot: string): string {
  const num = parseInt(camelot)
  if (isNaN(num)) return '#52525b'
  const hue = ((num - 1) / 12) * 360
  return `hsl(${hue}, 65%, 52%)`
}

interface TrackRowProps {
  track: Track
  playlistId: string
  onLoadTrack: (track: Track, deck: 'A' | 'B') => void
  onUpdateRating: (trackId: string, rating: number) => void
  onPlayNow: (track: Track) => void
  onOpenContextMenu: (track: Track, e: React.MouseEvent) => void
  isPlayingA: boolean
  isPlayingB: boolean
  activeDownload: { trackId: string; title: string; percent: number } | undefined
  isScanningBpm: boolean
  isReorderEnabled?: boolean
  isDragging?: boolean
  onReorderPointerDown?: (track: Track, e: React.PointerEvent<HTMLTableRowElement>) => void
  visibleColumns: string[]
}

const TrackRow = React.forwardRef<HTMLTableRowElement, TrackRowProps>(function TrackRow(
  {
    track,
    playlistId,
    onLoadTrack,
    onUpdateRating,
    onPlayNow,
    onOpenContextMenu,
    isPlayingA,
    isPlayingB,
    activeDownload,
    isScanningBpm,
    isReorderEnabled = false,
    isDragging = false,
    onReorderPointerDown,
    visibleColumns
  },
  ref
): React.JSX.Element {
  const { t } = useLanguage()
  const { previewTrack, isPlaying, stopTrack } = usePreviewStore()
  const isPreviewingThis = previewTrack?.id === track.id
  const isCurrentlyPlaying = isPreviewingThis && isPlaying
  const coverUrl = track.coverPath ? getMediaUrl(track.coverPath) : ''
  const sizeInMB = track.filesize ? `${(track.filesize / (1024 * 1024)).toFixed(1)} MB` : '---'
  const isPlaceholder = !track.filepath

  const handleSetRating = async (ratingVal: number): Promise<void> => {
    if (isPlaceholder) return // Disable rating for placeholder tracks
    // If clicking active rating, reset to 0
    const targetRating = track.rating === ratingVal ? 0 : ratingVal
    try {
      await window.api.updateTrackRating(track.id, playlistId, targetRating)
      onUpdateRating(track.id, targetRating)
    } catch (err) {
      console.error('Failed to update rating:', err)
    }
  }

  return (
    <tr
      ref={ref}
      onPointerDown={
        isReorderEnabled && !isPlaceholder && onReorderPointerDown
          ? (e): void => onReorderPointerDown(track, e)
          : undefined
      }
      onContextMenu={!isPlaceholder ? (e): void => onOpenContextMenu(track, e) : undefined}
      style={isDragging ? { visibility: 'collapse' } : undefined}
      className={`hover:bg-zinc-900/30 group transition-all duration-150 ${
        isPlaceholder
          ? 'opacity-60 cursor-not-allowed select-none'
          : isReorderEnabled
            ? 'cursor-row-resize'
            : 'cursor-grab active:cursor-grabbing'
      } ${isPlayingA || isPlayingB ? 'bg-primary/5 row-playing' : ''}`}
    >
      {visibleColumns.map((colId) => {
        switch (colId) {
          case 'position':
            return (
              <td
                key={colId}
                className="py-2.5 text-center font-mono font-medium text-zinc-500 w-12 select-none sticky-position-cell"
              >
                {track.position || '-'}
              </td>
            )
          case 'cover':
            return (
              <td key={colId} className="py-2.5">
                <div className="flex justify-center">
                  <div className="relative group/cover h-10 w-10 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
                    {coverUrl ? (
                      <img src={coverUrl} alt="cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        {isPlaceholder && activeDownload ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Music className="h-4 w-4" />
                        )}
                      </div>
                    )}

                    {!isPlaceholder && (
                      <button
                        type="button"
                        onClick={(e): void => {
                          e.stopPropagation()
                          if (isCurrentlyPlaying) {
                            stopTrack()
                          } else {
                            onPlayNow(track)
                          }
                        }}
                        className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-200 cursor-pointer ${
                          isCurrentlyPlaying
                            ? 'opacity-100 text-primary'
                            : 'opacity-0 group-hover:opacity-100 text-zinc-100 hover:text-primary hover:scale-105'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="h-5 w-5 fill-primary text-primary" />
                        ) : (
                          <Play className="h-5 w-5 fill-current" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </td>
            )
          case 'title':
            return (
              <td key={colId} className="py-2.5 px-3">
                <div className="flex items-center gap-2 max-w-[280px]">
                  <div className="font-semibold text-zinc-200 truncate">{track.title}</div>
                  {!track.played && (
                    <span className="flex-shrink-0 inline-flex items-center rounded bg-primary/10 border border-primary/20 px-1 py-0.2 text-[9px] font-extrabold text-primary tracking-wider">
                      {t('track.newLabel')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 truncate max-w-[280px]">{track.artist}</div>
              </td>
            )
          case 'rating':
            return (
              <td key={colId} className="py-2.5 text-center px-3">
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= (track.rating || 0)
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={(): Promise<void> => handleSetRating(starValue)}
                        disabled={isPlaceholder}
                        className={`transition-colors p-0.5 ${
                          isPlaceholder
                            ? 'text-zinc-800 cursor-not-allowed'
                            : 'text-zinc-600 hover:text-amber-500'
                        }`}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            isFilled
                              ? 'fill-amber-500 text-amber-500'
                              : isPlaceholder
                                ? 'text-zinc-800'
                                : 'text-zinc-700 hover:text-amber-500'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>
              </td>
            )
          case 'bpm':
            return (
              <td
                key={colId}
                className="py-2.5 text-center font-mono font-medium text-zinc-400 px-3"
              >
                {isScanningBpm ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-primary" />
                ) : isPlaceholder ? (
                  <span className="text-zinc-700 text-xs italic">-</span>
                ) : track.bpm === 0 ? (
                  <span className="text-zinc-600 text-xs italic">{t('track.waiting')}</span>
                ) : (
                  <span className="text-primary font-bold">{track.bpm}</span>
                )}
              </td>
            )
          case 'key':
            return (
              <td key={colId} className="py-2.5 text-center font-mono font-medium px-3">
                {isPlaceholder ? (
                  <span className="text-zinc-700 text-xs italic">-</span>
                ) : !track.key ? (
                  <span className="text-zinc-600 text-xs italic">{t('track.waiting')}</span>
                ) : (
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-bold text-zinc-950"
                    style={{ backgroundColor: camelotColor(track.key) }}
                  >
                    {track.key}
                  </span>
                )}
              </td>
            )
          case 'format':
            return (
              <td key={colId} className="py-2.5 text-center text-xs font-mono text-zinc-400 px-3">
                {isPlaceholder ? (
                  activeDownload ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-semibold">
                      <span>{t('track.downloading', { percent: activeDownload.percent })}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-600 text-xs italic">{t('track.queued')}</span>
                  )
                ) : (
                  <>
                    <span className="bg-zinc-800/60 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 font-bold mr-1">
                      {track.format || 'MP3'}
                    </span>
                    {track.bitrate ? (
                      <span className="text-primary font-bold mr-1">{track.bitrate}k</span>
                    ) : null}
                    <span className="text-zinc-500">({sizeInMB})</span>
                  </>
                )}
              </td>
            )
          case 'dateAdded':
            return (
              <td key={colId} className="py-2.5 text-center font-mono text-xs text-zinc-500 px-3">
                {formatDate(track.dateAdded)}
              </td>
            )
          case 'duration':
            return (
              <td key={colId} className="py-2.5 text-right font-mono text-zinc-500 px-3">
                {formatDuration(track.duration)}
              </td>
            )
          case 'loadDeck':
            return (
              <td key={colId} className="py-2.5 px-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(): void => {
                      if (!isPlaceholder) onLoadTrack(track, 'A')
                    }}
                    disabled={isPlaceholder}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      isPlayingA
                        ? 'bg-primary text-white'
                        : isPlaceholder
                          ? 'bg-zinc-950/40 text-zinc-700 cursor-not-allowed border border-zinc-900/60'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-primary/20 hover:text-primary'
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={(): void => {
                      if (!isPlaceholder) onLoadTrack(track, 'B')
                    }}
                    disabled={isPlaceholder}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      isPlayingB
                        ? 'bg-purple-600 text-white'
                        : isPlaceholder
                          ? 'bg-zinc-950/40 text-zinc-700 cursor-not-allowed border border-zinc-900/60'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-purple-600/20 hover:text-purple-400'
                    }`}
                  >
                    B
                  </button>
                </div>
              </td>
            )
          default:
            return null
        }
      })}
    </tr>
  )
})

export default TrackRow
