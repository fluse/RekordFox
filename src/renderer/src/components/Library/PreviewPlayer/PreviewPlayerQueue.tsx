import React, { useState } from 'react'
import {
  GripVertical,
  X,
  Play,
  ListPlus,
  Search,
  Disc3,
  SquarePlay,
  ExternalLink
} from 'lucide-react'
import type { Track } from '@main/db'
import { usePreviewStore, type QueueEntry } from '@renderer/store/usePreviewStore'
import { useLanguage } from '@renderer/i18n'
import { getMediaUrl } from '@renderer/utils/audio'
import { camelotColor, camelotTextColor } from '@renderer/utils/camelot'
import {
  openDiscogsArtistSearch,
  openBandcampArtistSearch,
  openYoutubeArtistSearch,
  openYoutubeVideo
} from '@renderer/utils/artistSearch'
import TrackContextMenu from '@renderer/components/ContextMenu/TrackContextMenu'
import { useTrackContextMenu } from '@renderer/components/ContextMenu/useTrackContextMenu'

export const QUEUE_ID_MIME = 'application/x-rekordfox-queue-id'
const SWIPE_DELETE_THRESHOLD = 80

function parseTrackFromDataTransfer(dataTransfer: DataTransfer): Track | null {
  const raw = dataTransfer.getData('text/plain')
  if (!raw) return null
  try {
    return JSON.parse(raw) as Track
  } catch {
    return null
  }
}

interface RowShellProps {
  track: Track
  draggable: boolean
  onDragStartTrack: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDragOverRow?: (e: React.DragEvent) => void
  onDropRow?: (e: React.DragEvent) => void
  onContextMenuTrack: (e: React.MouseEvent) => void
  highlightClass?: string
  onDropIndicator?: 'above' | 'below' | null
  children?: React.ReactNode
  muted?: boolean
  removable?: { onRemove: () => void }
}

