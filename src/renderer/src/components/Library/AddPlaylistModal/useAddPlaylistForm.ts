import { useState } from 'react'
import { useLanguage } from '@renderer/i18n'

export interface UseAddPlaylistFormResult {
  url: string
  loading: boolean
  error: string
  updateUrl: (value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

// Form state for adding a YouTube playlist by URL: validates the `list=` parameter, runs the
// async add, and surfaces errors. Resets and closes the modal on success.
export function useAddPlaylistForm(
  onAdd: (url: string) => Promise<void>,
  onClose: () => void
): UseAddPlaylistFormResult {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateUrl = (value: string): void => {
    setUrl(value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!url.trim()) return

    // Simple YouTube playlist validation
    if (!url.includes('list=')) {
      setError(t('addPlaylist.errorInvalidUrl'))
      return
    }

    setLoading(true)
    setError('')

    try {
      await onAdd(url.trim())
      setUrl('')
      onClose()
    } catch (e: unknown) {
      const err = e as Error
      setError(err.message || t('addPlaylist.errorAddFailed'))
    } finally {
      setLoading(false)
    }
  }

  return { url, loading, error, updateUrl, handleSubmit }
}
