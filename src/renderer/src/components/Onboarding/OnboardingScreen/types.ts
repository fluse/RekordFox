import type { AppSettings } from '@main/db'

export interface OnboardingScreenProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onMigrate: (newPath: string, moveFiles: boolean) => Promise<void>
  onImportPlaylist: (url: string) => Promise<void>
  onAddPlaylist: () => void
  /** When provided, a close button is shown (used when opened manually from settings). */
  onClose?: () => void
}
