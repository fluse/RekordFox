import React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import type { ColumnConfig, SortField, SortOrder } from './columns'

interface TracklistTableHeadProps {
  visibleCols: ColumnConfig[]
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  onResizeStart: (colId: string, e: React.MouseEvent) => void
}

export default function TracklistTableHead({
  visibleCols,
  sortField,
  sortOrder,
  onSort,
  onResizeStart
}: TracklistTableHeadProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <thead>
      <tr className="border-b border-zinc-800/80 text-xs font-semibold text-zinc-500">
        {visibleCols.map((col, idx) => {
          const isSortable = !!col.sortField
          const isSorted = isSortable && sortField === col.sortField
          const isLast = idx === visibleCols.length - 1
          const alignmentClass =
            col.align === 'center'
              ? 'text-center'
              : col.align === 'right'
                ? 'text-right'
                : 'text-left'
          const isStickyLeft = col.id === 'position'

          return (
            <th
              key={col.id}
              className={`py-3 px-3 relative select-none sticky top-0 bg-zinc-950 border-b border-border/60 ${alignmentClass} ${
                isStickyLeft ? 'left-0 z-30 border-r border-border/50' : 'z-20'
              } ${isSortable ? 'cursor-pointer hover:text-zinc-300' : ''} ${
                isSorted ? 'text-primary font-bold' : ''
              }`}
              onClick={isSortable && col.sortField ? () => onSort(col.sortField!) : undefined}
            >
              <div
                className={`flex items-center gap-1.5 ${
                  col.align === 'center'
                    ? 'justify-center'
                    : col.align === 'right'
                      ? 'justify-end'
                      : 'justify-start'
                }`}
              >
                <span>{t(col.labelKey)}</span>
                {isSortable &&
                  (isSorted ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
                  ))}
              </div>

              {!isLast && (
                <div
                  className="absolute top-0 right-0 translate-x-1/2 h-full w-3 cursor-col-resize flex items-center justify-center z-10 group"
                  onMouseDown={(e) => onResizeStart(col.id, e)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="h-4 w-[1px] bg-zinc-700/60 group-hover:bg-primary/70 group-active:bg-primary transition-colors" />
                </div>
              )}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
