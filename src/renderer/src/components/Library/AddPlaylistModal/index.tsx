import React from 'react'
import { Plus, Loader2, X, ListMusic } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import ToggleGroupField from '@renderer/components/common/ToggleGroupField'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'
import SpotifyIcon from '@renderer/components/icons/SpotifyIcon'
import { useAddPlaylistForm } from './useAddPlaylistForm'

interface AddPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (url: string, platform: 'youtube' | 'spotify') => Promise<void>
  onCreateEmpty: (title: string) => Promise<void>
}

export default function AddPlaylistModal({
  isOpen,
  onClose,
  onAdd,
  onCreateEmpty
}: AddPlaylistModalProps): React.JSX.Element | null {
  const { t } = useLanguage()
  const { url, platform, loading, error, updateUrl, setPlatform, handleSubmit } =
    useAddPlaylistForm(onAdd, onCreateEmpty, onClose)
  const isEmpty = platform === 'empty'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClose}
              className="absolute cursor-pointer top-4 right-4 text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('addPlaylist.closeTooltip')}</TooltipContent>
        </Tooltip>

        <h2 className="mb-4 text-xl font-bold text-zinc-100">{t('addPlaylist.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              {t('addPlaylist.platformLabel')}
            </label>
            <ToggleGroupField<typeof platform>
              value={platform}
              onValueChange={setPlatform}
              disabled={loading}
              options={[
                {
                  value: 'youtube',
                  label: (
                    <>
                      <YoutubeIcon className="h-3.5 w-3.5" />
                      {t('addPlaylist.platformYoutube')}
                    </>
                  )
                },
                {
                  value: 'spotify',
                  label: (
                    <>
                      <SpotifyIcon className="h-3.5 w-3.5" />
                      {t('addPlaylist.platformSpotify')}
                    </>
                  )
                },
                {
                  value: 'empty',
                  label: (
                    <>
                      <ListMusic className="h-3.5 w-3.5" />
                      {t('addPlaylist.platformEmpty')}
                    </>
                  )
                }
              ]}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              {isEmpty ? t('addPlaylist.labelEmpty') : t('addPlaylist.label')}
            </label>
            <input
              type="text"
              placeholder={
                isEmpty
                  ? t('addPlaylist.placeholderEmpty')
                  : platform === 'spotify'
                    ? t('addPlaylist.placeholderSpotify')
                    : t('addPlaylist.placeholder')
              }
              value={url}
              onChange={(e) => updateUrl(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none ring-primary/50 transition focus:border-primary focus:ring-2"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
            >
              {t('addPlaylist.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('addPlaylist.loading')}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {t('addPlaylist.add')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
