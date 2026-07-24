import { useState } from 'react'
import { toast } from 'sonner'
import type { ColorScheme } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import { EXAMPLE_PLAYLIST_URL } from './constants'
import type { OnboardingScreenProps } from './types'

type UseOnboardingActionsParams = Pick<
  OnboardingScreenProps,
  'settings' | 'onUpdateSettings' | 'onMigrate' | 'onImportPlaylist' | 'onClose'
>

interface UseOnboardingActionsResult {
  importing: boolean
  pathLoading: boolean
  handleChangeTheme: (theme: 'dark' | 'light') => Promise<void>
  handleChangeColorScheme: (colorScheme: ColorScheme, customAccentColor?: string) => Promise<void>
  handleSelectFolder: () => Promise<void>
  handleImportExample: () => Promise<void>
}

export function useOnboardingActions({
  settings,
  onUpdateSettings,
  onMigrate,
  onImportPlaylist,
  onClose
}: UseOnboardingActionsParams): UseOnboardingActionsResult {
  const { t } = useLanguage()
  const [importing, setImporting] = useState(false)
  const [pathLoading, setPathLoading] = useState(false)

  const handleChangeTheme = async (theme: 'dark' | 'light'): Promise<void> => {
    if (theme === settings.theme) return
    try {
      await onUpdateSettings({ theme })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('settings.errorChangeTheme'))
    }
  }

  const handleChangeColorScheme = async (
    colorScheme: ColorScheme,
    customAccentColor?: string
  ): Promise<void> => {
    try {
      await onUpdateSettings({ colorScheme, customAccentColor })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('settings.errorChangeColorScheme'))
    }
  }

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const selectedPath = await window.api.selectDirectory()
      if (!selectedPath || selectedPath === settings.downloadPath) return

      setPathLoading(true)
      // On a fresh install there's nothing to move, so skip the migration prompt.
      // If files already exist (e.g. onboarding reopened from settings), ask first.
      const stats = await window.api.getStorageStats()
      let moveFiles = false
      if (stats && stats.downloadsCount > 0) {
        const choice = await window.api.confirmMigration()
        if (choice === 'cancel') return
        moveFiles = choice === 'move'
      }
      await onMigrate(selectedPath, moveFiles)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('settings.errorChangePath'))
    } finally {
      setPathLoading(false)
    }
  }

  const handleImportExample = async (): Promise<void> => {
    setImporting(true)
    try {
      await onImportPlaylist(EXAMPLE_PLAYLIST_URL)
      onClose?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('addPlaylist.errorAddFailed'))
    } finally {
      setImporting(false)
    }
  }

  return {
    importing,
    pathLoading,
    handleChangeTheme,
    handleChangeColorScheme,
    handleSelectFolder,
    handleImportExample
  }
}
