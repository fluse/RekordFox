import React, { useState } from 'react'
import { Search, X, HardDrive, SlidersHorizontal, Loader2 } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { COLUMN_DEFS } from './columns'

interface TracklistToolbarProps {
  playlistTitle: string
  search: string
  onSearchChange: (value: string) => void
  onExportClick: () => void
  isYoutubeOauth: boolean
  pendingRemoteChanges: boolean
  isSyncingToYoutube: boolean
  onSyncToYoutube: () => void
  visibleColumns: string[]
  onToggleColumn: (colId: string) => void
}

export default function TracklistToolbar({
  playlistTitle,
  search,
  onSearchChange,
  onExportClick,
  isYoutubeOauth,
  pendingRemoteChanges,
  isSyncingToYoutube,
  onSyncToYoutube,
  visibleColumns,
  onToggleColumn
}: TracklistToolbarProps): React.JSX.Element {
  const { t } = useLanguage()
  const [isColMenuOpen, setIsColMenuOpen] = useState(false)

  return (
    <div className="flex h-16 items-center justify-between border-b border-zinc-900 px-6">
      <h1 className="text-lg font-bold text-zinc-200 truncate max-w-[300px]">{playlistTitle}</h1>
      <div className="flex items-center gap-3">
        {isYoutubeOauth && (
          <button
            onClick={onSyncToYoutube}
            disabled={!pendingRemoteChanges || isSyncingToYoutube}
            className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-100 hover:border-primary/55 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-950 disabled:hover:border-zinc-800"
          >
            {isSyncingToYoutube ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <YoutubeIcon className="h-3.5 w-3.5" />
            )}
            <span>
              {isSyncingToYoutube ? t('tracklist.syncingToYoutube') : t('tracklist.syncToYoutube')}
            </span>
          </button>
        )}

        <button
          onClick={onExportClick}
          className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-100 hover:border-primary/55 cursor-pointer"
        >
          <HardDrive className="h-3.5 w-3.5" />
          <span>{t('tracklist.usbExport')}</span>
        </button>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder={t('tracklist.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full border border-zinc-800 bg-zinc-950 py-1.5 pl-9 pr-8 text-xs text-zinc-300 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
          {search && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center text-zinc-500 hover:text-zinc-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('tracklist.clearSearch')}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(): void => setIsColMenuOpen(!isColMenuOpen)}
                className={`flex items-center justify-center h-8 w-8 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100 hover:border-primary/55 cursor-pointer ${
                  isColMenuOpen ? 'border-primary/50 text-primary bg-zinc-900' : ''
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('tracklist.customizeColumns')}</TooltipContent>
          </Tooltip>

          {isColMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={(): void => setIsColMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-xl backdrop-blur-md z-40 animate-in fade-in slide-in-from-top-1 duration-100">
                <h3 className="mb-2 px-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('tracklist.customizeColumns')}
                </h3>
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                  {COLUMN_DEFS.map((col) => {
                    const isVisible = visibleColumns.includes(col.id)
                    const isLocked = !col.canHide
                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium transition select-none ${
                          isLocked
                            ? 'text-zinc-600 cursor-not-allowed opacity-60'
                            : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-zinc-100 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          disabled={isLocked}
                          onChange={(): void => onToggleColumn(col.id)}
                          className="rounded border-zinc-800 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer accent-primary"
                        />
                        <span>{t(col.labelKey)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
