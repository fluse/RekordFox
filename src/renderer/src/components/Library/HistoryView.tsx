import React from 'react'
import { Music, Play, ListPlus } from 'lucide-react'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { useLanguage } from '@renderer/i18n'
import { formatDuration, getMediaUrl } from '@renderer/utils/audio'
import TrackContextMenu from '@renderer/components/ContextMenu/TrackContextMenu'
import { useTrackContextMenu } from '@renderer/components/ContextMenu/useTrackContextMenu'

export default function HistoryView(): React.JSX.Element {
  const { t } = useLanguage()
  const history = usePreviewStore((s) => s.history)
  const historyLimit = usePreviewStore((s) => s.historyLimit)
  const playNow = usePreviewStore((s) => s.playNow)
  const addToQueue = usePreviewStore((s) => s.addToQueue)
  const { contextMenu, open: openContextMenu, close: closeContextMenu } = useTrackContextMenu()

  const historyTracks = history.map((entry) => entry.track)

  return (
    <div className="flex flex-1 flex-col bg-zinc-900/40 min-h-0 overflow-hidden">
      <div className="flex h-16 flex-col justify-center border-b border-zinc-900 px-6">
        <h1 className="text-lg font-bold text-zinc-200">{t('history.title')}</h1>
        <p className="text-xs text-zinc-500">{t('history.subtitle', { count: historyLimit })}</p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 min-h-0">
        {history.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            {t('history.empty')}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/40">
            {history.map((entry) => {
              const coverUrl = entry.track.coverPath ? getMediaUrl(entry.track.coverPath) : ''
              return (
                <div
                  key={entry.historyId}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify(entry.track))
                    e.dataTransfer.setData('application/react-track-id', entry.track.id)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  onContextMenu={(e) => openContextMenu(entry.track, e)}
                  className="flex cursor-grab items-center gap-3 py-2.5 hover:bg-zinc-900/30 active:cursor-grabbing"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
                    {coverUrl ? (
                      <img src={coverUrl} alt="cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <Music className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-sm text-zinc-200">
                      {entry.track.title}
                    </div>
                    <div className="truncate text-xs text-zinc-500">{entry.track.artist}</div>
                  </div>
                  <div className="flex-shrink-0 font-mono text-xs text-zinc-500">
                    {formatDuration(entry.track.duration)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {contextMenu && (
        <TrackContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          items={[
            {
              key: 'playNow',
              label: t('contextMenu.playNow'),
              icon: <Play className="h-3.5 w-3.5" />,
              onClick: () => playNow(contextMenu.track, historyTracks)
            },
            {
              key: 'addToQueue',
              label: t('contextMenu.addToQueue'),
              icon: <ListPlus className="h-3.5 w-3.5" />,
              onClick: () => addToQueue(contextMenu.track)
            }
          ]}
        />
      )}
    </div>
  )
}
