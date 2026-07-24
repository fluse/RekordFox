import type { ActiveSyncState } from './types'

// Formats a playlist's last-sync timestamp as "DD.MM.YYYY HH:mm"; empty string for invalid dates.
export function formatLastSync(lastSync: string): string {
  const d = new Date(lastSync)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Overall sync progress (0-100), blending completed tracks with the partial progress of the
// tracks currently downloading in parallel.
export function computeSyncPercent(syncState: ActiveSyncState): number {
  if (!syncState.total || syncState.total <= 0) return 0
  const completed = syncState.completedTrackIds?.length || 0
  const activePartial = Object.values(syncState.activeDownloads || {}).reduce(
    (sum, dl) => sum + dl.percent / 100,
    0
  )
  return Math.min(100, Math.floor(((completed + activePartial) / syncState.total) * 100))
}
