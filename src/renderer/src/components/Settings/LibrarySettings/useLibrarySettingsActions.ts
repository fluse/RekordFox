import { useState } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@renderer/i18n'
import type { LibrarySettingsProps } from './types'

type UseLibrarySettingsActionsArgs = Pick<LibrarySettingsProps, 'settings' | 'onUpdateSettings'>

export function useLibrarySettingsActions({
  settings,
  onUpdateSettings
}: UseLibrarySettingsActionsArgs): {
  historyLimit: number
  setHistoryLimit: (value: number) => void
  handleUpdateFilenameTemplate: (filenameTemplate: 'default' | 'custom') => Promise<void>
  handleCommitHistoryLimit: (value: number) => Promise<void>
} {
  const { t } = useLanguage()
  const [historyLimit, setHistoryLimit] = useState(settings.historyLimit ?? 50)

  // Keeps the slider's local drag state in sync when settings.historyLimit
  // changes from outside (e.g. still loading on mount), without a useEffect.
  const [prevHistoryLimit, setPrevHistoryLimit] = useState(settings.historyLimit)
  if (settings.historyLimit !== prevHistoryLimit) {
    setPrevHistoryLimit(settings.historyLimit)
    setHistoryLimit(settings.historyLimit ?? 50)
  }

  const handleUpdateFilenameTemplate = async (
    filenameTemplate: 'default' | 'custom'
  ): Promise<void> => {
    if (filenameTemplate === settings.filenameTemplate) return
    try {
      await onUpdateSettings({ filenameTemplate })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeFilenameTemplate'))
    }
  }

  const handleCommitHistoryLimit = async (value: number): Promise<void> => {
    if (value === settings.historyLimit) return
    try {
      await onUpdateSettings({ historyLimit: value })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeHistoryLimit'))
    }
  }

  return {
    historyLimit,
    setHistoryLimit,
    handleUpdateFilenameTemplate,
    handleCommitHistoryLimit
  }
}
