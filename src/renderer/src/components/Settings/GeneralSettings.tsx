import React, { useState } from 'react'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Slider } from '@renderer/components/ui/slider'
import { Button } from '@renderer/components/ui/button'
import ToggleGroupField from '@renderer/components/common/ToggleGroupField'
import ColorSchemePicker from './ColorSchemePicker'
import SettingsSection from './SettingsSection'
import type { AppSettings, ColorScheme } from '@main/db'
import { useLanguage, type Language } from '@renderer/i18n'

interface GeneralSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onShowOnboarding: () => void
}

const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }
]

export default function GeneralSettings({
  settings,
  onUpdateSettings,
  onShowOnboarding
}: GeneralSettingsProps): React.JSX.Element {
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

  return (
    <div className="space-y-8">
      <SettingsSection title={t('settings.appearanceMode')}>
        <div>
          <Label className="mb-2 block text-sm font-medium text-muted-foreground">
            {t('settings.themeModeLabel')}
          </Label>
          <ToggleGroupField
            value={settings.theme}
            onValueChange={handleToggleTheme}
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
          <Label className="mb-2 block text-sm font-medium text-muted-foreground">
            {t('settings.colorScheme')}
          </Label>
          <ColorSchemePicker
            value={settings.colorScheme || 'purple'}
            customColor={settings.customAccentColor}
            onChange={handleChangeColorScheme}
          />
        </div>
      </SettingsSection>

      <SettingsSection title={t('settings.languageLabel')}>
        <ToggleGroupField
          value={settings.language || 'de'}
          onValueChange={handleUpdateLanguage}
          options={LANGUAGES.map((lang) => ({
            value: lang.code,
            label: lang.code.toUpperCase(),
            title: lang.name
          }))}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.sectionTooltips')}>
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">
              {t('settings.tooltipsEnabledLabel')}
            </Label>
            <Switch
              checked={settings.tooltipsEnabled ?? true}
              onCheckedChange={handleToggleTooltipsEnabled}
            />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {t('settings.tooltipsEnabledHelp')}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">
              {t('settings.tooltipDelayLabel')}
            </Label>
            <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {t('settings.tooltipDelayMs', { count: tooltipDelay })}
            </span>
          </div>
          <Slider
            min={0}
            max={1500}
            step={50}
            value={[tooltipDelay]}
            onValueChange={([value]) => setTooltipDelay(value)}
            onValueCommit={([value]) => handleCommitTooltipDelay(value)}
            disabled={settings.tooltipsEnabled === false}
          />
        </div>
      </SettingsSection>

      <SettingsSection title={t('settings.sectionOnboarding')}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground">{t('settings.showOnboardingHelp')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-shrink-0 gap-2"
            onClick={onShowOnboarding}
          >
            <Sparkles className="h-4 w-4" />
            {t('settings.showOnboardingButton')}
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}
