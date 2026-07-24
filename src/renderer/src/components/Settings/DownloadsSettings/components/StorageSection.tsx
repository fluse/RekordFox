import React from 'react'
import { HardDrive } from 'lucide-react'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import { useLanguage } from '@renderer/i18n'
import type { StorageStats } from '@main/db'
import { formatBytes } from '../helpers'

interface StorageSectionProps {
  storageStats: StorageStats | null
}

export default function StorageSection({ storageStats }: StorageSectionProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <SettingsSection title={t('settings.storageSectionLabel')}>
      <div>
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              {t('settings.storageDownloadsLabel')}
            </span>
            <span className="font-medium">
              {storageStats
                ? t('settings.storageDownloadsValue', {
                    count: storageStats.downloadsCount,
                    size: formatBytes(storageStats.downloadsSize)
                  })
                : '…'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('settings.storageCacheLabel')}</span>
            <span className="font-medium">
              {storageStats
                ? t('settings.storageCacheValue', { size: formatBytes(storageStats.cacheSize) })
                : '…'}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">{t('settings.storageHelp')}</p>
      </div>
    </SettingsSection>
  )
}
