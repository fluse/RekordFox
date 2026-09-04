import React from 'react'
import { Plus, Settings, History, Compass, Loader2 } from 'lucide-react'
import logo from '@renderer/assets/logo-rekordfox.svg'
import logoLight from '@renderer/assets/logo-rekordfox-light.svg'
import { useLanguage } from '@renderer/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { SidebarProps } from './types'
import { usePlaylistRename } from './usePlaylistRename'
import { useSidebarDnd } from './useSidebarDnd'
import { PlaylistItem } from './components/PlaylistItem'
import { EmptyState } from './components/EmptyState'
import { DropChoiceDialog } from './components/DropChoiceDialog'

export type { SidebarProps } from './types'

export default function Sidebar({
  playlists,
  playlistStats,
  selectedPlaylistId,
  onSelectPlaylist,
  isHistorySelected,
  onSelectHistory,
  isDiscoverSelected,
  onSelectDiscover,
  onRenamePlaylist,
  onOpenAddModal,
  onOpenSettings,
  onDropTrackToPlaylist,
  onMoveTrackToPlaylist,
  isSettingsSelected,
  activeSyncs,
  width,
  theme = 'dark',
  renamingStatus
}: SidebarProps): React.JSX.Element {
  const { t } = useLanguage()
  const rename = usePlaylistRename(playlists, onRenamePlaylist)
  const dnd = useSidebarDnd({ playlists, onDropTrackToPlaylist, onMoveTrackToPlaylist })

  return (
    <div
      className="flex h-full flex-col bg-zinc-950/80 backdrop-blur-md"
      style={{ width: width ? `${width}px` : '256px', minWidth: width ? `${width}px` : '256px' }}
    >
      <div className="flex h-16 items-center justify-between border-b border-zinc-900 px-6">
        <div className="flex items-center gap-2 font-bold text-zinc-100">
          <img
            src={theme === 'light' ? logo : logoLight}
            className="h-10 w-10 object-contain"
            alt="RekordFox"
          />
          <span className="text-2xl font-semibold">RekordFox</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <button
          onClick={onSelectHistory}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
            isHistorySelected
              ? 'bg-zinc-900 text-zinc-100'
              : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
          }`}
        >
          <History className="h-4 w-4" />
          <span>{t('sidebar.history')}</span>
        </button>

        <button
          onClick={onSelectDiscover}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
            isDiscoverSelected
              ? 'bg-zinc-900 text-zinc-100'
              : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>{t('sidebar.discover')}</span>
        </button>

        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t('sidebar.playlists')}
          </span>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onOpenAddModal}
                  className="rounded p-1 cursor-pointer text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('sidebar.addPlaylistTooltip')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-1">
          {playlists.map((playlist) => {
            const syncState = activeSyncs[playlist.id] || { status: playlist.syncStatus }
            const isSelected =
              !isHistorySelected &&
              !isSettingsSelected &&
              !isDiscoverSelected &&
              selectedPlaylistId === playlist.id

            return (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist}
                syncState={syncState}
                stats={playlistStats[playlist.id]}
                isSelected={isSelected}
                isDropTarget={dnd.dropTargetId === playlist.id}
                isEditing={rename.editingPlaylistId === playlist.id}
                editingTitle={rename.editingTitle}
                onEditingTitleChange={rename.setEditingTitle}
                onSelect={() => onSelectPlaylist(playlist.id)}
                onStartEditing={() => rename.startEditing(playlist)}
                onSaveRename={() => rename.saveRename(playlist.id)}
                onCancelRename={rename.cancelRename}
                onDragOver={(e) => dnd.handleTrackDragOver(e, playlist.id)}
                onDragLeave={() =>
                  dnd.setDropTargetId((prev) => (prev === playlist.id ? null : prev))
                }
                onDrop={(e) => dnd.handleTrackDrop(e, playlist)}
              />
            )
          })}

          {playlists.length === 0 && <EmptyState theme={theme} onOpenAddModal={onOpenAddModal} />}
        </div>
      </div>

      {/* Bottom Actions / Settings */}
      <div className="border-t border-zinc-900 p-4 bg-zinc-950/20 space-y-2">
        <button
          onClick={onOpenSettings}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
            isSettingsSelected
              ? 'bg-zinc-900 text-zinc-100'
              : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>{t('sidebar.settings')}</span>
        </button>

        {renamingStatus?.active && (
          <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-zinc-500 font-semibold animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="truncate">
              {t('settings.renamingIndicator', {
                current: renamingStatus.current.toString(),
                total: renamingStatus.total.toString()
              })}
            </span>
          </div>
        )}
      </div>

      {/* Copy / Move choice dialog shown after dropping a track onto another playlist */}
      {dnd.pendingDrop && (
        <DropChoiceDialog
          track={dnd.pendingDrop.track}
          targetPlaylist={dnd.pendingDrop.targetPlaylist}
          onChoice={dnd.handleDropChoice}
          onCancel={dnd.cancelPendingDrop}
        />
      )}
    </div>
  )
}
