import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import type { AppSettings } from '@main/db'
import { useLanguage, type Language } from '@renderer/i18n'

interface GeneralSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
}

const LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }
] as const

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
        <div className="flex gap-2">
          <Button
            type="button"
            variant={settings.theme === 'dark' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleToggleTheme('dark')}
          >
            <Moon className="h-4 w-4" />
            {t('settings.themeDark')}
          </Button>
          <Button
            type="button"
            variant={settings.theme === 'light' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleToggleTheme('light')}
          >
            <Sun className="h-4 w-4" />
            {t('settings.themeLight')}
          </Button>
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t('settings.languageLabel')}
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              type="button"
              variant={(settings.language || 'de') === lang.code ? 'default' : 'outline'}
              title={lang.name}
              onClick={() => handleUpdateLanguage(lang.code)}
            >
              {lang.code.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
