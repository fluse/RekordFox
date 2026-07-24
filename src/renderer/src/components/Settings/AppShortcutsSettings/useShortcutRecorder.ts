import { useEffect, useState } from 'react'
import {
  DEFAULT_APP_SHORTCUTS,
  comboFromEvent,
  isModifierKey,
  type AppShortcutAction
} from '@renderer/utils/appShortcuts'
import type { AppShortcutsSettingsProps } from './types'

interface ShortcutConflict {
  action: AppShortcutAction
  withAction: AppShortcutAction
}

interface UseShortcutRecorderResult {
  recordingAction: AppShortcutAction | null
  conflict: ShortcutConflict | null
  startRecording: (action: AppShortcutAction) => void
  handleReset: (action: AppShortcutAction) => void
  handleResetAll: () => void
}

export function useShortcutRecorder({
  shortcuts,
  onChange
}: AppShortcutsSettingsProps): UseShortcutRecorderResult {
  const [recordingAction, setRecordingAction] = useState<AppShortcutAction | null>(null)
  const [conflict, setConflict] = useState<ShortcutConflict | null>(null)

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

  const startRecording = (action: AppShortcutAction): void => {
    setConflict(null)
    setRecordingAction(action)
  }

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

  return {
    recordingAction,
    conflict,
    startRecording,
    handleReset,
    handleResetAll
  }
}
