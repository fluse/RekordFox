import React, { useState } from 'react'
import { Loader2, LogIn, HelpCircle, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { AppSettings } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import GoogleOAuthSetupGuide from '@renderer/components/Settings/GoogleOAuthSetupGuide'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import type { ConnectAction, ConnectHandler } from '../types'

interface CredentialsFormProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  activeAction: ConnectAction | null
  onConnect: ConnectHandler
  onCopyLink: ConnectHandler
}

export default function CredentialsForm({
  settings,
  onUpdateSettings,
  activeAction,
  onConnect,
  onCopyLink
}: CredentialsFormProps): React.JSX.Element {
  const { t } = useLanguage()
  const [clientId, setClientId] = useState(settings.youtubeClientId || '')
  const [clientSecret, setClientSecret] = useState(settings.youtubeClientSecret || '')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  const handleSaveCredentials = async (): Promise<void> => {
    await onUpdateSettings({
      youtubeClientId: clientId.trim(),
      youtubeClientSecret: clientSecret.trim()
    })
  }

  return (
    <SettingsSection title={t('connections.credentialsTitle')}>
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div>
          <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t('connections.clientIdLabel')}
          </Label>
          <Input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            onBlur={handleSaveCredentials}
            placeholder={t('connections.clientIdPlaceholder')}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t('connections.clientSecretLabel')}
          </Label>
          <Input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            onBlur={handleSaveCredentials}
            placeholder={t('connections.clientSecretPlaceholder')}
            className="h-8 text-xs"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">{t('connections.credentialsHelp')}</p>

        <button
          type="button"
          onClick={() => setIsGuideOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {t('oauthGuide.toggle')}
          {isGuideOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {isGuideOpen && <GoogleOAuthSetupGuide />}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => onConnect(clientId, clientSecret, handleSaveCredentials)}
            disabled={activeAction !== null}
            className="gap-2"
          >
            {activeAction === 'connect' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {activeAction === 'connect'
              ? t('connections.connecting')
              : t('connections.connectButton')}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopyLink(clientId, clientSecret, handleSaveCredentials)}
                disabled={activeAction !== null}
                className="gap-2"
              >
                {activeAction === 'copy' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {t('connections.copyLink')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('connections.copyLinkTooltip')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </SettingsSection>
  )
}
