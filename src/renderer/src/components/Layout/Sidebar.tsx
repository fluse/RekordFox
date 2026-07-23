import React, { useState } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Pencil,
  History,
  Compass
} from 'lucide-react'
import type { Playlist, Track } from '@main/db'
import logo from '@renderer/assets/logo-rekordfox.svg'
import logoLight from '@renderer/assets/logo-rekordfox-light.svg'
import { useLanguage } from '@renderer/i18n'
import { canDropTrack } from '@renderer/utils/playlistSource'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'

interface SidebarProps {
  playlists: Playlist[]
  selectedPlaylistId: string | null
  onSelectPlaylist: (id: string) => void
  isHistorySelected: boolean
  onSelectHistory: () => void
  isDiscoverSelected: boolean
  onSelectDiscover: () => void
  onDeletePlaylist: (id: string) => void
  onSyncPlaylist: (id: string) => void
  onRenamePlaylist: (id: string, newTitle: string) => void
  onOpenAddModal: () => void
  onOpenSettings: () => void
  onOpenYoutubeConnect: () => void
  onDropTrackToPlaylist: (track: Track, targetPlaylistId: string) => void
  isSettingsSelected: boolean
  activeSyncs: Record<
    string,
    {
      status: string
      total?: number
      completedTrackIds?: string[]
      activeDownloads?: Record<string, { trackId: string; title: string; percent: number }>
    }
  >
  width?: number
  theme?: 'dark' | 'light'
  renamingStatus?: {
    active: boolean
    current: number
    total: number
  }
}

