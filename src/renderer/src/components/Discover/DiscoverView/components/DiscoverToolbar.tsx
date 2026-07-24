import React from 'react'
import { X } from 'lucide-react'
import type { Playlist } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { DiscoverContext } from '../types'

interface DiscoverToolbarProps {
  playlists: Playlist[]
  activePlaylistId: string | null
  seedTrack: DiscoverContext['seedTrack']
  selectableCount: number
  loading: boolean
  allSelected: boolean
  onContextChange: (context: DiscoverContext) => void
  onToggleSelectAll: () => void
}

export default function DiscoverToolbar({
  playlists,
  activePlaylistId,
  seedTrack,
  selectableCount,
  loading,
  allSelected,
  onContextChange,
  onToggleSelectAll
}: DiscoverToolbarProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-6 py-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('discover.selectPlaylistLabel')}
      </label>
      <select
        value={activePlaylistId || ''}
        onChange={(e) => onContextChange({ playlistId: e.target.value })}
        disabled={playlists.length === 0}
        className="cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed"
      >
        {playlists.length === 0 && <option value="">{t('discover.noPlaylists')}</option>}
        {playlists.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      {seedTrack ? (
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="max-w-[220px] truncate">
            {t('discover.seedTrackLabel', { title: seedTrack.title })}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() =>
                  activePlaylistId && onContextChange({ playlistId: activePlaylistId })
                }
                className="cursor-pointer text-primary/70 hover:text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('discover.clearSeedTrack')}</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">{t('discover.basedOnArtists')}</span>
      )}

      {selectableCount > 0 && !loading && (
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="ml-auto cursor-pointer text-xs font-semibold text-primary hover:underline"
        >
          {allSelected ? t('discover.clearSelection') : t('discover.selectAll')}
        </button>
      )}
    </div>
  )
}
