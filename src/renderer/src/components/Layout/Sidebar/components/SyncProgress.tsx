import React from 'react'
import { useLanguage } from '@renderer/i18n'
import type { ActiveSyncState } from '../types'
import { computeSyncPercent } from '../helpers'

// The expanded "syncing" detail block shown under a playlist while its tracks download:
// an overall progress bar plus a per-worker list of in-flight downloads.
export function SyncProgress({ syncState }: { syncState: ActiveSyncState }): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="mt-1.5 space-y-2">
      {syncState.total && syncState.total > 0 ? (
        <>
          {/* Overall Progress Bar */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
            <span>Downloads</span>
            <span>
              {syncState.completedTrackIds?.length || 0}/{syncState.total}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${computeSyncPercent(syncState)}%` }}
            />
          </div>
        </>
      ) : (
        <div className="text-[10px] text-zinc-500 animate-pulse">{t('sidebar.loadingDetails')}</div>
      )}

      {/* Active Parallel Worker Downloads List */}
      {syncState.activeDownloads && Object.keys(syncState.activeDownloads).length > 0 && (
        <div className="mt-1 space-y-1.5 border-t border-zinc-900/60 pt-1.5">
          {Object.values(syncState.activeDownloads).map((dl) => (
            <div key={dl.trackId} className="space-y-0.5">
              <div className="flex items-center justify-between text-[9px] text-zinc-500">
                <span className="truncate max-w-[150px]" title={dl.title}>
                  ⬇️ {dl.title}
                </span>
                <span className="font-mono text-zinc-400 font-bold">{dl.percent}%</span>
              </div>
              <div className="h-0.5 w-full rounded-full bg-zinc-900/60 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${dl.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
