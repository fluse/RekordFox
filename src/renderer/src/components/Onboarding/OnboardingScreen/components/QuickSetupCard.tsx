import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Label } from '@renderer/components/ui/label'
import ToggleGroupField from '@renderer/components/common/ToggleGroupField'
import ColorSchemePicker from '@renderer/components/Settings/ColorSchemePicker'
import type { AppSettings, ColorScheme } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import { LANGUAGES } from '../constants'

interface QuickSetupCardProps {
  settings: AppSettings
  onChangeTheme: (theme: 'dark' | 'light') => Promise<void>
  onChangeColorScheme: (colorScheme: ColorScheme, customAccentColor?: string) => Promise<void>
}

export default function QuickSetupCard({
  settings,
  onChangeTheme,
  onChangeColorScheme
}: QuickSetupCardProps): React.JSX.Element {
  const { t, language, setLanguage } = useLanguage()

  return (
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
          onValueChange={onChangeTheme}
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
          onChange={onChangeColorScheme}
        />
      </div>
    </div>
  )
}
