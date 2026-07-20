import React, { useState } from 'react'
import { Palette, Music, Download, Keyboard, type LucideIcon } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import type { AppSettings } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import { resolveAppShortcuts } from '@renderer/utils/appShortcuts'
import GeneralSettings from './GeneralSettings'
import LibrarySettings from './LibrarySettings'
import DownloadsSettings from './DownloadsSettings'
import AppShortcutsSettings from './AppShortcutsSettings'

type SettingsCategory = 'general' | 'library' | 'downloads' | 'shortcuts'

interface SettingsViewProps {
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

export default function SettingsView({
  settings,
  onUpdateSettings,
  onMigrate,
  isSyncing,
  renamingStatus
}: SettingsViewProps): React.JSX.Element {
  const [category, setCategory] = useState<SettingsCategory>('general')
  const { t } = useLanguage()

  const categories: { key: SettingsCategory; label: string; icon: LucideIcon }[] = [
    { key: 'general', label: t('settings.categoryGeneral'), icon: Palette },
    { key: 'library', label: t('settings.categoryLibrary'), icon: Music },
    { key: 'downloads', label: t('settings.categoryDownloads'), icon: Download },
    { key: 'shortcuts', label: t('settings.categoryShortcuts'), icon: Keyboard }
  ]

  return (
    <div className="flex flex-1 overflow-hidden bg-zinc-900/40">
      <div className="w-56 flex-shrink-0 border-r border-zinc-900 p-4 space-y-1 overflow-y-auto">
        <h1 className="px-2 pb-3 text-lg font-bold text-zinc-100">{t('settings.title')}</h1>
        {categories.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer',
              category === key
                ? 'bg-zinc-900 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          {category === 'general' && (
            <GeneralSettings settings={settings} onUpdateSettings={onUpdateSettings} />
          )}
          {category === 'library' && (
            <LibrarySettings
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              renamingStatus={renamingStatus}
            />
          )}
          {category === 'downloads' && (
            <DownloadsSettings
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onMigrate={onMigrate}
              isSyncing={isSyncing}
            />
          )}
          {category === 'shortcuts' && (
            <AppShortcutsSettings
              shortcuts={resolveAppShortcuts(settings.appShortcuts)}
              onChange={(appShortcuts) => onUpdateSettings({ appShortcuts })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
