import React from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import { useLanguage } from '@renderer/i18n'
import { APP_SHORTCUT_ACTIONS } from '@renderer/utils/appShortcuts'
import type { AppShortcutsSettingsProps } from './types'
import { useShortcutRecorder } from './useShortcutRecorder'
import ShortcutRow from './components/ShortcutRow'

export default function AppShortcutsSettings({
  shortcuts,
  onChange
}: AppShortcutsSettingsProps): React.JSX.Element {
  const { t } = useLanguage()
  const { recordingAction, conflict, startRecording, handleReset, handleResetAll } =
    useShortcutRecorder({ shortcuts, onChange })

  return (
    <SettingsSection
      title={t('settings.shortcuts.title')}
      headerRight={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResetAll}
          className="text-muted-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          {t('settings.shortcuts.resetAll')}
        </Button>
      }
    >
      <div>
        <p className="mb-3 text-[10px] text-muted-foreground">{t('settings.shortcuts.help')}</p>

        <div className="flex flex-col gap-1.5">
          {APP_SHORTCUT_ACTIONS.map((action) => (
            <ShortcutRow
              key={action}
              action={action}
              combo={shortcuts[action]}
              isRecording={recordingAction === action}
              conflictWithAction={conflict?.action === action ? conflict.withAction : null}
              onStartRecording={startRecording}
              onReset={handleReset}
            />
          ))}
        </div>
      </div>
    </SettingsSection>
  )
}
