import React, { useEffect, useState } from 'react'
import { Folder, FolderOpen, FileCode, Trash2, Loader2, HardDrive } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Slider } from '@renderer/components/ui/slider'
import type { AppSettings, StorageStats } from '@main/db'
import { useLanguage } from '@renderer/i18n'

function formatBytes(bytes: number): string {
  if (!bytes) return '0 MB'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

interface DownloadsSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onMigrate: (newPath: string, moveFiles: boolean) => Promise<void>
  isSyncing: boolean
}

export default function DownloadsSettings({
  settings,
  onUpdateSettings,
  onMigrate,
  isSyncing
}: DownloadsSettingsProps): React.JSX.Element {
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

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('settings.downloadPathLabel')}
        </Label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              readOnly
              value={settings.downloadPath}
              title={settings.downloadPath}
              className="h-8 flex-1 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectFolder}
              disabled={loading || isSyncing}
              title={
                isSyncing
                  ? t('settings.downloadPathSyncingTooltip')
                  : t('settings.downloadPathSelectTooltip')
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
              {t('settings.downloadPathSelect')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.api.openPath(settings.downloadPath)}
              disabled={loading || !settings.downloadPath}
              title={t('settings.downloadPathOpenTooltip')}
            >
              <FolderOpen className="h-4 w-4" />
              {t('settings.downloadPathOpen')}
            </Button>
          </div>
          {isSyncing ? (
            <p className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 rounded p-1.5 mt-0.5 animate-pulse">
              {t('settings.downloadPathSyncingWarning')}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">{t('settings.downloadPathHelp')}</p>
          )}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('settings.storageSectionLabel')}
        </Label>
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              {t('settings.storageDownloadsLabel')}
            </span>
            <span className="font-medium">
              {storageStats
                ? t('settings.storageDownloadsValue', {
                    count: storageStats.downloadsCount,
                    size: formatBytes(storageStats.downloadsSize)
                  })
                : '…'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('settings.storageCacheLabel')}</span>
            <span className="font-medium">
              {storageStats
                ? t('settings.storageCacheValue', { size: formatBytes(storageStats.cacheSize) })
                : '…'}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">{t('settings.storageHelp')}</p>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('settings.rekordboxXmlLabel')}
        </Label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              readOnly
              placeholder="Nicht konfiguriert (z. B. rekordbox.xml)"
              value={settings.rekordboxXmlPath || ''}
              title={settings.rekordboxXmlPath || ''}
              className="h-8 flex-1 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectXmlFile}
              disabled={loading}
              title={t('settings.rekordboxXmlSelectTooltip')}
            >
              <FileCode className="h-4 w-4" />
              {t('settings.rekordboxXmlSelect')}
            </Button>
            {settings.rekordboxXmlPath && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportXmlNow}
                  disabled={loading}
                  title={t('settings.rekordboxXmlExportNowTooltip')}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {t('settings.rekordboxXmlExportNow')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={handleClearXmlFile}
                  disabled={loading}
                  title={t('settings.rekordboxXmlClearTooltip')}
                  className="hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{t('settings.rekordboxXmlHelp')}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm font-medium text-muted-foreground">
            {t('settings.concurrentDownloads')}
          </Label>
          <span className="text-xs font-bold px-2 py-0.5 rounded border text-primary bg-primary/10 border-primary/20">
            {t('settings.workersCount', { count: maxWorkers })}
          </span>
        </div>
        <Slider
          min={1}
          max={12}
          step={1}
          value={[maxWorkers]}
          onValueChange={([value]) => setMaxWorkers(value)}
          onValueCommit={([value]) => handleCommitWorkers(value)}
          disabled={loading}
        />
        <p className="mt-2 text-[10px] text-muted-foreground">
          {t('settings.concurrentDownloadsHelp')}
        </p>
      </div>
    </div>
  )
}
