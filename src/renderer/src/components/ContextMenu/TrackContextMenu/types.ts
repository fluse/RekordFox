import type React from 'react'

export interface TrackContextMenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  divider?: boolean
}

export interface TrackContextMenuProps {
  x: number
  y: number
  onClose: () => void
  items: TrackContextMenuItem[]
}
