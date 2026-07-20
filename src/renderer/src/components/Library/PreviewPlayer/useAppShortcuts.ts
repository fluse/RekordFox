import { useEffect } from 'react'
import type { Track } from '@main/db'
import {
  comboFromEvent,
  resolveAppShortcuts,
  type AppShortcutAction
} from '@renderer/utils/appShortcuts'

interface UseAppShortcutsOptions {
  savedShortcuts: Record<string, string> | undefined
  previewTrack: Track | null
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  advance: () => void
  previous: () => void
  volume: number
  handleVolumeChange: (volume: number) => void
  toggleMute: () => void
  currentTime: number
  duration: number
  seekTo: (time: number) => void
  toggleQueuePanel: () => void
  toggleDockMode: () => void
}

const VOLUME_STEP = 0.05
const SEEK_STEP_SECONDS = 5

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

export function useAppShortcuts({
  savedShortcuts,
  previewTrack,
  isPlaying,
  setIsPlaying,
  advance,
  previous,
  volume,
  handleVolumeChange,
  toggleMute,
  currentTime,
  duration,
  seekTo,
  toggleQueuePanel,
  toggleDockMode
}: UseAppShortcutsOptions): void {
  useEffect(() => {
    if (!previewTrack) return

    const shortcuts = resolveAppShortcuts(savedShortcuts)
    const actionByCombo = new Map<string, AppShortcutAction>(
      Object.entries(shortcuts).map(([action, combo]) => [combo, action as AppShortcutAction])
    )

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.repeat || isTypingTarget(e.target)) return

      const action = actionByCombo.get(comboFromEvent(e))
      if (!action) return

      e.preventDefault()

      switch (action) {
        case 'previewPlayPause':
          setIsPlaying(!isPlaying)
          break
        case 'previewNext':
          advance()
          break
        case 'previewPrevious':
          previous()
          break
        case 'previewVolumeUp':
          handleVolumeChange(Math.min(1, volume + VOLUME_STEP))
          break
        case 'previewVolumeDown':
          handleVolumeChange(Math.max(0, volume - VOLUME_STEP))
          break
        case 'previewMute':
          toggleMute()
          break
        case 'previewSeekForward':
          seekTo(Math.min(duration, currentTime + SEEK_STEP_SECONDS))
          break
        case 'previewSeekBackward':
          seekTo(Math.max(0, currentTime - SEEK_STEP_SECONDS))
          break
        case 'previewToggleQueue':
          toggleQueuePanel()
          break
        case 'previewToggleDock':
          toggleDockMode()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    savedShortcuts,
    previewTrack,
    isPlaying,
    setIsPlaying,
    advance,
    previous,
    volume,
    handleVolumeChange,
    toggleMute,
    currentTime,
    duration,
    seekTo,
    toggleQueuePanel,
    toggleDockMode
  ])
}
