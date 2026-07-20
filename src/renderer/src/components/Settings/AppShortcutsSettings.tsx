import React, { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useLanguage, type TranslationKey } from '@renderer/i18n'
import {
  APP_SHORTCUT_ACTIONS,
  DEFAULT_APP_SHORTCUTS,
  comboFromEvent,
  formatCombo,
  isModifierKey,
  type AppShortcutAction
} from '@renderer/utils/appShortcuts'

const ACTION_LABEL_KEYS: Record<AppShortcutAction, TranslationKey> = {
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

interface AppShortcutsSettingsProps {
  shortcuts: Record<AppShortcutAction, string>
  onChange: (shortcuts: Record<string, string>) => void
  theme: 'dark' | 'light'
}

export default function AppShortcutsSettings({
  shortcuts,
  onChange,
  theme
}: AppShortcutsSettingsProps): React.JSX.Element {
  const { t } = useLanguage()
  const [recordingAction, setRecordingAction] = useState<AppShortcutAction | null>(null)
  const [conflict, setConflict] = useState<{
    action: AppShortcutAction
    withAction: AppShortcutAction
  } | null>(null)

  // While recording, capture the very next keydown anywhere and use it as the
  // new binding, instead of letting it fall through to the live player shortcuts.
  useEffect(() => {
    if (!recordingAction) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      e.preventDefault()
      if (e.key === 'Escape') {
        setRecordingAction(null)
        setConflict(null)
        return
      }
      if (isModifierKey(e.key)) return

      const combo = comboFromEvent(e)
      const conflictingEntry = Object.entries(shortcuts).find(
        ([action, existingCombo]) => action !== recordingAction && existingCombo === combo
      )
      if (conflictingEntry) {
        setConflict({
          action: recordingAction,
          withAction: conflictingEntry[0] as AppShortcutAction
        })
        return
      }

      setConflict(null)
      onChange({ ...shortcuts, [recordingAction]: combo })
      setRecordingAction(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [recordingAction, shortcuts, onChange])

  const handleReset = (action: AppShortcutAction): void => {
    onChange({ ...shortcuts, [action]: DEFAULT_APP_SHORTCUTS[action] })
    if (conflict?.action === action) setConflict(null)
    if (recordingAction === action) setRecordingAction(null)
  }

  const handleResetAll = (): void => {
    onChange({ ...DEFAULT_APP_SHORTCUTS })
    setConflict(null)
    setRecordingAction(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-zinc-400">
          {t('settings.shortcuts.title')}
        </label>
        <button
          type="button"
          onClick={handleResetAll}
          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          {t('settings.shortcuts.resetAll')}
        </button>
      </div>
      <p className="mb-3 text-[10px] text-zinc-500">{t('settings.shortcuts.help')}</p>

      <div className="flex flex-col gap-1.5">
        {APP_SHORTCUT_ACTIONS.map((action) => {
          const isRecording = recordingAction === action
          const hasConflict = conflict?.action === action

          return (
            <div key={action} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <span className="text-xs text-zinc-300">{t(ACTION_LABEL_KEYS[action])}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setConflict(null)
                      setRecordingAction(action)
                    }}
                    className={`min-w-[110px] rounded border px-2 py-1 text-[11px] font-mono font-bold transition cursor-pointer ${
                      isRecording
                        ? 'border-primary bg-primary/10 text-primary animate-pulse'
                        : theme === 'light'
                          ? 'border-amber-600/30 bg-amber-600/10 text-amber-700 hover:bg-amber-600/20'
                          : 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {isRecording
                      ? t('settings.shortcuts.pressKey')
                      : formatCombo(shortcuts[action])}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReset(action)}
                    title={t('settings.shortcuts.reset')}
                    className="rounded p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {hasConflict && (
                <p className="text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                  {t('settings.shortcuts.conflict', {
                    action: t(ACTION_LABEL_KEYS[conflict.withAction])
                  })}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
