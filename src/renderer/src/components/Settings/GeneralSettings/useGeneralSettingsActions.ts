import { useState } from 'react'
import { toast } from 'sonner'
import type { ColorScheme } from '@main/db'
import { useLanguage, type Language } from '@renderer/i18n'
import type { GeneralSettingsProps } from './types'

type UseGeneralSettingsActionsArgs = Pick<GeneralSettingsProps, 'settings' | 'onUpdateSettings'>

export function useGeneralSettingsActions({
  settings,
  onUpdateSettings
}: UseGeneralSettingsActionsArgs): {
  tooltipDelay: number
  setTooltipDelay: (value: number) => void
  handleToggleTheme: (theme: 'dark' | 'light') => Promise<void>
  handleChangeColorScheme: (colorScheme: ColorScheme, customAccentColor?: string) => Promise<void>
  handleUpdateLanguage: (language: Language) => Promise<void>
  handleToggleTooltipsEnabled: (enabled: boolean) => Promise<void>
  handleCommitTooltipDelay: (value: number) => Promise<void>
} {
  const { t } = useLanguage()
  const [tooltipDelay, setTooltipDelay] = useState(settings.tooltipDelay ?? 600)

  // Keeps the slider's local drag state in sync when settings.tooltipDelay
  // changes from outside (e.g. still loading on mount), without a useEffect.
  const [prevTooltipDelay, setPrevTooltipDelay] = useState(settings.tooltipDelay)
  if (settings.tooltipDelay !== prevTooltipDelay) {
    setPrevTooltipDelay(settings.tooltipDelay)
    setTooltipDelay(settings.tooltipDelay ?? 600)
  }

  const handleToggleTheme = async (theme: 'dark' | 'light'): Promise<void> => {
    if (theme === settings.theme) return
    try {
      await onUpdateSettings({ theme })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeTheme'))
    }
  }

  const handleChangeColorScheme = async (
    colorScheme: ColorScheme,
    customAccentColor?: string
  ): Promise<void> => {
    if (colorScheme === settings.colorScheme && customAccentColor === settings.customAccentColor) {
      return
    }
    try {
      await onUpdateSettings({ colorScheme, customAccentColor })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeColorScheme'))
    }
  }

  const handleUpdateLanguage = async (language: Language): Promise<void> => {
    if (language === settings.language) return
    try {
      await onUpdateSettings({ language })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeLanguage'))
    }
  }

  const handleToggleTooltipsEnabled = async (enabled: boolean): Promise<void> => {
    try {
      await onUpdateSettings({ tooltipsEnabled: enabled })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeTooltipsEnabled'))
    }
  }

  const handleCommitTooltipDelay = async (value: number): Promise<void> => {
    if (value === settings.tooltipDelay) return
    try {
      await onUpdateSettings({ tooltipDelay: value })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeTooltipDelay'))
    }
  }

  return {
    tooltipDelay,
    setTooltipDelay,
    handleToggleTheme,
    handleChangeColorScheme,
    handleUpdateLanguage,
    handleToggleTooltipsEnabled,
    handleCommitTooltipDelay
  }
}
