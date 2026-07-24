import React from 'react'
import { Folder, FolderOpen, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import { useLanguage } from '@renderer/i18n'
import type { AppSettings } from '@main/db'

interface DownloadPathSectionProps {
  settings: AppSettings
  loading: boolean
  isSyncing: boolean
  onSelectFolder: () => Promise<void>
}

export default function DownloadPathSection({
  settings,
  loading,
  isSyncing,
  onSelectFolder
}: DownloadPathSectionProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <SettingsSection title={t('settings.downloadPathLabel')}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            readOnly
            value={settings.downloadPath}
            title={settings.downloadPath}
            className="h-8 flex-1 text-xs"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectFolder}
                disabled={loading || isSyncing}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
                {t('settings.downloadPathSelect')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isSyncing
                ? t('settings.downloadPathSyncingTooltip')
                : t('settings.downloadPathSelectTooltip')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.api.openPath(settings.downloadPath)}
                disabled={loading || !settings.downloadPath}
              >
                <FolderOpen className="h-4 w-4" />
                {t('settings.downloadPathOpen')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.downloadPathOpenTooltip')}</TooltipContent>
          </Tooltip>
        </div>
        {isSyncing ? (
          <p className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 rounded p-1.5 mt-0.5 animate-pulse">
            {t('settings.downloadPathSyncingWarning')}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground">{t('settings.downloadPathHelp')}</p>
        )}
      </div>
    </SettingsSection>
  )
}
