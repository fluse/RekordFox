import React, { useMemo, useState } from 'react'
import { Play, ListPlus } from 'lucide-react'
import type { Track } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import { useTrackScanner } from '@renderer/hooks/useTrackScanner'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { UsbExportModal, PioneerExportModal } from '@renderer/components/Export'
import TrackContextMenu from '@renderer/components/ContextMenu/TrackContextMenu'
import { useTrackContextMenu } from '@renderer/components/ContextMenu/useTrackContextMenu'
import TrackRow from './TrackRow'
import TrackRowPlaceholder from './TrackRowPlaceholder'
import TracklistToolbar from './TracklistToolbar'
import TracklistTableHead from './TracklistTableHead'
import { useColumnConfig } from './useColumnConfig'
import { useTrackReorder } from './useTrackReorder'
import type { SortField, SortOrder } from './columns'

interface TracklistProps {
  playlistId: string
  playlistTitle: string
  tracks: Track[]
  onLoadTrack: (track: Track, deck: 'A' | 'B') => void
  onUpdateBpm: (trackId: string, bpm: number) => void
  onUpdateKey: (trackId: string, key: string) => void
  onUpdateRating: (trackId: string, rating: number) => void
  onReorderTracks: (playlistId: string, trackIds: string[]) => Promise<void>
  currentTrackA: Track | null
  currentTrackB: Track | null
  activeDownloads?: Record<string, { trackId: string; title: string; percent: number }>
}

export default function Tracklist({
  playlistId,
  playlistTitle,
  tracks,
  onLoadTrack,
  onUpdateBpm,
  onUpdateKey,
  onUpdateRating,
  onReorderTracks,
  currentTrackA,
  currentTrackB,
  activeDownloads
}: TracklistProps): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('position')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isPioneerProgressOpen, setIsPioneerProgressOpen] = useState(false)
  const [pioneerUsbPath, setPioneerUsbPath] = useState('')
  const { t } = useLanguage()
  const { contextMenu, open: openContextMenu, close: closeContextMenu } = useTrackContextMenu()
  const { visibleColumns, visibleCols, columnWidths, toggleColumn, startResize } = useColumnConfig()

  // Background scanning of missing BPMs/Keys
  const scanningBpm = useTrackScanner(tracks, playlistId, onUpdateBpm, onUpdateKey)

  const isReorderEnabled = !search.trim() && sortField === 'position'

  const filteredAndSortedTracks = useMemo((): Track[] => {
    let result = [...tracks]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (track) => track.title.toLowerCase().includes(q) || track.artist.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]

      if (valA === undefined && valB === undefined) return 0
      if (valA === undefined) return sortOrder === 'asc' ? 1 : -1
      if (valB === undefined) return sortOrder === 'asc' ? -1 : 1

      if (typeof valA === 'string' && typeof valB === 'string') {
        const strA = valA.toLowerCase()
        const strB = valB.toLowerCase()
        if (strA < strB) return sortOrder === 'asc' ? -1 : 1
        if (strA > strB) return sortOrder === 'asc' ? 1 : -1
        return 0
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1
        return 0
      }

      return 0
    })

    return result
  }, [tracks, search, sortField, sortOrder])

  const handleReorder = (
    draggedId: string,
    targetId: string,
    position: 'above' | 'below'
  ): void => {
    const dragIndex = tracks.findIndex((track) => track.id === draggedId)
    if (dragIndex === -1) return

    const newTracks = [...tracks]
    const [draggedTrack] = newTracks.splice(dragIndex, 1)

    const shiftedTargetIndex = newTracks.findIndex((track) => track.id === targetId)
    if (shiftedTargetIndex === -1) return

    const insertIndex = position === 'above' ? shiftedTargetIndex : shiftedTargetIndex + 1
    newTracks.splice(insertIndex, 0, draggedTrack)

    onReorderTracks(
      playlistId,
      newTracks.map((track) => track.id)
    )
  }

  const { displayItems, registerRow, onRowPointerDown } = useTrackReorder({
    tracks: filteredAndSortedTracks,
    enabled: isReorderEnabled,
    onReorder: handleReorder
  })

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handlePlayNow = (track: Track): void => {
    usePreviewStore.getState().playNow(track, filteredAndSortedTracks)
  }

  const handleAddToQueue = (track: Track): void => {
    usePreviewStore.getState().addToQueue(track)
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-900/40 min-h-0 overflow-hidden">
      <TracklistToolbar
        playlistTitle={playlistTitle}
        search={search}
        onSearchChange={setSearch}
        onExportClick={(): void => setIsExportModalOpen(true)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
      />

      <div className="flex-1 overflow-auto pl-0 pr-6 pb-4 min-h-0">
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
            onSort={handleSort}
            onResizeStart={startResize}
          />
          <tbody className="text-sm divide-y divide-border/40">
            {displayItems.map((item) =>
              item.type === 'placeholder' ? (
                <TrackRowPlaceholder
                  key={item.key}
                  ref={registerRow(item.key)}
                  colSpan={visibleColumns.length}
                />
              ) : (
                <TrackRow
                  key={item.key}
                  ref={registerRow(item.key)}
                  track={item.track}
                  playlistId={playlistId}
                  onLoadTrack={onLoadTrack}
                  onUpdateRating={onUpdateRating}
                  onPlayNow={handlePlayNow}
                  onOpenContextMenu={openContextMenu}
                  isPlayingA={currentTrackA?.id === item.track.id}
                  isPlayingB={currentTrackB?.id === item.track.id}
                  activeDownload={activeDownloads?.[item.track.id]}
                  isScanningBpm={!!scanningBpm[item.track.id]}
                  isReorderEnabled={isReorderEnabled}
                  isDragging={item.isDragging}
                  onReorderPointerDown={onRowPointerDown}
                  visibleColumns={visibleColumns}
                />
              )
            )}
            {filteredAndSortedTracks.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="py-8 text-center text-zinc-600 text-sm"
                >
                  {t('tracklist.noTracksFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
              onClick: () => handlePlayNow(contextMenu.track)
            },
            {
              key: 'addToQueue',
              label: t('contextMenu.addToQueue'),
              icon: <ListPlus className="h-3.5 w-3.5" />,
              onClick: () => handleAddToQueue(contextMenu.track)
            }
          ]}
        />
      )}

      <UsbExportModal
        isOpen={isExportModalOpen}
        onClose={(): void => setIsExportModalOpen(false)}
        playlistId={playlistId}
        playlistTitle={playlistTitle}
        onStartPioneerExport={(usbPath): void => {
          setIsExportModalOpen(false)
          setPioneerUsbPath(usbPath)
          setIsPioneerProgressOpen(true)
        }}
      />
      <PioneerExportModal
        isOpen={isPioneerProgressOpen}
        onClose={(): void => setIsPioneerProgressOpen(false)}
        playlistId={playlistId}
        playlistTitle={playlistTitle}
        usbPath={pioneerUsbPath}
      />
    </div>
  )
}
