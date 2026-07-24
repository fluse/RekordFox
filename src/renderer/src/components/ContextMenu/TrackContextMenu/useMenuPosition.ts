import { useLayoutEffect, useRef, useState } from 'react'

// Keeps the menu inside the viewport by clamping its origin against the measured size.
export function useMenuPosition(
  x: number,
  y: number
): { menuRef: React.RefObject<HTMLDivElement | null>; position: { x: number; y: number } } {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const clampedX = Math.min(x, window.innerWidth - rect.width - 8)
    const clampedY = Math.min(y, window.innerHeight - rect.height - 8)
    setPosition({ x: Math.max(8, clampedX), y: Math.max(8, clampedY) })
  }, [x, y])

  return { menuRef, position }
}
