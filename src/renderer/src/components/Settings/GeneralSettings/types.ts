import type { AppSettings } from '@main/db'

export interface GeneralSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onShowOnboarding: () => void
}
