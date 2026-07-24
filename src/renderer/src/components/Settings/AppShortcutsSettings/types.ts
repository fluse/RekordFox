import type { AppShortcutAction } from '@renderer/utils/appShortcuts'

export interface AppShortcutsSettingsProps {
  shortcuts: Record<AppShortcutAction, string>
  onChange: (shortcuts: Record<string, string>) => void
}
