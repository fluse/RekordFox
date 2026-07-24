import React from 'react'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import type { RenamingStatus } from '../types'

interface RenamingProgressProps {
  renamingStatus?: RenamingStatus
}

export default function RenamingProgress({
  renamingStatus
}: RenamingProgressProps): React.JSX.Element | null {
  const { t } = useLanguage()

  if (!renamingStatus?.active) return null

  return (
    <div className="mt-3 flex items-center gap-3 rounded border border-border bg-muted/40 p-2.5">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <div className="flex-1">
        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
          <span>{t('settings.renamingIndicatorText')}</span>
          <span>
            {renamingStatus.current} / {renamingStatus.total}
          </span>
        </div>
        {renamingStatus.total > 0 && (
          <div className="mt-1.5 h-1 w-full bg-background rounded overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(renamingStatus.current / renamingStatus.total) * 100}%`
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
