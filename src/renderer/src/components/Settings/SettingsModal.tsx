import React, { useState, useEffect } from 'react'
import { X, Folder, FolderOpen, Sun, Moon, Loader2, FileCode, Trash2 } from 'lucide-react'
import type { AppSettings } from '@main/db'
import { useLanguage, type Language } from '@renderer/i18n'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onMigrate: (newPath: string, moveFiles: boolean) => Promise<void>
  isSyncing: boolean
  renamingStatus?: {
    active: boolean
    current: number
    total: number
  }
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onMigrate,
  isSyncing,
  renamingStatus
}: SettingsModalProps): React.JSX.Element | null {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [xmlStatus, setXmlStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )
  const { t } = useLanguage()

  useEffect(() => {
    if (!isOpen) {
      setXmlStatus(null)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectXmlFile = async (): Promise<void> => {
    setError('')
    setXmlStatus(null)
    try {
      const selectedPath = await window.api.selectXmlFile()
      if (!selectedPath) return
      await onUpdateSettings({ rekordboxXmlPath: selectedPath })
      // Auto-trigger export on path set
      const res = await window.api.exportRekordboxXml()
      if (res.success) {
        setXmlStatus({ type: 'success', message: t('settings.rekordboxXmlSuccess') })
      } else {
        setXmlStatus({
          type: 'error',
          message: t('settings.rekordboxXmlError', { error: res.error || '' })
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || t('settings.errorChangePath'))
    }
  }

  const handleClearXmlFile = async (): Promise<void> => {
    setError('')
    setXmlStatus(null)
    try {
      await onUpdateSettings({ rekordboxXmlPath: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || t('settings.errorChangePath'))
    }
  }

  const handleExportXmlNow = async (): Promise<void> => {
    setError('')
    setXmlStatus(null)
    setLoading(true)
    try {
      const res = await window.api.exportRekordboxXml()
      if (res.success) {
        setXmlStatus({ type: 'success', message: t('settings.rekordboxXmlSuccess') })
      } else {
        setXmlStatus({
          type: 'error',
          message: t('settings.rekordboxXmlError', { error: res.error || '' })
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setXmlStatus({
        type: 'error',
        message: t('settings.rekordboxXmlError', { error: msg })
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFolder = async (): Promise<void> => {
    setError('')
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
      setError(msg || t('settings.errorChangePath'))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTheme = async (theme: 'dark' | 'light'): Promise<void> => {
    if (theme === settings.theme) return
    try {
      await onUpdateSettings({ theme })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || t('settings.errorChangeTheme'))
    }
  }

  const handleUpdateWorkers = async (maxWorkers: number): Promise<void> => {
    if (maxWorkers === settings.maxWorkers) return
    try {
      await onUpdateSettings({ maxWorkers })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || t('settings.errorChangeWorkers'))
    }
  }

  const handleUpdateLanguage = async (language: Language): Promise<void> => {
    if (language === settings.language) return
    try {
      await onUpdateSettings({ language })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || t('settings.errorChangeLanguage'))
    }
  }

  const handleUpdateFilenameTemplate = async (
    filenameTemplate: 'default' | 'custom'
  ): Promise<void> => {
    if (filenameTemplate === settings.filenameTemplate) return
    try {
      await onUpdateSettings({ filenameTemplate })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || t('settings.errorChangeFilenameTemplate'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-zinc-100 border-b border-zinc-900 p-6 pb-3">
          {t('settings.title')}
        </h2>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Theme Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              {t('settings.theme')}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleToggleTheme('dark')}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold border transition ${
                  settings.theme === 'dark'
                    ? 'bg-primary border-primary text-white shadow shadow-primary/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Moon className="h-4 w-4" />
                {t('settings.themeDark')}
              </button>
              <button
                type="button"
                onClick={() => handleToggleTheme('light')}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold border transition ${
                  settings.theme === 'light'
                    ? 'bg-amber-600 border-amber-600 text-white shadow shadow-amber-600/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Sun className="h-4 w-4" />
                {t('settings.themeLight')}
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              {t('settings.languageLabel')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { code: 'de', name: 'Deutsch' },
                  { code: 'en', name: 'English' },
                  { code: 'fr', name: 'Français' },
                  { code: 'es', name: 'Español' }
                ] as const
              ).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleUpdateLanguage(lang.code)}
                  disabled={loading}
                  title={lang.name}
                  className={`flex items-center justify-center rounded-lg py-2 text-xs font-bold border transition cursor-pointer ${
                    (settings.language || 'de') === lang.code
                      ? settings.theme === 'light'
                        ? 'bg-amber-600 border-amber-600 text-white shadow shadow-amber-600/20'
                        : 'bg-primary border-primary text-white shadow shadow-primary/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Download Path */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              {t('settings.downloadPathLabel')}
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={settings.downloadPath}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 outline-none truncate"
                  title={settings.downloadPath}
                />
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  disabled={loading || isSyncing}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50 cursor-pointer"
                  title={
                    isSyncing
                      ? t('settings.downloadPathSyncingTooltip')
                      : t('settings.downloadPathSelectTooltip')
                  }
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Folder className="h-4 w-4 text-zinc-400" />
                  )}
                  {t('settings.downloadPathSelect')}
                </button>
                <button
                  type="button"
                  onClick={() => window.api.openPath(settings.downloadPath)}
                  disabled={loading || !settings.downloadPath}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50 cursor-pointer"
                  title={t('settings.downloadPathOpenTooltip')}
                >
                  <FolderOpen className="h-4 w-4 text-zinc-400" />
                  {t('settings.downloadPathOpen')}
                </button>
              </div>
              {isSyncing ? (
                <p className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 rounded p-1.5 mt-0.5 animate-pulse">
                  {t('settings.downloadPathSyncingWarning')}
                </p>
              ) : (
                <p className="text-[10px] text-zinc-500">{t('settings.downloadPathHelp')}</p>
              )}
            </div>
          </div>

          {/* Rekordbox XML Auto-Export */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              {t('settings.rekordboxXmlLabel')}
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  placeholder="Nicht konfiguriert (z. B. rekordbox.xml)"
                  value={settings.rekordboxXmlPath || ''}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 outline-none truncate"
                  title={settings.rekordboxXmlPath || ''}
                />
                <button
                  type="button"
                  onClick={handleSelectXmlFile}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50 cursor-pointer"
                  title={t('settings.rekordboxXmlSelectTooltip')}
                >
                  <FileCode className="h-4 w-4 text-zinc-400" />
                  {t('settings.rekordboxXmlSelect')}
                </button>
                {settings.rekordboxXmlPath && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportXmlNow}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50 cursor-pointer"
                      title={t('settings.rekordboxXmlExportNowTooltip')}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      {t('settings.rekordboxXmlExportNow')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearXmlFile}
                      disabled={loading}
                      className="flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 p-2 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition disabled:opacity-50 cursor-pointer"
                      title={t('settings.rekordboxXmlClearTooltip')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-[10px] text-zinc-500">{t('settings.rekordboxXmlHelp')}</p>
              {xmlStatus && (
                <p
                  className={`text-[10px] font-semibold border rounded p-1.5 mt-0.5 ${
                    xmlStatus.type === 'success'
                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-red-500 bg-red-500/10 border-red-500/20'
                  }`}
                >
                  {xmlStatus.message}
                </p>
              )}
            </div>
          </div>

          {/* Concurrent Downloads / Workers Selector */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-zinc-400">
                {t('settings.concurrentDownloads')}
              </label>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  settings.theme === 'light'
                    ? 'text-amber-600 bg-amber-600/10 border-amber-600/20'
                    : 'text-primary bg-primary/10 border-primary/20'
                }`}
              >
                {t('settings.workersCount', { count: settings.maxWorkers || 3 })}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={settings.maxWorkers || 3}
                onChange={(e) => handleUpdateWorkers(parseInt(e.target.value))}
                disabled={loading}
                className={`flex-1 h-2 cursor-pointer bg-zinc-900 rounded-lg outline-none border border-zinc-800 ${
                  settings.theme === 'light' ? 'accent-amber-600' : 'accent-primary'
                }`}
              />
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">
              {t('settings.concurrentDownloadsHelp')}
            </p>
          </div>

          {/* Filename Format Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              {t('settings.filenameTemplateLabel')}
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleUpdateFilenameTemplate('default')}
                disabled={loading || renamingStatus?.active}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold border transition cursor-pointer ${
                  (settings.filenameTemplate || 'default') === 'default'
                    ? settings.theme === 'light'
                      ? 'bg-amber-600 border-amber-600 text-white shadow shadow-amber-600/20'
                      : 'bg-primary border-primary text-white shadow shadow-primary/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {t('settings.filenameTemplateDefault')}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateFilenameTemplate('custom')}
                disabled={loading || renamingStatus?.active}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold border transition cursor-pointer ${
                  settings.filenameTemplate === 'custom'
                    ? settings.theme === 'light'
                      ? 'bg-amber-600 border-amber-600 text-white shadow shadow-amber-600/20'
                      : 'bg-primary border-primary text-white shadow shadow-primary/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {t('settings.filenameTemplateCustom')}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">{t('settings.filenameTemplateHelp')}</p>

            {renamingStatus?.active && (
              <div className="mt-3 flex items-center gap-3 rounded bg-zinc-900 border border-zinc-800 p-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                    <span>{t('settings.renamingIndicatorText')}</span>
                    <span>
                      {renamingStatus.current} / {renamingStatus.total}
                    </span>
                  </div>
                  {renamingStatus.total > 0 && (
                    <div className="mt-1.5 h-1 w-full bg-zinc-950 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${(renamingStatus.current / renamingStatus.total) * 100}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded p-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end p-6 pt-3 border-t border-zinc-900">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
