import type { AppSettings } from '@main/db'

export interface DownloadsSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onMigrate: (newPath: string, moveFiles: boolean) => Promise<void>
  isSyncing: boolean
}
