import React, { useState } from 'react'
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  LogIn,
  Copy,
  Wifi,
  CheckCircle2,
  XCircle,
  Trash2
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { AppSettings } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import SpotifySetupGuide from '@renderer/components/Settings/SpotifySetupGuide'
import type {
  ConnectAction,
  ConnectHandler,
  PublicOAuthAccount,
  TestConnectionResult
} from '../types'

interface SpotifyCredentialsFormProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  account: PublicOAuthAccount | null
  activeAction: ConnectAction | null
  testResult: TestConnectionResult | null
  onConnect: ConnectHandler
  onCopyLink: ConnectHandler
  onTestConnection: ConnectHandler
  onDisconnect: () => Promise<void>
}

// Reading Spotify playlist tracks requires a real logged-in Spotify account (Spotify no longer
// serves track data over the app-only Client-Credentials flow for apps without extended API
// access) — so, like YouTube, this needs a full OAuth connect/disconnect flow, not just a
// Client ID/Secret pair.
export default function SpotifyCredentialsForm({
  settings,
  onUpdateSettings,
  account,
  activeAction,
  testResult,
  onConnect,
  onCopyLink,
  onTestConnection,
  onDisconnect
}: SpotifyCredentialsFormProps): React.JSX.Element {
  const { t } = useLanguage()
  const [clientId, setClientId] = useState(settings.spotifyClientId || '')
  const [clientSecret, setClientSecret] = useState(settings.spotifyClientSecret || '')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  const handleSaveCredentials = async (): Promise<void> => {
    await onUpdateSettings({
      spotifyClientId: clientId.trim(),
      spotifyClientSecret: clientSecret.trim()
    })
  }

  return (
    <SettingsSection title={t('connections.spotifyCredentialsTitle')}>
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div>
          <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t('connections.spotifyClientIdLabel')}
          </Label>
          <Input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            onBlur={handleSaveCredentials}
            placeholder={t('connections.spotifyClientIdPlaceholder')}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {t('connections.spotifyClientSecretLabel')}
          </Label>
          <Input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            onBlur={handleSaveCredentials}
            placeholder={t('connections.spotifyClientSecretPlaceholder')}
            className="h-8 text-xs"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {t('connections.spotifyCredentialsHelp')}
        </p>

        <button
          type="button"
          onClick={() => setIsGuideOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {t('spotifyGuide.toggle')}
          {isGuideOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {isGuideOpen && <SpotifySetupGuide />}

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
              : t('connections.spotifyConnectButton')}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onTestConnection(clientId, clientSecret, handleSaveCredentials)}
            disabled={activeAction !== null}
            className="gap-2"
          >
            {activeAction === 'test' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            {activeAction === 'test' ? t('connections.testing') : t('connections.testConnection')}
          </Button>
        </div>

        {testResult && activeAction === null && (
          <p
            className={`flex items-center gap-1.5 text-xs font-medium ${
              testResult.status === 'success' ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {testResult.status === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            {testResult.status === 'success'
              ? t('connections.testSuccess')
              : t('connections.testError', { error: testResult.message || '' })}
          </p>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-border p-3">
        <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
          {t('connections.spotifyConnectedAccountTitle')}
        </Label>
        {account ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{account.label}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={onDisconnect}
                  className="hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('connections.disconnectButton')}</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('connections.spotifyNoAccount')}</p>
        )}
      </div>
    </SettingsSection>
  )
}
