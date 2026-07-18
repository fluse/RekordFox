import type { Track } from '@main/db'
import type { SortField, SortOrder } from './columns'

export function sortTracks(tracks: Track[], sortField: SortField, sortOrder: SortOrder): Track[] {
  const result = [...tracks]

  result.sort((a, b) => {
    const valA = a[sortField]
    const valB = b[sortField]

    if (valA === undefined && valB === undefined) return 0
    if (valA === undefined) return sortOrder === 'asc' ? 1 : -1
    if (valB === undefined) return sortOrder === 'asc' ? -1 : 1

    if (typeof valA === 'string' && typeof valB === 'string') {
      const strA = valA.toLowerCase()
      const strB = valB.toLowerCase()
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1
      return 0
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    }

    return 0
  })

  return result
}
