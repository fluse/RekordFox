import { useEffect, useRef, useState } from 'react'

const WIDTH_STORAGE_KEY = 'rekordfox_preview_player_width'
const DEFAULT_WIDTH = 320
const MIN_WIDTH = 240
const MAX_WIDTH = 560

interface UseResizableWidthResult {
  width: number
  handleResizeStart: (e: React.MouseEvent) => void
}

function clamp(value: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value))
}

// Lets the docked preview player be dragged wider/narrower from its left
// edge, persisting the chosen width across sessions.
export function useResizableWidth(): UseResizableWidthResult {
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem(WIDTH_STORAGE_KEY)
    const parsed = saved ? parseFloat(saved) : NaN
    return clamp(Number.isFinite(parsed) ? parsed : DEFAULT_WIDTH)
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef({ x: 0, width: DEFAULT_WIDTH })

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent): void => {
      const dx = resizeStart.current.x - e.clientX
      setWidth(clamp(resizeStart.current.width + dx))
    }
    const handleMouseUp = (): void => {
      setIsResizing(false)
      setWidth((current) => {
        localStorage.setItem(WIDTH_STORAGE_KEY, String(current))
        return current
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return (): void => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleResizeStart = (e: React.MouseEvent): void => {
    if (e.button !== 0) return
    resizeStart.current = { x: e.clientX, width }
    setIsResizing(true)
    e.preventDefault()
    e.stopPropagation()
  }

  return { width, handleResizeStart }
}
