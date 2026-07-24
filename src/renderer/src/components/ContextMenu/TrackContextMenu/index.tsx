import React from 'react'
import type { TrackContextMenuProps } from './types'
import { useMenuPosition } from './useMenuPosition'

export type { TrackContextMenuItem } from './types'

export default function TrackContextMenu({
  x,
  y,
  onClose,
  items
}: TrackContextMenuProps): React.JSX.Element {
  const { menuRef, position } = useMenuPosition(x, y)

  return (
    <>
      <div
        className="fixed inset-0 z-[59]"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        ref={menuRef}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-[60] w-56 rounded-xl border border-zinc-800 bg-zinc-950/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
      >
        {items.map((item) => (
          <React.Fragment key={item.key}>
            {item.divider && <div className="my-1 h-px bg-zinc-800" />}
            <button
              type="button"
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition cursor-pointer ${
                item.destructive
                  ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                  : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-zinc-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </>
  )
}
