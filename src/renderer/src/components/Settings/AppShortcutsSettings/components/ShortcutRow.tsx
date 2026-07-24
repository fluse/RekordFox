import React from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useLanguage } from '@renderer/i18n'
import { formatCombo, type AppShortcutAction } from '@renderer/utils/appShortcuts'
import { ACTION_LABEL_KEYS } from '../constants'

interface ShortcutRowProps {
  action: AppShortcutAction
  combo: string
  isRecording: boolean
  conflictWithAction: AppShortcutAction | null
  onStartRecording: (action: AppShortcutAction) => void
  onReset: (action: AppShortcutAction) => void
}

export default function ShortcutRow({
  action,
  combo,
  isRecording,
  conflictWithAction,
  onStartRecording,
  onReset
}: ShortcutRowProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <span className="text-xs text-foreground/80">{t(ACTION_LABEL_KEYS[action])}</span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={isRecording ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStartRecording(action)}
            className={`min-w-[110px] font-mono ${isRecording ? 'animate-pulse' : ''}`}
          >
            {isRecording ? t('settings.shortcuts.pressKey') : formatCombo(combo)}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onReset(action)}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.shortcuts.reset')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {conflictWithAction && (
        <p className="text-[10px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1">
          {t('settings.shortcuts.conflict', {
            action: t(ACTION_LABEL_KEYS[conflictWithAction])
          })}
        </p>
      )}
    </div>
  )
}
