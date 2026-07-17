import { useEffect, useRef, useState } from 'react'

const HEIGHT_STORAGE_KEY = 'rekordfox_preview_queue_height'
const DEFAULT_HEIGHT = 256
const MIN_HEIGHT = 120
const MAX_HEIGHT = 560

interface UseResizableHeightResult {
  height: number
  handleResizeStart: (e: React.MouseEvent) => void
}

function clamp(value: number): number {
  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, value))
}

// Lets the preview player's queue panel be dragged taller/shorter from its
// bottom edge, persisting the chosen height across sessions.
export function useResizableHeight(): UseResizableHeightResult {
  const [height, setHeight] = useState<number>(() => {
    const saved = localStorage.getItem(HEIGHT_STORAGE_KEY)
    const parsed = saved ? parseFloat(saved) : NaN
    return clamp(Number.isFinite(parsed) ? parsed : DEFAULT_HEIGHT)
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef({ y: 0, height: DEFAULT_HEIGHT })

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent): void => {
      const dy = e.clientY - resizeStart.current.y
      setHeight(clamp(resizeStart.current.height + dy))
    }
    const handleMouseUp = (): void => {
      setIsResizing(false)
      setHeight((current) => {
        localStorage.setItem(HEIGHT_STORAGE_KEY, String(current))
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
    resizeStart.current = { y: e.clientY, height }
    setIsResizing(true)
    e.preventDefault()
    e.stopPropagation()
  }

  return { height, handleResizeStart }
}
