import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Slider } from '@renderer/components/ui/slider'
import ToggleGroupField from '@renderer/components/common/ToggleGroupField'
import SettingsSection from './SettingsSection'
import type { AppSettings } from '@main/db'
import { useLanguage } from '@renderer/i18n'

interface LibrarySettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  renamingStatus?: {
    active: boolean
    current: number
    total: number
  }
}

export default function LibrarySettings({
  settings,
  onUpdateSettings,
  renamingStatus
}: LibrarySettingsProps): React.JSX.Element {
  const { t } = useLanguage()
  const [historyLimit, setHistoryLimit] = useState(settings.historyLimit ?? 50)

  // Keeps the slider's local drag state in sync when settings.historyLimit
  // changes from outside (e.g. still loading on mount), without a useEffect.
  const [prevHistoryLimit, setPrevHistoryLimit] = useState(settings.historyLimit)
  if (settings.historyLimit !== prevHistoryLimit) {
    setPrevHistoryLimit(settings.historyLimit)
    setHistoryLimit(settings.historyLimit ?? 50)
  }

  const handleUpdateFilenameTemplate = async (
    filenameTemplate: 'default' | 'custom'
  ): Promise<void> => {
    if (filenameTemplate === settings.filenameTemplate) return
    try {
      await onUpdateSettings({ filenameTemplate })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeFilenameTemplate'))
    }
  }

  const handleCommitHistoryLimit = async (value: number): Promise<void> => {
    if (value === settings.historyLimit) return
    try {
      await onUpdateSettings({ historyLimit: value })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || t('settings.errorChangeHistoryLimit'))
    }
  }

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

          {renamingStatus?.active && (
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
          )}
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
