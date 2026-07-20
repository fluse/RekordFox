import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@renderer/components/ui/label'
import ToggleGroupField from '@renderer/components/common/ToggleGroupField'
import type { AppSettings } from '@main/db'
import { useLanguage, type Language } from '@renderer/i18n'

interface GeneralSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
}

const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }
]

export default function GeneralSettings({
  settings,
  onUpdateSettings
}: GeneralSettingsProps): React.JSX.Element {
  const { t } = useLanguage()

  const handleToggleTheme = async (theme: 'dark' | 'light'): Promise<void> => {
    if (theme === settings.theme) return
    try {
      await onUpdateSettings({ theme })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeTheme'))
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

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('settings.theme')}
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
          {t('settings.languageLabel')}
        </Label>
        <ToggleGroupField
          value={settings.language || 'de'}
          onValueChange={handleUpdateLanguage}
          options={LANGUAGES.map((lang) => ({
            value: lang.code,
            label: lang.code.toUpperCase(),
            title: lang.name
          }))}
        />
      </div>
    </div>
  )
}
