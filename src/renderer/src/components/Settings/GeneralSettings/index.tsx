import React from 'react'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Slider } from '@renderer/components/ui/slider'
import { Button } from '@renderer/components/ui/button'
import ToggleGroupField from '@renderer/components/common/ToggleGroupField'
import ColorSchemePicker from '@renderer/components/Settings/ColorSchemePicker'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import { useLanguage } from '@renderer/i18n'
import { LANGUAGES } from './constants'
import type { GeneralSettingsProps } from './types'
import { useGeneralSettingsActions } from './useGeneralSettingsActions'

export default function GeneralSettings({
  settings,
  onUpdateSettings,
  onShowOnboarding
}: GeneralSettingsProps): React.JSX.Element {
  const { t } = useLanguage()
  const {
    tooltipDelay,
    setTooltipDelay,
    handleToggleTheme,
    handleChangeColorScheme,
    handleUpdateLanguage,
    handleToggleTooltipsEnabled,
    handleCommitTooltipDelay
  } = useGeneralSettingsActions({ settings, onUpdateSettings })

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
