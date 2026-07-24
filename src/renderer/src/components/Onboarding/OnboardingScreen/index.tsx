import React from 'react'
import { Folder, ListMusic, Loader2, Music4, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useLanguage } from '@renderer/i18n'
import QuickSetupCard from './components/QuickSetupCard'
import FeaturesGrid from './components/FeaturesGrid'
import TryExampleCard from './components/TryExampleCard'
import { useOnboardingActions } from './useOnboardingActions'
import type { OnboardingScreenProps } from './types'

export default function OnboardingScreen({
  settings,
  onUpdateSettings,
  onMigrate,
  onImportPlaylist,
  onAddPlaylist,
  onClose
}: OnboardingScreenProps): React.JSX.Element {
  const { t } = useLanguage()
  const {
    importing,
    pathLoading,
    handleChangeTheme,
    handleChangeColorScheme,
    handleSelectFolder,
    handleImportExample
  } = useOnboardingActions({ settings, onUpdateSettings, onMigrate, onImportPlaylist, onClose })

  return (
    <div className="relative flex flex-1 items-start justify-center overflow-y-auto bg-zinc-900/10 p-8">
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
        <QuickSetupCard
          settings={settings}
          onChangeTheme={handleChangeTheme}
          onChangeColorScheme={handleChangeColorScheme}
        />

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
        <FeaturesGrid />

        {/* Try it out – import the example playlist */}
        <TryExampleCard importing={importing} onImportExample={handleImportExample} />

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
