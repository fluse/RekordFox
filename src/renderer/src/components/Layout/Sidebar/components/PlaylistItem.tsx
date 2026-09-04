import React from 'react'
import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react'
import type { Playlist, PlaylistStats } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'
import SpotifyIcon from '@renderer/components/icons/SpotifyIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { ActiveSyncState } from '../types'
import { formatLastSync } from '../helpers'
import { SyncProgress } from './SyncProgress'

interface PlaylistItemProps {
  playlist: Playlist
  syncState: ActiveSyncState
  stats?: PlaylistStats
  isSelected: boolean
  isDropTarget: boolean
  isEditing: boolean
  editingTitle: string
  onEditingTitleChange: (value: string) => void
  onSelect: () => void
  onStartEditing: () => void
  onSaveRename: () => void
  onCancelRename: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

// A single playlist row: title (with source indicator + inline rename), download/sync status
// indicators, and the expanded sync-progress / last-sync detail.
export function PlaylistItem({
  playlist,
  syncState,
  stats,
  isSelected,
  isDropTarget,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onSelect,
  onStartEditing,
  onSaveRename,
  onCancelRename,
  onDragOver,
  onDragLeave,
  onDrop
}: PlaylistItemProps): React.JSX.Element {
  const { t } = useLanguage()
  const hasTracks = !!stats && stats.total > 0
  const allDownloaded = hasTracks && stats.downloaded >= stats.total

  return (
    <div
      onClick={onSelect}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative flex flex-col rounded-lg px-3 py-2.5 transition cursor-pointer ${
        isDropTarget
          ? 'bg-primary/15 ring-1 ring-primary/60'
          : isSelected
            ? 'bg-zinc-900 text-zinc-100'
            : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveRename()
              } else if (e.key === 'Escape') {
                onCancelRename()
              }
            }}
            onBlur={onSaveRename}
            className="w-full bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded border border-primary focus:outline-none text-sm font-medium"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="flex items-center gap-1.5 truncate pr-20 font-medium text-sm"
            onDoubleClick={(e) => {
              e.stopPropagation()
              onStartEditing()
            }}
          >
            {playlist.source === 'youtube-oauth' ? (
              // Account-connected (OAuth) playlist: still a YouTube playlist, so it gets the
              // YouTube icon rather than a "connected" glyph. Dimmed while its sign-in has
              // expired — a disconnected account instead demotes the playlist to a plain 'local'
              // one (see unlinkPlaylistsForAccount), so there's no separate "broken link" case here.
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`flex-shrink-0 flex items-center ${
                      playlist.linkState === 'needs-reauth' ? 'opacity-40' : ''
                    }`}
                  >
                    <YoutubeIcon className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {playlist.linkState === 'needs-reauth'
                    ? t('sidebar.needsReauthTooltip')
                    : t('sidebar.connectedTooltip')}
                </TooltipContent>
              </Tooltip>
            ) : playlist.source === 'spotify' ? (
              // Spotify playlist — metadata via the Spotify Web API, audio matched and downloaded
              // from YouTube. Download-only, no write-back, like a plain YouTube playlist.
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-shrink-0 flex items-center">
                    <SpotifyIcon className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('sidebar.spotifySourceTooltip')}</TooltipContent>
              </Tooltip>
            ) : (
              // Plain YouTube playlist added via a public URL — download-only, no link.
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-shrink-0 flex items-center">
                    <YoutubeIcon className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('sidebar.localSourceTooltip')}</TooltipContent>
              </Tooltip>
            )}
            <span className="truncate">{playlist.title}</span>
          </div>
        )}

        {/* Status: track count + a single download/sync indicator.
            - amber dot: this connected playlist has local changes not yet pushed to YouTube
            - "downloaded/total": how many tracks are downloaded (Theme 3)
            - status icon: syncing spinner / error / all-downloaded check / download-pending */}
        {!isEditing && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {playlist.source === 'youtube-oauth' &&
              syncState.status !== 'syncing' &&
              playlist.pendingRemoteChanges && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>{t('sidebar.pushPendingTooltip')}</TooltipContent>
                </Tooltip>
              )}

            {hasTracks && syncState.status !== 'syncing' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      allDownloaded ? 'text-zinc-500' : 'text-amber-500'
                    }`}
                  >
                    {stats.downloaded}/{stats.total}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {allDownloaded
                    ? t('sidebar.allDownloadedTooltip', { count: String(stats.total) })
                    : t('sidebar.someMissingTooltip', {
                        downloaded: String(stats.downloaded),
                        total: String(stats.total)
                      })}
                </TooltipContent>
              </Tooltip>
            )}

            {syncState.status === 'syncing' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : syncState.status === 'error' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('sidebar.syncErrorTooltip')}</TooltipContent>
              </Tooltip>
            ) : !hasTracks ? null : allDownloaded ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('sidebar.allDownloadedTooltip', { count: String(stats.total) })}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center">
                    <Download className="h-3.5 w-3.5 text-amber-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('sidebar.someMissingTooltip', {
                    downloaded: String(stats.downloaded),
                    total: String(stats.total)
                  })}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* Last sync / progress details */}
      {syncState.status === 'syncing' ? (
        <SyncProgress syncState={syncState} />
      ) : (
        playlist.lastSync && (
          <div className="mt-0.5 text-[10px] text-zinc-600">
            Sync: {formatLastSync(playlist.lastSync)}
          </div>
        )
      )}
    </div>
  )
}
