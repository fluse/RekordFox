import React from 'react'
import type { Track } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import TrackRow from './TrackRow'
import TracklistTableHead from './TracklistTableHead'
import type { ColumnConfig, SortField, SortOrder } from './columns'
import type { TrackSearchGroup } from './useCrossPlaylistSearch'

interface TracklistSearchResultsProps {
  groups: TrackSearchGroup[]
  visibleCols: ColumnConfig[]
  visibleColumns: string[]
  columnWidths: Record<string, number>
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  onResizeStart: (colId: string, e: React.MouseEvent) => void
  onLoadTrack: (track: Track, deck: 'A' | 'B') => void
  onUpdateRating: (trackId: string, rating: number) => void
  onPlayNow: (track: Track) => void
  onRemoveTrack: (track: Track) => void
  onOpenContextMenu: (track: Track, e: React.MouseEvent) => void
  currentTrackA: Track | null
  currentTrackB: Track | null
}

export default function TracklistSearchResults({
  groups,
  visibleCols,
  visibleColumns,
  columnWidths,
  sortField,
  sortOrder,
  onSort,
  onResizeStart,
  onLoadTrack,
  onUpdateRating,
  onPlayNow,
  onRemoveTrack,
  onOpenContextMenu,
  currentTrackA,
  currentTrackB
}: TracklistSearchResultsProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="flex-1 overflow-auto pl-0 pr-6 pb-4 min-h-0 flex flex-col gap-6">
      {groups.length === 0 ? (
        <div className="py-8 text-center text-zinc-600 text-sm">{t('tracklist.noTracksFound')}</div>
      ) : (
        groups.map((group) => (
          <div key={group.playlistId}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
              {group.playlistTitle} <span className="text-zinc-700">({group.tracks.length})</span>
            </h2>
            <table
              className="w-full text-left border-collapse min-w-full"
              style={{ tableLayout: 'fixed' }}
            >
              <colgroup>
                {visibleCols.map((col) => (
                  <col
                    key={col.id}
                    style={{ width: `${columnWidths[col.id] ?? col.defaultWidth}px` }}
                  />
                ))}
              </colgroup>
              <TracklistTableHead
                visibleCols={visibleCols}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={onSort}
                onResizeStart={onResizeStart}
              />
              <tbody className="text-sm divide-y divide-border/40">
                {group.tracks.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    playlistId={track.playlistId}
                    onLoadTrack={onLoadTrack}
                    onUpdateRating={onUpdateRating}
                    onPlayNow={onPlayNow}
                    onRemoveTrack={onRemoveTrack}
                    onOpenContextMenu={onOpenContextMenu}
                    isPlayingA={currentTrackA?.id === track.id}
                    isPlayingB={currentTrackB?.id === track.id}
                    activeDownload={undefined}
                    isScanningBpm={false}
                    isReorderEnabled={false}
                    visibleColumns={visibleColumns}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
