import React from 'react'
import { GripHorizontal, ListMusic, PanelRightOpen, X } from 'lucide-react'

interface PreviewPlayerHeaderProps {
  title: string
  onDragStart: (e: React.MouseEvent<HTMLDivElement>) => void
  onClose: () => void
  isQueueOpen: boolean
  onToggleQueue: () => void
  queueToggleLabel: string
  isDocked: boolean
  onToggleDock: () => void
  dockToggleLabel: string
}

export const PreviewPlayerHeader: React.FC<PreviewPlayerHeaderProps> = ({
  title,
  onDragStart,
  onClose,
  isQueueOpen,
  onToggleQueue,
  queueToggleLabel,
  isDocked,
  onToggleDock,
  dockToggleLabel
}) => {
  return (
    <div
      onMouseDown={onDragStart}
      className={`flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 px-3 py-2 text-zinc-400 hover:text-zinc-200 transition-colors ${
        isDocked ? '' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
        <GripHorizontal className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleDock()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={dockToggleLabel}
          className={`rounded p-1 transition cursor-pointer ${
            isDocked
              ? 'bg-zinc-800 text-primary'
              : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </button>
        {!isDocked && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleQueue()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={queueToggleLabel}
            className={`rounded p-1 transition cursor-pointer ${
              isQueueOpen
                ? 'bg-zinc-800 text-primary'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <ListMusic className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default PreviewPlayerHeader
