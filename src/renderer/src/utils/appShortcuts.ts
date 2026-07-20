export type AppShortcutAction =
  | 'previewPlayPause'
  | 'previewNext'
  | 'previewPrevious'
  | 'previewVolumeUp'
  | 'previewVolumeDown'
  | 'previewMute'
  | 'previewSeekForward'
  | 'previewSeekBackward'
  | 'previewToggleQueue'
  | 'previewToggleDock'

export const APP_SHORTCUT_ACTIONS: AppShortcutAction[] = [
  'previewPlayPause',
  'previewNext',
  'previewPrevious',
  'previewVolumeUp',
  'previewVolumeDown',
  'previewMute',
  'previewSeekForward',
  'previewSeekBackward',
  'previewToggleQueue',
  'previewToggleDock'
]

export const DEFAULT_APP_SHORTCUTS: Record<AppShortcutAction, string> = {
  previewPlayPause: 'Space',
  previewNext: 'ArrowRight',
  previewPrevious: 'ArrowLeft',
  previewVolumeUp: 'ArrowUp',
  previewVolumeDown: 'ArrowDown',
  previewMute: 'M',
  previewSeekForward: 'Shift+ArrowRight',
  previewSeekBackward: 'Shift+ArrowLeft',
  previewToggleQueue: 'Q',
  previewToggleDock: 'D'
}

const DISPLAY_KEY_NAMES: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→'
}

// Normalizes a keydown event into a stable combo string (e.g. "Shift+ArrowRight",
// "Space", "M") so recorded bindings and live matching always compare equal.
export function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('Mod')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  const rawKey = e.key === ' ' ? 'Space' : e.key
  const key = rawKey.length === 1 ? rawKey.toUpperCase() : rawKey
  parts.push(key)

  return parts.join('+')
}

// True for keys that are pure modifiers and shouldn't be recordable on their own.
export function isModifierKey(key: string): boolean {
  return ['Shift', 'Control', 'Alt', 'Meta'].includes(key)
}

// Display-only formatting of a stored combo string, e.g. "Shift+ArrowRight" -> "Shift+→".
export function formatCombo(combo: string): string {
  return combo
    .split('+')
    .map((part) => DISPLAY_KEY_NAMES[part] || part)
    .join('+')
}

export function resolveAppShortcuts(
  saved: Record<string, string> | undefined
): Record<AppShortcutAction, string> {
  return { ...DEFAULT_APP_SHORTCUTS, ...(saved || {}) }
}
