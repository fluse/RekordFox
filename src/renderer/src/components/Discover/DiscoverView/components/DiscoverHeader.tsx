import React from 'react'
import { Compass, Plus, RefreshCw } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import { Button } from '@renderer/components/ui/button'
import type { DiscoverContext } from '../types'

interface DiscoverHeaderProps {
  seedTrack: DiscoverContext['seedTrack']
  selectedCount: number
  loading: boolean
  onAddSelected: () => void
  onRefresh: () => void
}

export default function DiscoverHeader({
  seedTrack,
  selectedCount,
  loading,
  onAddSelected,
  onRefresh
}: DiscoverHeaderProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Compass className="h-5 w-5 text-primary" />
          {t('discover.title')}
        </h1>
        {!seedTrack && <p className="text-xs text-muted-foreground">{t('discover.subtitle')}</p>}
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <Button size="sm" onClick={onAddSelected}>
            <Plus className="h-3.5 w-3.5" />
            {t('discover.addSelected', { count: selectedCount })}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('discover.refresh')}
        </Button>
      </div>
    </div>
  )
}