function QueueRowShell({
  track,
  draggable,
  onDragStartTrack,
  onDragEnd,
  onDragOverRow,
  onDropRow,
  onContextMenuTrack,
  highlightClass = '',
  onDropIndicator = null,
  muted = false,
  removable
}: RowShellProps): React.JSX.Element {
  const [swipeX, setSwipeX] = useState(0)
  const touchStartX = React.useRef<number | null>(null)
  const coverUrl = track.coverPath ? getMediaUrl(track.coverPath) : ''

  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (touchStartX.current === null) return
    const delta = e.touches[0].clientX - touchStartX.current
    setSwipeX(Math.min(0, delta))
  }

  const handleTouchEnd = (): void => {
    if (removable && swipeX < -SWIPE_DELETE_THRESHOLD) {
      removable.onRemove()
    }
    setSwipeX(0)
    touchStartX.current = null
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStartTrack}
      onDragEnd={onDragEnd}
      onDragOver={onDragOverRow}
      onDrop={onDropRow}
      onContextMenu={onContextMenuTrack}
      onTouchStart={removable ? handleTouchStart : undefined}
      onTouchMove={removable ? handleTouchMove : undefined}
      onTouchEnd={removable ? handleTouchEnd : undefined}
      style={{ transform: swipeX ? `translateX(${swipeX}px)` : undefined }}
      className={`group/row relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
        muted ? 'opacity-50 hover:opacity-80' : 'hover:bg-zinc-900/60'
      } ${
        onDropIndicator === 'above'
          ? 'border-t-2 border-primary'
          : onDropIndicator === 'below'
            ? 'border-b-2 border-primary'
            : ''
      } ${highlightClass}`}
    >
      {draggable && (
        <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600 cursor-grab active:cursor-grabbing" />
      )}
      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
        {coverUrl && <img src={coverUrl} alt="cover" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-zinc-200">{track.title}</div>
        <div className="truncate text-[10px] text-zinc-500">{track.artist}</div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {track.bpm > 0 && (
          <span className="font-mono text-[10px] font-semibold text-primary">{track.bpm}</span>
        )}
        {track.key && (
          <span
            className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor: camelotColor(track.key),
              color: camelotTextColor(track.key)
            }}
          >
            {track.key}
          </span>
        )}
      </div>
      {removable && (
        <button
          type="button"
          onClick={removable.onRemove}
          className="flex-shrink-0 rounded p-1 text-zinc-600 opacity-0 transition hover:bg-zinc-800 hover:text-red-400 group-hover/row:opacity-100 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

interface PreviewPlayerQueueProps {
  height: number
  onResizeStart: (e: React.MouseEvent) => void
  fillHeight?: boolean
}

export default function PreviewPlayerQueue({
  height,
  onResizeStart,
  fillHeight = false
}: PreviewPlayerQueueProps): React.JSX.Element {
  const { t } = useLanguage()
  const manualQueue = usePreviewStore((s) => s.manualQueue)
  const originContext = usePreviewStore((s) => s.originContext)
  const removeFromQueue = usePreviewStore((s) => s.removeFromQueue)
  const reorderQueue = usePreviewStore((s) => s.reorderQueue)
  const insertIntoQueueAt = usePreviewStore((s) => s.insertIntoQueueAt)
  const playNow = usePreviewStore((s) => s.playNow)
  const addToQueue = usePreviewStore((s) => s.addToQueue)
  const removeUpcomingTrack = usePreviewStore((s) => s.removeUpcomingTrack)

  const { contextMenu, open: openContextMenu, close: closeContextMenu } = useTrackContextMenu()
  const [draggedQueueId, setDraggedQueueId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null)
  const [isDragOverEmpty, setIsDragOverEmpty] = useState(false)

  const fallbackTracks = originContext
    ? originContext.tracks.slice(originContext.lastPlayedIndex + 1)
    : []

  const resetDragState = (): void => {
    setDraggedQueueId(null)
    setDragOverIndex(null)
    setDragOverPosition(null)
  }

  const handleDragOverRow = (e: React.DragEvent, index: number): void => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const position = e.clientY - rect.top < rect.height / 2 ? 'above' : 'below'
    setDragOverIndex(index)
    setDragOverPosition(position)
  }

  const handleDropOnRow = (e: React.DragEvent, entry: QueueEntry, index: number): void => {
    e.preventDefault()
    e.stopPropagation()
    const internalQueueId = e.dataTransfer.getData(QUEUE_ID_MIME)
    if (internalQueueId && internalQueueId !== entry.queueId) {
      reorderQueue(internalQueueId, entry.queueId, dragOverPosition || 'above')
    } else if (!internalQueueId) {
      const track = parseTrackFromDataTransfer(e.dataTransfer)
      if (track) {
        const insertIndex = index + (dragOverPosition === 'below' ? 1 : 0)
        insertIntoQueueAt(track, insertIndex)
      }
    }
    resetDragState()
  }

  const handleDropAtEnd = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const internalQueueId = e.dataTransfer.getData(QUEUE_ID_MIME)
    if (internalQueueId) {
      const lastEntry = manualQueue[manualQueue.length - 1]
      if (lastEntry && lastEntry.queueId !== internalQueueId) {
        reorderQueue(internalQueueId, lastEntry.queueId, 'below')
      }
    } else {
      const track = parseTrackFromDataTransfer(e.dataTransfer)
      if (track) insertIntoQueueAt(track, manualQueue.length)
    }
    setIsDragOverEmpty(false)
    resetDragState()
  }

  return (
    <div className={`border-t border-zinc-900 ${fillHeight ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
      <div
        style={fillHeight ? undefined : { maxHeight: `${height}px` }}
        className={`flex flex-col gap-3 px-4 py-3 overflow-y-auto ${fillHeight ? 'min-h-0 flex-1' : ''}`}
      >
        <div>
          <h3 className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {t('preview.queue.nextUp')}
          </h3>
          <div
            className="flex flex-col gap-0.5 min-h-[2rem]"
            onDragOver={(e) => {
              if (manualQueue.length === 0) {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setIsDragOverEmpty(true)
              }
            }}
            onDragLeave={() => setIsDragOverEmpty(false)}
            onDrop={manualQueue.length === 0 ? handleDropAtEnd : undefined}
          >
            {manualQueue.length === 0 && (
              <div
                className={`rounded-lg border border-dashed px-2 py-3 text-center text-[10px] transition-colors ${
                  isDragOverEmpty
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-zinc-800 text-zinc-600'
                }`}
              >
                {t('preview.queue.empty')}
              </div>
            )}
            {manualQueue.map((entry, index) => (
              <QueueRowShell
                key={entry.queueId}
                track={entry.track}
                draggable
                onDragStartTrack={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify(entry.track))
                  e.dataTransfer.setData(QUEUE_ID_MIME, entry.queueId)
                  e.dataTransfer.effectAllowed = 'move'
                  setDraggedQueueId(entry.queueId)
                }}
                onDragEnd={resetDragState}
                onDragOverRow={(e) => handleDragOverRow(e, index)}
                onDropRow={(e) => handleDropOnRow(e, entry, index)}
                onContextMenuTrack={(e) => openContextMenu(entry.track, e)}
                onDropIndicator={dragOverIndex === index ? dragOverPosition : null}
                highlightClass={draggedQueueId === entry.queueId ? 'opacity-30' : ''}
                removable={{ onRemove: () => removeFromQueue(entry.queueId) }}
              />
            ))}
            {manualQueue.length > 0 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={handleDropAtEnd}
                className="h-2"
              />
            )}
          </div>
        </div>

        {fallbackTracks.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                {t('preview.queue.fallback')}
              </h3>
              <span className="text-[9px] italic text-zinc-700">
                {t('preview.queue.fallbackHint')}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {fallbackTracks.map((track) => (
                <QueueRowShell
                  key={track.id}
                  track={track}
                  draggable
                  muted
                  onDragStartTrack={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify(track))
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  onContextMenuTrack={(e) => openContextMenu(track, e)}
                  removable={{ onRemove: () => removeUpcomingTrack(track.id) }}
                />
              ))}
            </div>
          </div>
        )}

        {contextMenu &&
          (manualQueue.some((entry) => entry.track.id === contextMenu.track.id) ? (
            <TrackContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={closeContextMenu}
              items={[
                {
                  key: 'openYoutubeVideo',
                  label: t('contextMenu.openYoutubeVideo'),
                  icon: <ExternalLink className="h-3.5 w-3.5" />,
                  onClick: () => openYoutubeVideo(contextMenu.track.id)
                },
                {
                  key: 'searchDiscogs',
                  label: t('contextMenu.searchDiscogs'),
                  icon: <Search className="h-3.5 w-3.5" />,
                  onClick: () => openDiscogsArtistSearch(contextMenu.track.artist)
                },
                {
                  key: 'searchBandcamp',
                  label: t('contextMenu.searchBandcamp'),
                  icon: <Disc3 className="h-3.5 w-3.5" />,
                  onClick: () => openBandcampArtistSearch(contextMenu.track.artist)
                },
                {
                  key: 'searchYoutube',
                  label: t('contextMenu.searchYoutube'),
                  icon: <SquarePlay className="h-3.5 w-3.5" />,
                  onClick: () => openYoutubeArtistSearch(contextMenu.track.artist)
                },
                {
                  key: 'remove',
                  label: t('contextMenu.removeFromQueue'),
                  icon: <X className="h-3.5 w-3.5" />,
                  destructive: true,
                  divider: true,
                  onClick: () => {
                    const entry = manualQueue.find((e) => e.track.id === contextMenu.track.id)
                    if (entry) removeFromQueue(entry.queueId)
                  }
                }
              ]}
            />
          ) : (
            <TrackContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={closeContextMenu}
              items={[
                {
                  key: 'playNow',
                  label: t('contextMenu.playNow'),
                  icon: <Play className="h-3.5 w-3.5" />,
                  onClick: () => playNow(contextMenu.track, originContext?.tracks)
                },
                {
                  key: 'addToQueue',
                  label: t('contextMenu.addToQueue'),
                  icon: <ListPlus className="h-3.5 w-3.5" />,
                  onClick: () => addToQueue(contextMenu.track)
                },
                {
                  key: 'openYoutubeVideo',
                  label: t('contextMenu.openYoutubeVideo'),
                  icon: <ExternalLink className="h-3.5 w-3.5" />,
                  onClick: () => openYoutubeVideo(contextMenu.track.id),
                  divider: true
                },
                {
                  key: 'searchDiscogs',
                  label: t('contextMenu.searchDiscogs'),
                  icon: <Search className="h-3.5 w-3.5" />,
                  onClick: () => openDiscogsArtistSearch(contextMenu.track.artist)
                },
                {
                  key: 'searchBandcamp',
                  label: t('contextMenu.searchBandcamp'),
                  icon: <Disc3 className="h-3.5 w-3.5" />,
                  onClick: () => openBandcampArtistSearch(contextMenu.track.artist)
                },
                {
                  key: 'searchYoutube',
                  label: t('contextMenu.searchYoutube'),
                  icon: <SquarePlay className="h-3.5 w-3.5" />,
                  onClick: () => openYoutubeArtistSearch(contextMenu.track.artist)
                },
                ...(fallbackTracks.some((track) => track.id === contextMenu.track.id)
                  ? [
                      {
                        key: 'remove',
                        label: t('contextMenu.removeFromQueue'),
                        icon: <X className="h-3.5 w-3.5" />,
                        destructive: true,
                        onClick: () => removeUpcomingTrack(contextMenu.track.id)
                      }
                    ]
                  : [])
              ]}
            />
          ))}
      </div>
      {!fillHeight && (
        <div
          onMouseDown={onResizeStart}
          className="flex h-3 cursor-row-resize items-center justify-center group/resize"
        >
          <div className="h-1 w-8 rounded-full bg-zinc-800 group-hover/resize:bg-primary/70 transition-colors" />
        </div>
      )}
    </div>
  )
}
