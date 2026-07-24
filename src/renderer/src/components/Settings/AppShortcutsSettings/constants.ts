import type { TranslationKey } from '@renderer/i18n'
import type { AppShortcutAction } from '@renderer/utils/appShortcuts'

export const ACTION_LABEL_KEYS: Record<AppShortcutAction, TranslationKey> = {
  previewPlayPause: 'settings.shortcuts.previewPlayPause',
  previewNext: 'settings.shortcuts.previewNext',
  previewPrevious: 'settings.shortcuts.previewPrevious',
  previewVolumeUp: 'settings.shortcuts.previewVolumeUp',
  previewVolumeDown: 'settings.shortcuts.previewVolumeDown',
  previewMute: 'settings.shortcuts.previewMute',
  previewSeekForward: 'settings.shortcuts.previewSeekForward',
  previewSeekBackward: 'settings.shortcuts.previewSeekBackward',
  previewToggleQueue: 'settings.shortcuts.previewToggleQueue',
  previewToggleDock: 'settings.shortcuts.previewToggleDock'
}
