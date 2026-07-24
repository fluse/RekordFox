import React, { useState } from 'react'
import { FileCode, Trash2, Loader2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import RekordboxXmlSetupGuide from '@renderer/components/Settings/RekordboxXmlSetupGuide'
import { useLanguage } from '@renderer/i18n'
import type { AppSettings } from '@main/db'

interface RekordboxXmlSectionProps {
  settings: AppSettings
  loading: boolean
  onSelectXmlFile: () => Promise<void>
  onExportXmlNow: () => Promise<void>
  onClearXmlFile: () => Promise<void>
}

export default function RekordboxXmlSection({
  settings,
  loading,
  onSelectXmlFile,
  onExportXmlNow,
  onClearXmlFile
}: RekordboxXmlSectionProps): React.JSX.Element {
  const { t } = useLanguage()
  const [isXmlGuideOpen, setIsXmlGuideOpen] = useState(false)

  return (
    <SettingsSection title={t('settings.rekordboxXmlLabel')}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            readOnly
            placeholder="Nicht konfiguriert (z. B. rekordbox.xml)"
            value={settings.rekordboxXmlPath || ''}
            title={settings.rekordboxXmlPath || ''}
            className="h-8 flex-1 text-xs"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectXmlFile}
                disabled={loading}
              >
                <FileCode className="h-4 w-4" />
                {t('settings.rekordboxXmlSelect')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settings.rekordboxXmlSelectTooltip')}</TooltipContent>
          </Tooltip>
          {settings.rekordboxXmlPath && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onExportXmlNow}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {t('settings.rekordboxXmlExportNow')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('settings.rekordboxXmlExportNowTooltip')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={onClearXmlFile}
                    disabled={loading}
                    className="hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('settings.rekordboxXmlClearTooltip')}</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">{t('settings.rekordboxXmlHelp')}</p>

        <button
          type="button"
          onClick={() => setIsXmlGuideOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {t('rekordboxGuide.toggle')}
          {isXmlGuideOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {isXmlGuideOpen && <RekordboxXmlSetupGuide />}
      </div>
    </SettingsSection>
  )
}
