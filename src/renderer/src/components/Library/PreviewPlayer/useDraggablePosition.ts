import { useEffect, useRef, useState } from 'react'

const PLAYER_WIDTH = 340
const PLAYER_HEIGHT = 200

interface Position {
  x: number
  y: number
}

interface UseDraggablePositionResult {
  position: Position
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}

// Lets the floating preview player be dragged around the window and keeps it
// clamped on-screen, including when the window itself is resized.
export function useDraggablePosition(): UseDraggablePositionResult {
  const [position, setPosition] = useState<Position>({
    x: window.innerWidth - PLAYER_WIDTH,
    y: window.innerHeight - PLAYER_HEIGHT
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const playerStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleResize = (): void => {
      setPosition((prev) => ({
        x: Math.max(20, Math.min(window.innerWidth - PLAYER_WIDTH, prev.x)),
        y: Math.max(20, Math.min(window.innerHeight - PLAYER_HEIGHT, prev.y))
      }))
    }
    window.addEventListener('resize', handleResize)
    return (): void => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent): void => {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - PLAYER_WIDTH, playerStart.current.x + dx)),
        y: Math.max(10, Math.min(window.innerHeight - PLAYER_HEIGHT, playerStart.current.y + dy))
      })
    }
    const handleMouseUp = (): void => setIsDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return (): void => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Only drag on left click and not on interactive buttons
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) return

    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    playerStart.current = { x: position.x, y: position.y }
    e.preventDefault()
  }

  return { position, handleMouseDown }
}
