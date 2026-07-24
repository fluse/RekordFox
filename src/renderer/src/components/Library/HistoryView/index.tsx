import React from 'react'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { useLanguage } from '@renderer/i18n'
import TrackContextMenu from '@renderer/components/ContextMenu/TrackContextMenu'
import { useTrackContextMenu } from '@renderer/components/ContextMenu/TrackContextMenu/useTrackContextMenu'
import type { HistoryViewProps } from './types'
import { HistoryRow } from './components/HistoryRow'
import { useHistoryContextMenuItems } from './useHistoryContextMenuItems'

export default function HistoryView({ onFindSimilarTrack }: HistoryViewProps): React.JSX.Element {
  const { t } = useLanguage()
  const history = usePreviewStore((s) => s.history)
  const historyLimit = usePreviewStore((s) => s.historyLimit)
  const { contextMenu, open: openContextMenu, close: closeContextMenu } = useTrackContextMenu()

  const historyTracks = history.map((entry) => entry.track)
  const buildMenuItems = useHistoryContextMenuItems(historyTracks, onFindSimilarTrack)

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
            {history.map((entry) => (
              <HistoryRow
                key={entry.historyId}
                track={entry.track}
                onContextMenu={openContextMenu}
              />
            ))}
          </div>
        )}
      </div>

      {contextMenu && (
        <TrackContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          items={buildMenuItems(contextMenu.track)}
        />
      )}
    </div>
  )
}
