import React from 'react'
import type { DiscoverViewProps } from './types'
import { useDiscoverData } from './useDiscoverData'
import { usePreviewToggle } from './usePreviewToggle'
import DiscoverHeader from './components/DiscoverHeader'
import DiscoverToolbar from './components/DiscoverToolbar'
import DiscoverGrid from './components/DiscoverGrid'

export default function DiscoverView({
  playlists,
  context,
  onContextChange
}: DiscoverViewProps): React.JSX.Element {
  const activePlaylistId = context?.playlistId ?? playlists[0]?.id ?? null
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || null
  const seedTrack = context?.seedTrack

  const {
    recommendations,
    loading,
    error,
    refresh,
    addedIds,
    pendingIds,
    selectedIds,
    selectableIds,
    allSelected,
    toggleSelected,
    toggleSelectAll,
    handleAdd,
    handleAddSelected,
    handleBlacklist
  } = useDiscoverData(activePlaylistId, activePlaylist, seedTrack?.id)

  const { previewTrackId, isAnyPreviewPlaying, togglePreview } = usePreviewToggle(activePlaylistId)

  return (
    <div className="flex flex-1 flex-col bg-background min-h-0 overflow-hidden">
      <DiscoverHeader
        seedTrack={seedTrack}
        selectedCount={selectedIds.size}
        loading={loading}
        onAddSelected={handleAddSelected}
        onRefresh={refresh}
      />

      <DiscoverToolbar
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        seedTrack={seedTrack}
        selectableCount={selectableIds.length}
        loading={loading}
        allSelected={allSelected}
        onContextChange={onContextChange}
        onToggleSelectAll={toggleSelectAll}
      />

      <DiscoverGrid
        playlists={playlists}
        loading={loading}
        error={error}
        recommendations={recommendations}
        addedIds={addedIds}
        pendingIds={pendingIds}
        selectedIds={selectedIds}
        previewTrackId={previewTrackId}
        isAnyPreviewPlaying={isAnyPreviewPlaying}
        onToggleSelect={toggleSelected}
        onAdd={handleAdd}
        onTogglePreview={togglePreview}
        onBlacklist={handleBlacklist}
      />
    </div>
  )
}
