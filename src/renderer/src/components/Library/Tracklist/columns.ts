import type { TranslationKey } from '@renderer/i18n'

export type SortField =
  | 'position'
  | 'title'
  | 'artist'
  | 'bpm'
  | 'key'
  | 'duration'
  | 'filesize'
  | 'rating'
  | 'bitrate'
  | 'dateAdded'

export type SortOrder = 'asc' | 'desc'

export interface ColumnConfig {
  id: string
  labelKey: TranslationKey
  sortField?: SortField
  align?: 'left' | 'center' | 'right'
  canHide?: boolean
  defaultWidth: number
}

export const COLUMN_DEFS: ColumnConfig[] = [
  {
    id: 'position',
    labelKey: 'tracklist.colPosition',
    sortField: 'position',
    align: 'center',
    canHide: true,
    defaultWidth: 48
  },
  { id: 'cover', labelKey: 'tracklist.colCover', align: 'center', canHide: true, defaultWidth: 64 },
  {
    id: 'title',
    labelKey: 'tracklist.colTitle',
    sortField: 'title',
    align: 'left',
    canHide: false,
    defaultWidth: 280
  },
  {
    id: 'rating',
    labelKey: 'tracklist.colRating',
    sortField: 'rating',
    align: 'center',
    canHide: true,
    defaultWidth: 120
  },
  {
    id: 'bpm',
    labelKey: 'tracklist.colBpm',
    sortField: 'bpm',
    align: 'center',
    canHide: true,
    defaultWidth: 90
  },
  {
    id: 'key',
    labelKey: 'tracklist.colKey',
    sortField: 'key',
    align: 'center',
    canHide: true,
    defaultWidth: 90
  },
  {
    id: 'format',
    labelKey: 'tracklist.colFormat',
    sortField: 'bitrate',
    align: 'center',
    canHide: true,
    defaultWidth: 170
  },
  {
    id: 'dateAdded',
    labelKey: 'tracklist.colDateAdded',
    sortField: 'dateAdded',
    align: 'center',
    canHide: true,
    defaultWidth: 140
  },
  {
    id: 'duration',
    labelKey: 'tracklist.colDuration',
    sortField: 'duration',
    align: 'right',
    canHide: true,
    defaultWidth: 90
  },
  {
    id: 'loadDeck',
    labelKey: 'tracklist.colLoadDeck',
    align: 'center',
    canHide: true,
    defaultWidth: 110
  },
  {
    id: 'remove',
    labelKey: 'tracklist.colRemove',
    align: 'center',
    canHide: false,
    defaultWidth: 52
  }
]

export const DEFAULT_COLUMN_WIDTHS = COLUMN_DEFS.reduce<Record<string, number>>((acc, col) => {
  acc[col.id] = col.defaultWidth
  return acc
}, {})

export const DEFAULT_VISIBLE_COLUMNS = COLUMN_DEFS.map((col) => col.id)