export default function Sidebar({
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  isHistorySelected,
  onSelectHistory,
  isDiscoverSelected,
  onSelectDiscover,
  onDeletePlaylist,
  onSyncPlaylist,
  onRenamePlaylist,
  onOpenAddModal,
  onOpenSettings,
  onOpenYoutubeConnect,
  onDropTrackToPlaylist,
  isSettingsSelected,
  activeSyncs,
  width,
  theme = 'dark',
  renamingStatus
}: SidebarProps): React.JSX.Element {
  const { t } = useLanguage()
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  const handleTrackDragOver = (e: React.DragEvent, playlistId: string): void => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropTargetId(playlistId)
  }

  const handleTrackDrop = (e: React.DragEvent, targetPlaylist: Playlist): void => {
    e.preventDefault()
    setDropTargetId(null)
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    let track: Track
    try {
      track = JSON.parse(raw)
    } catch {
      return
    }
    const sourcePlaylist = playlists.find((p) => p.id === track.playlistId)
    if (!canDropTrack(sourcePlaylist, targetPlaylist)) {
      toast.error(t('sidebar.dropBlockedYoutube'))
      return
    }
    if (track.playlistId === targetPlaylist.id) return
    onDropTrackToPlaylist(track, targetPlaylist.id)
  }

  const startEditing = (playlist: Playlist): void => {
    setEditingPlaylistId(playlist.id)
    setEditingTitle(playlist.title)
  }

  const saveRename = (id: string): void => {
    const trimmed = editingTitle.trim()
    if (trimmed && trimmed !== playlists.find((p) => p.id === id)?.title) {
      onRenamePlaylist(id, trimmed)
    }
    setEditingPlaylistId(null)
  }

  const cancelRename = (): void => {
    setEditingPlaylistId(null)
  }
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
                  onClick={onOpenYoutubeConnect}
                  className="rounded p-1 cursor-pointer text-zinc-400 hover:bg-zinc-900 opacity-70 hover:opacity-100"
                >
                  <YoutubeIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('sidebar.connectYoutubeTooltip')}</TooltipContent>
            </Tooltip>
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
              <div
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                onDragOver={(e) => handleTrackDragOver(e, playlist.id)}
                onDragLeave={() => setDropTargetId((prev) => (prev === playlist.id ? null : prev))}
                onDrop={(e) => handleTrackDrop(e, playlist)}
                className={`group relative flex flex-col rounded-lg px-3 py-2.5 transition cursor-pointer ${
                  dropTargetId === playlist.id
                    ? 'bg-primary/15 ring-1 ring-primary/60'
                    : isSelected
                      ? 'bg-zinc-900 text-zinc-100'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  {editingPlaylistId === playlist.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveRename(playlist.id)
                        } else if (e.key === 'Escape') {
                          cancelRename()
                        }
                      }}
                      onBlur={() => saveRename(playlist.id)}
                      className="w-full bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded border border-primary focus:outline-none text-sm font-medium"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className="flex items-center gap-1.5 truncate pr-14 font-medium text-sm"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        startEditing(playlist)
                      }}
                    >
                      {playlist.source === 'youtube-oauth' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex-shrink-0 flex items-center">
                              <YoutubeIcon
                                className={`h-3 w-3 ${
                                  playlist.linkState === 'orphaned' ||
                                  playlist.linkState === 'needs-reauth'
                                    ? 'opacity-40 grayscale'
                                    : ''
                                }`}
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {playlist.linkState === 'orphaned'
                              ? t('sidebar.orphanedTooltip')
                              : playlist.linkState === 'needs-reauth'
                                ? t('sidebar.needsReauthTooltip')
                                : t('sidebar.youtubeSourceTooltip')}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <span className="truncate">{playlist.title}</span>
                    </div>
                  )}

                  {/* Status Indicator */}
                  {editingPlaylistId !== playlist.id && (
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      {playlist.source === 'youtube-oauth' &&
                        syncState.status !== 'syncing' &&
                        (playlist.pendingRemoteChanges ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>{t('sidebar.pushPendingTooltip')}</TooltipContent>
                          </Tooltip>
                        ) : playlist.lastPushToYoutube ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{t('sidebar.pushSyncedTooltip')}</TooltipContent>
                          </Tooltip>
                        ) : null)}
                      {syncState.status === 'syncing' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : syncState.status === 'error' ? (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 opacity-60" />
                      )}
                    </div>
                  )}
                </div>

                {/* Last sync / progress details */}
                {syncState.status === 'syncing' ? (
                  <div className="mt-1.5 space-y-2">
                    {syncState.total && syncState.total > 0 ? (
                      <>
                        {/* Overall Progress Bar */}
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                          <span>Downloads</span>
                          <span>
                            {syncState.completedTrackIds?.length || 0}/{syncState.total}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.floor(
                                  (((syncState.completedTrackIds?.length || 0) +
                                    Object.values(syncState.activeDownloads || {}).reduce(
                                      (sum, dl: { percent: number }) => sum + dl.percent / 100,
                                      0
                                    )) /
                                    syncState.total) *
                                    100
                                )
                              )}%`
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-zinc-500 animate-pulse">
                        {t('sidebar.loadingDetails')}
                      </div>
                    )}

                    {/* Active Parallel Worker Downloads List */}
                    {syncState.activeDownloads &&
                      Object.keys(syncState.activeDownloads).length > 0 && (
                        <div className="mt-1 space-y-1.5 border-t border-zinc-900/60 pt-1.5">
                          {Object.values(syncState.activeDownloads).map(
                            (dl: { trackId: string; title: string; percent: number }) => (
                              <div key={dl.trackId} className="space-y-0.5">
                                <div className="flex items-center justify-between text-[9px] text-zinc-500">
                                  <span className="truncate max-w-[150px]" title={dl.title}>
                                    ⬇️ {dl.title}
                                  </span>
                                  <span className="font-mono text-zinc-400 font-bold">
                                    {dl.percent}%
                                  </span>
                                </div>
                                <div className="h-0.5 w-full rounded-full bg-zinc-900/60 overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all duration-200"
                                    style={{ width: `${dl.percent}%` }}
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  playlist.lastSync && (
                    <div className="mt-0.5 text-[10px] text-zinc-600">
                      Sync:{' '}
                      {(() => {
                        const d = new Date(playlist.lastSync)
                        if (isNaN(d.getTime())) return ''
                        const pad = (n: number): string => String(n).padStart(2, '0')
                        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
                      })()}
                    </div>
                  )
                )}

                {/* Hover Actions */}
                {editingPlaylistId !== playlist.id && (
                  <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditing(playlist)
                          }}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t('sidebar.renamePlaylistTooltip')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSyncPlaylist(playlist.id)
                          }}
                          disabled={syncState.status === 'syncing'}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t('sidebar.syncPlaylistTooltip')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeletePlaylist(playlist.id)
                          }}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t('sidebar.deletePlaylistTooltip')}</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            )
          })}

          {playlists.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <img
                src={theme === 'light' ? logo : logoLight}
                className="h-8 w-8 object-contain opacity-20"
                alt={t('sidebar.noPlaylists')}
              />
              <p className="mt-2 text-xs text-zinc-600">{t('sidebar.noPlaylists')}</p>
              <button
                onClick={onOpenAddModal}
                className="mt-3 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                {t('sidebar.addNow')}
              </button>
            </div>
          )}
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
    </div>
  )
}
