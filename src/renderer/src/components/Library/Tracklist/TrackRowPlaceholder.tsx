import React from 'react'

interface TrackRowPlaceholderProps {
  colSpan: number
}

const TrackRowPlaceholder = React.forwardRef<HTMLTableRowElement, TrackRowPlaceholderProps>(
  function TrackRowPlaceholder({ colSpan }, ref) {
    return (
      <tr ref={ref} className="transition-all duration-150">
        <td colSpan={colSpan} className="p-0">
          <div className="my-0.5 flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 animate-in fade-in duration-100">
            <div className="h-10 w-10 flex-shrink-0 rounded border border-dashed border-primary/30 bg-primary/10" />
          </div>
        </td>
      </tr>
    )
  }
)

export default TrackRowPlaceholder
