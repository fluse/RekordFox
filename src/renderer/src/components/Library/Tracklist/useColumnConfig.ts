import { useMemo, useState } from 'react'
import { COLUMN_DEFS, DEFAULT_COLUMN_WIDTHS, DEFAULT_VISIBLE_COLUMNS } from './columns'

const VISIBLE_COLUMNS_KEY = 'rekordfox_visible_columns'
const COLUMN_WIDTHS_KEY = 'rekordfox_column_widths'

function loadVisibleColumns(): string[] {
  const saved = localStorage.getItem(VISIBLE_COLUMNS_KEY)
  if (!saved) return DEFAULT_VISIBLE_COLUMNS

  try {
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return DEFAULT_VISIBLE_COLUMNS

    // Migration: the dateAdded column was added after some users already had a saved layout.
    if (!parsed.includes('dateAdded')) {
      const insertIdx = DEFAULT_VISIBLE_COLUMNS.indexOf('dateAdded')
      const next = [...parsed]
      if (insertIdx !== -1 && insertIdx <= next.length) {
        next.splice(insertIdx, 0, 'dateAdded')
      } else {
        next.push('dateAdded')
      }
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(next))
      return next
    }

    return parsed
  } catch {
    return DEFAULT_VISIBLE_COLUMNS
  }
}

function loadColumnWidths(): Record<string, number> {
  const saved = localStorage.getItem(COLUMN_WIDTHS_KEY)
  if (!saved) return DEFAULT_COLUMN_WIDTHS
  try {
    return JSON.parse(saved)
  } catch {
    return DEFAULT_COLUMN_WIDTHS
  }
}

interface UseColumnConfigResult {
  visibleColumns: string[]
  visibleCols: typeof COLUMN_DEFS
  columnWidths: Record<string, number>
  toggleColumn: (colId: string) => void
  startResize: (colId: string, e: React.MouseEvent) => void
}

export function useColumnConfig(): UseColumnConfigResult {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(loadVisibleColumns)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(loadColumnWidths)

  const visibleCols = useMemo(
    () => COLUMN_DEFS.filter((c) => visibleColumns.includes(c.id)),
    [visibleColumns]
  )

  const toggleColumn = (colId: string): void => {
    setVisibleColumns((prev) => {
      const next = prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : COLUMN_DEFS.filter((c) => c.id === colId || prev.includes(c.id)).map((c) => c.id)
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(next))
      return next
    })
  }

  const startResize = (colId: string, e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = columnWidths[colId] || DEFAULT_COLUMN_WIDTHS[colId]

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const dx = moveEvent.clientX - startX
      const newWidth = Math.max(30, startWidth + dx)
      setColumnWidths((prev) => ({ ...prev, [colId]: newWidth }))
    }

    const handleMouseUp = (): void => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setColumnWidths((prev) => {
        localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(prev))
        return prev
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return { visibleColumns, visibleCols, columnWidths, toggleColumn, startResize }
}
