import React, { useState } from 'react'
import { cn } from '@renderer/lib/utils'
import type { AppSettings, Playlist } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import { resolveAppShortcuts } from '@renderer/utils/appShortcuts'
import GeneralSettings from '@renderer/components/Settings/GeneralSettings'
import LibrarySettings from '@renderer/components/Settings/LibrarySettings'
import DownloadsSettings from '@renderer/components/Settings/DownloadsSettings'
import AppShortcutsSettings from '@renderer/components/Settings/AppShortcutsSettings'
import ConnectionsSettings from '@renderer/components/Settings/ConnectionsSettings'
import type { SettingsCategory } from './types'
import { buildCategories } from './constants'

interface SettingsViewProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onMigrate: (newPath: string, moveFiles: boolean) => Promise<void>
  onPlaylistImported: (playlist: Playlist) => void
  isSyncing: boolean
  initialCategory?: SettingsCategory
  renamingStatus?: {
    active: boolean
    current: number
    total: number
  }
  onShowOnboarding: () => void
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  onMigrate,
  onPlaylistImported,
  isSyncing,
  initialCategory,
  renamingStatus,
  onShowOnboarding
}: SettingsViewProps): React.JSX.Element {
  const [category, setCategory] = useState<SettingsCategory>(initialCategory || 'general')
  const { t } = useLanguage()

  const categories = buildCategories(t)

  return (
    <div className="flex flex-1 overflow-hidden bg-muted/20">
      <div className="w-56 flex-shrink-0 border-r border-border p-4 space-y-1 overflow-y-auto">
        <h1 className="px-2 pb-3 text-lg font-bold text-foreground">{t('settings.title')}</h1>
        {categories.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer',
              category === key
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
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
            <GeneralSettings
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onShowOnboarding={onShowOnboarding}
            />
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
          {category === 'connections' && (
            <ConnectionsSettings
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onPlaylistImported={onPlaylistImported}
            />
          )}
        </div>
      </div>
    </div>
  )
}
