import React from 'react'
import { useLanguage } from '@renderer/i18n'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'
import SpotifyIcon from '@renderer/components/icons/SpotifyIcon'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import { useYoutubeAccounts } from './useYoutubeAccounts'
import { useSpotifyAccount } from './useSpotifyAccount'
import CredentialsForm from './components/CredentialsForm'
import SpotifyCredentialsForm from './components/SpotifyCredentialsForm'
import AccountCard from './components/AccountCard'
import type { ConnectionsSettingsProps } from './types'

export default function ConnectionsSettings({
  settings,
  onUpdateSettings,
  onPlaylistImported
}: ConnectionsSettingsProps): React.JSX.Element {
  const { t } = useLanguage()
  const {
    accounts,
    remotePlaylistsByAccount,
    activeAction,
    testResult,
    importingId,
    reconcilingId,
    loadRemotePlaylists,
    handleReconcile,
    handleConnect,
    handleCopyLink,
    handleTestConnection,
    handleDisconnect,
    handleImport
  } = useYoutubeAccounts(onPlaylistImported)
  const {
    account: spotifyAccount,
    activeAction: spotifyActiveAction,
    testResult: spotifyTestResult,
    handleConnect: handleSpotifyConnect,
    handleCopyLink: handleSpotifyCopyLink,
    handleTestConnection: handleSpotifyTestConnection,
    handleDisconnect: handleSpotifyDisconnect
  } = useSpotifyAccount()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <YoutubeIcon className="h-4 w-4" />
          {t('connections.title')}
        </h2>
        <p className="text-xs text-muted-foreground">{t('connections.subtitle')}</p>
      </div>

      <CredentialsForm
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        activeAction={activeAction}
        testResult={testResult}
        onConnect={handleConnect}
        onCopyLink={handleCopyLink}
        onTestConnection={handleTestConnection}
      />

      <SettingsSection title={t('connections.connectedAccountsTitle')}>
        {accounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('connections.noAccounts')}</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                remotePlaylists={remotePlaylistsByAccount[account.id] || []}
                reconcilingId={reconcilingId}
                importingId={importingId}
                onLoadPlaylists={loadRemotePlaylists}
                onReconcile={handleReconcile}
                onDisconnect={handleDisconnect}
                onImport={handleImport}
              />
            ))}
          </div>
        )}
      </SettingsSection>

      <div>
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <SpotifyIcon className="h-4 w-4" />
          {t('connections.spotifyTitle')}
        </h2>
        <p className="text-xs text-muted-foreground">{t('connections.spotifySubtitle')}</p>
      </div>

      <SpotifyCredentialsForm
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        account={spotifyAccount}
        activeAction={spotifyActiveAction}
        testResult={spotifyTestResult}
        onConnect={handleSpotifyConnect}
        onCopyLink={handleSpotifyCopyLink}
        onTestConnection={handleSpotifyTestConnection}
        onDisconnect={handleSpotifyDisconnect}
      />
    </div>
  )
}
