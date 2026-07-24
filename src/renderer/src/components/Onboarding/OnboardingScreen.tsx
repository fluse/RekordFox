import React, { useState } from 'react'
import { Download, Folder, ListMusic, Loader2, Moon, Music4, Sun, Usb, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import ToggleGroupField from '@renderer/components/common/ToggleGroupField'
import ColorSchemePicker from '@renderer/components/Settings/ColorSchemePicker'
import type { AppSettings, ColorScheme } from '@main/db'
import { useLanguage, type Language } from '@renderer/i18n'

// An example playlist users are invited to import as a first test to see how downloading works.
const EXAMPLE_PLAYLIST_URL =
  'https://www.youtube.com/playlist?list=PL3N5etFaMKtSOajILxSS3ywVNCdOzkqXQ'

const LANGUAGES: { code: Language; label: string; title: string }[] = [
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'de', label: 'DE', title: 'Deutsch' },
  { code: 'fr', label: 'FR', title: 'Français' },
  { code: 'es', label: 'ES', title: 'Español' }
]

interface OnboardingScreenProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onMigrate: (newPath: string, moveFiles: boolean) => Promise<void>
  onImportPlaylist: (url: string) => Promise<void>
  onAddPlaylist: () => void
  /** When provided, a close button is shown (used when opened manually from settings). */
  onClose?: () => void
}

export default function OnboardingScreen({
  settings,
  onUpdateSettings,
  onMigrate,
  onImportPlaylist,
  onAddPlaylist,
  onClose
}: OnboardingScreenProps): React.JSX.Element {
  const { t, language, setLanguage } = useLanguage()
  const [importing, setImporting] = useState(false)
  const [pathLoading, setPathLoading] = useState(false)

  const features = [
    {
      icon: ListMusic,
      title: t('onboarding.feature1Title'),
      description: t('onboarding.feature1Desc')
    },
    {
      icon: Music4,
      title: t('onboarding.feature2Title'),
      description: t('onboarding.feature2Desc')
    },
    {
      icon: Usb,
      title: t('onboarding.feature3Title'),
      description: t('onboarding.feature3Desc')
    }
  ]

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

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-y-auto bg-zinc-900/10 p-8">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t('onboarding.close')}
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="w-full max-w-2xl py-4">
        {/* Welcome header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Music4 className="h-7 w-7" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-zinc-100">
            {t('onboarding.welcomeTitle')}
          </h1>
          <p className="mx-auto max-w-lg text-sm text-zinc-400">
            {t('onboarding.welcomeSubtitle')}
          </p>
        </div>

        {/* Quick setup: language, theme, color scheme */}
        <div className="mb-6 space-y-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t('onboarding.setupTitle')}
          </h2>

          <div>
            <Label className="mb-2 block text-sm font-medium text-zinc-300">
              {t('settings.languageLabel')}
            </Label>
            <ToggleGroupField
              value={language}
              onValueChange={(lang) => setLanguage(lang)}
              options={LANGUAGES.map((lang) => ({
                value: lang.code,
                label: lang.label,
                title: lang.title
              }))}
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-zinc-300">
              {t('settings.themeModeLabel')}
            </Label>
            <ToggleGroupField
              value={settings.theme}
              onValueChange={handleChangeTheme}
              options={[
                {
                  value: 'dark',
                  label: (
                    <>
                      <Moon className="h-3.5 w-3.5" />
                      {t('settings.themeDark')}
                    </>
                  )
                },
                {
                  value: 'light',
                  label: (
                    <>
                      <Sun className="h-3.5 w-3.5" />
                      {t('settings.themeLight')}
                    </>
                  )
                }
              ]}
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-zinc-300">
              {t('settings.colorScheme')}
            </Label>
            <ColorSchemePicker
              value={settings.colorScheme || 'purple'}
              customColor={settings.customAccentColor}
              onChange={handleChangeColorScheme}
            />
          </div>
        </div>

        {/* Storage location for downloaded MP3s */}
        <div className="mb-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t('settings.downloadPathLabel')}
          </h2>
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
              className="gap-2"
              disabled={pathLoading}
              onClick={handleSelectFolder}
            >
              {pathLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
              {t('settings.downloadPathSelect')}
            </Button>
          </div>
          <p className="text-[10px] text-zinc-500">{t('settings.downloadPathHelp')}</p>
        </div>

        {/* What to expect */}
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t('onboarding.whatToExpectTitle')}
        </h2>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <h3 className="mb-1 text-sm font-semibold text-zinc-100">{feature.title}</h3>
                <p className="text-xs text-zinc-400">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* Try it out – import the example playlist */}
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-sm font-semibold text-zinc-100">
                {t('onboarding.tryTitle')}
              </h3>
              <p className="mb-3 text-xs text-zinc-400">{t('onboarding.tryDesc')}</p>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={importing}
                onClick={handleImportExample}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('onboarding.importing')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {t('onboarding.importExample')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary: add your own playlist */}
        <div className="flex justify-center">
          <Button type="button" variant="outline" className="gap-2" onClick={onAddPlaylist}>
            <ListMusic className="h-4 w-4" />
            {t('onboarding.getStarted')}
          </Button>
        </div>
      </div>
    </div>
  )
}
