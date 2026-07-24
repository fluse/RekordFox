import type { AppSettings } from '@main/db'

export interface RenamingStatus {
  active: boolean
  current: number
  total: number
}

export interface LibrarySettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  renamingStatus?: RenamingStatus
}
