import { useState } from 'react'

interface UseKnobDragParams {
  min: number
  max: number
  value: number
  onChange: (val: number) => void
  defaultValue: number
}

export interface UseKnobDragResult {
  isDragging: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  handleDoubleClick: () => void
}

// Vertical-drag interaction for a knob: 150px of drag sweeps the full range; double-click resets
// to the default value.
export function useKnobDrag({
  min,
  max,
  value,
  onChange,
  defaultValue
}: UseKnobDragParams): UseKnobDragResult {
  const [isDragging, setIsDragging] = useState(false)

  const handleDoubleClick = (): void => {
    onChange(defaultValue)
  }

  const handleMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    setIsDragging(true)

    const startY = e.clientY
    const startValue = value
    const range = max - min
    const pixelsPerUnit = 150 / range // 150px drag sweeps full range

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const deltaY = startY - moveEvent.clientY // drag up increases value
      const newValue = startValue + deltaY / pixelsPerUnit
      const clampedValue = Math.max(min, Math.min(max, newValue))
      onChange(Math.round(clampedValue))
    }

    const handleMouseUp = (): void => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return { isDragging, handleMouseDown, handleDoubleClick }
}
