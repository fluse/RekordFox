import React from 'react'
import { Slider } from '@renderer/components/ui/slider'
import ToggleGroupField from '@renderer/components/common/ToggleGroupField'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import { useLanguage } from '@renderer/i18n'
import type { LibrarySettingsProps } from './types'
import { useLibrarySettingsActions } from './useLibrarySettingsActions'
import RenamingProgress from './components/RenamingProgress'

export default function LibrarySettings({
  settings,
  onUpdateSettings,
  renamingStatus
}: LibrarySettingsProps): React.JSX.Element {
  const { t } = useLanguage()
  const { historyLimit, setHistoryLimit, handleUpdateFilenameTemplate, handleCommitHistoryLimit } =
    useLibrarySettingsActions({ settings, onUpdateSettings })

  return (
    <div className="space-y-8">
      <SettingsSection title={t('settings.filenameTemplateLabel')}>
        <div>
          <ToggleGroupField
            orientation="vertical"
            value={settings.filenameTemplate || 'default'}
            onValueChange={handleUpdateFilenameTemplate}
            disabled={renamingStatus?.active}
            options={[
              { value: 'default', label: t('settings.filenameTemplateDefault') },
              { value: 'custom', label: t('settings.filenameTemplateCustom') }
            ]}
          />
          <p className="mt-2 text-[10px] text-muted-foreground">
            {t('settings.filenameTemplateHelp')}
          </p>

          <RenamingProgress renamingStatus={renamingStatus} />
        </div>
      </SettingsSection>

      <SettingsSection title={t('settings.historyLimitLabel')}>
        <div>
          <div className="flex justify-end mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded border text-primary bg-primary/10 border-primary/20">
              {t('settings.historyLimitCount', { count: historyLimit })}
            </span>
          </div>
          <Slider
            min={10}
            max={500}
            step={10}
            value={[historyLimit]}
            onValueChange={([value]) => setHistoryLimit(value)}
            onValueCommit={([value]) => handleCommitHistoryLimit(value)}
          />
          <p className="mt-2 text-[10px] text-muted-foreground">{t('settings.historyLimitHelp')}</p>
        </div>
      </SettingsSection>
    </div>
  )
}
