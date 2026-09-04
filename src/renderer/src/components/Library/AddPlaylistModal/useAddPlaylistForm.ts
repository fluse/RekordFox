import { useState } from 'react'
import { useLanguage } from '@renderer/i18n'

export type AddPlaylistPlatform = 'youtube' | 'spotify'

export interface UseAddPlaylistFormResult {
  url: string
  platform: AddPlaylistPlatform
  loading: boolean
  error: string
  updateUrl: (value: string) => void
  setPlatform: (platform: AddPlaylistPlatform) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

// Form state for adding a playlist by URL: validates the URL against the selected platform
// (YouTube's `list=` parameter, or a Spotify playlist link), runs the async add, and surfaces
// errors. Resets and closes the modal on success.
export function useAddPlaylistForm(
  onAdd: (url: string, platform: AddPlaylistPlatform) => Promise<void>,
  onClose: () => void
): UseAddPlaylistFormResult {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState<AddPlaylistPlatform>('youtube')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateUrl = (value: string): void => {
    setUrl(value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!url.trim()) return

    if (platform === 'youtube' && !url.includes('list=')) {
      setError(t('addPlaylist.errorInvalidUrl'))
      return
    }
    if (platform === 'spotify' && !url.includes('open.spotify.com/playlist/')) {
      setError(t('addPlaylist.errorInvalidUrlSpotify'))
      return
    }

    setLoading(true)
    setError('')

    try {
      await onAdd(url.trim(), platform)
      setUrl('')
      onClose()
    } catch (e: unknown) {
      const err = e as Error
      setError(err.message || t('addPlaylist.errorAddFailed'))
    } finally {
      setLoading(false)
    }
  }

  return { url, platform, loading, error, updateUrl, setPlatform, handleSubmit }
}
