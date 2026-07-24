import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { StorageStats } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import type { DownloadsSettingsProps } from './types'

interface UseDownloadsActionsResult {
  loading: boolean
  maxWorkers: number
  setMaxWorkers: (value: number) => void
  storageStats: StorageStats | null
  handleSelectXmlFile: () => Promise<void>
  handleClearXmlFile: () => Promise<void>
  handleExportXmlNow: () => Promise<void>
  handleSelectFolder: () => Promise<void>
  handleCommitWorkers: (value: number) => Promise<void>
}

export function useDownloadsActions({
  settings,
  onUpdateSettings,
  onMigrate
}: Pick<
  DownloadsSettingsProps,
  'settings' | 'onUpdateSettings' | 'onMigrate'
>): UseDownloadsActionsResult {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [maxWorkers, setMaxWorkers] = useState(settings.maxWorkers || 3)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)

  useEffect(() => {
    window.api.getStorageStats().then(setStorageStats)
  }, [])

  // Keeps the slider's local drag state in sync when settings.maxWorkers
  // changes from outside (e.g. still loading on mount), without a useEffect.
  const [prevMaxWorkers, setPrevMaxWorkers] = useState(settings.maxWorkers)
  if (settings.maxWorkers !== prevMaxWorkers) {
    setPrevMaxWorkers(settings.maxWorkers)
    setMaxWorkers(settings.maxWorkers || 3)
  }

  const handleSelectXmlFile = async (): Promise<void> => {
    try {
      const selectedPath = await window.api.selectXmlFile()
      if (!selectedPath) return
      await onUpdateSettings({ rekordboxXmlPath: selectedPath })
      // Auto-trigger export on path set
      const res = await window.api.exportRekordboxXml()
      if (res.success) {
        toast.success(t('settings.rekordboxXmlSuccess'))
      } else {
        toast.error(t('settings.rekordboxXmlError', { error: res.error || '' }))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangePath'))
    }
  }

  const handleClearXmlFile = async (): Promise<void> => {
    try {
      await onUpdateSettings({ rekordboxXmlPath: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangePath'))
    }
  }

  const handleExportXmlNow = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await window.api.exportRekordboxXml()
      if (res.success) {
        toast.success(t('settings.rekordboxXmlSuccess'))
      } else {
        toast.error(t('settings.rekordboxXmlError', { error: res.error || '' }))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(t('settings.rekordboxXmlError', { error: msg }))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const selectedPath = await window.api.selectDirectory()
      if (!selectedPath || selectedPath === settings.downloadPath) return

      // Prompt for migration choice
      const choice = await window.api.confirmMigration()
      if (choice === 'cancel') return

      setLoading(true)
      const moveFiles = choice === 'move'
      await onMigrate(selectedPath, moveFiles)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangePath'))
    } finally {
      setLoading(false)
    }
  }

  const handleCommitWorkers = async (value: number): Promise<void> => {
    if (value === settings.maxWorkers) return
    try {
      await onUpdateSettings({ maxWorkers: value })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeWorkers'))
    }
  }

  return {
    loading,
    maxWorkers,
    setMaxWorkers,
    storageStats,
    handleSelectXmlFile,
    handleClearXmlFile,
    handleExportXmlNow,
    handleSelectFolder,
    handleCommitWorkers
  }
}
