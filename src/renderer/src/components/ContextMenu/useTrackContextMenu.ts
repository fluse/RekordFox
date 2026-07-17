import { useState } from 'react'
import type { Track } from '@main/db'

interface ContextMenuState {
  track: Track
  x: number
  y: number
}

interface UseTrackContextMenuResult {
  contextMenu: ContextMenuState | null
  open: (track: Track, e: React.MouseEvent) => void
  close: () => void
}

export function useTrackContextMenu(): UseTrackContextMenuResult {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const open = (track: Track, e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ track, x: e.clientX, y: e.clientY })
  }

  const close = (): void => setContextMenu(null)

  return { contextMenu, open, close }
}
