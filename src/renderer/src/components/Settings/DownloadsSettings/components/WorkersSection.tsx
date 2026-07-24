import React from 'react'
import { Slider } from '@renderer/components/ui/slider'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import { useLanguage } from '@renderer/i18n'

interface WorkersSectionProps {
  maxWorkers: number
  loading: boolean
  onChangeWorkers: (value: number) => void
  onCommitWorkers: (value: number) => Promise<void>
}

export default function WorkersSection({
  maxWorkers,
  loading,
  onChangeWorkers,
  onCommitWorkers
}: WorkersSectionProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <SettingsSection title={t('settings.concurrentDownloads')}>
      <div>
        <div className="flex justify-end mb-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded border text-primary bg-primary/10 border-primary/20">
            {t('settings.workersCount', { count: maxWorkers })}
          </span>
        </div>
        <Slider
          min={1}
          max={12}
          step={1}
          value={[maxWorkers]}
          onValueChange={([value]) => onChangeWorkers(value)}
          onValueCommit={([value]) => onCommitWorkers(value)}
          disabled={loading}
        />
        <p className="mt-2 text-[10px] text-muted-foreground">
          {t('settings.concurrentDownloadsHelp')}
        </p>
      </div>
    </SettingsSection>
  )
}
