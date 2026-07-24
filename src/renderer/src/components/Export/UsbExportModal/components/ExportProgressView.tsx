import React from 'react'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import type { ExportProgress } from '../types'

// The "exporting" step: live progress bar with current track title.
export function ExportProgressView({
  progress,
  percent
}: {
  progress: ExportProgress | null
  percent: number
}): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>{t('usbExport.exporting')}</span>
        </div>
        <span className="font-mono font-bold text-zinc-300">
          {progress ? `${progress.current}/${progress.total}` : t('usbExport.preparing')}
        </span>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/50">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="truncate text-center text-xs font-medium text-zinc-500">
          {progress ? progress.trackTitle : t('usbExport.initializing')}
        </p>
      </div>
    </div>
  )
}
