import React from 'react'
import { Copy, FolderInput, X } from 'lucide-react'
import type { Playlist, Track } from '@main/db'
import { useLanguage } from '@renderer/i18n'

interface DropChoiceDialogProps {
  track: Track
  targetPlaylist: Playlist
  onChoice: (mode: 'copy' | 'move') => void
  onCancel: () => void
}

// Modal shown after dropping a track onto another playlist, letting the user pick copy vs move.
export function DropChoiceDialog({
  track,
  targetPlaylist,
  onChoice,
  onCancel
}: DropChoiceDialogProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 cursor-pointer text-zinc-400 hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 pr-6 text-lg font-bold text-zinc-100">
          {t('sidebar.dropChoiceTitle', { playlist: targetPlaylist.title })}
        </h2>
        <p className="mb-5 truncate text-sm text-zinc-400">
          {track.title}
          <span className="text-zinc-600"> · {track.artist}</span>
        </p>
        <p className="mb-4 text-sm text-zinc-300">{t('sidebar.dropChoiceQuestion')}</p>

        <div className="space-y-2">
          <button
            onClick={() => onChoice('copy')}
            className="flex w-full items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left transition hover:border-primary/60 hover:bg-zinc-900 cursor-pointer"
          >
            <Copy className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-semibold text-zinc-100">
                {t('sidebar.dropChoiceCopy')}
              </span>
              <span className="block text-xs text-zinc-500">{t('sidebar.dropChoiceCopyDesc')}</span>
            </span>
          </button>
          <button
            onClick={() => onChoice('move')}
            className="flex w-full items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left transition hover:border-primary/60 hover:bg-zinc-900 cursor-pointer"
          >
            <FolderInput className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-semibold text-zinc-100">
                {t('sidebar.dropChoiceMove')}
              </span>
              <span className="block text-xs text-zinc-500">{t('sidebar.dropChoiceMoveDesc')}</span>
            </span>
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            {t('sidebar.dropChoiceCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
