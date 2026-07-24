import React from 'react'
import { useLanguage } from '@renderer/i18n'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'
import SettingsSection from '@renderer/components/Settings/SettingsSection'
import { useYoutubeAccounts } from './useYoutubeAccounts'
import CredentialsForm from './components/CredentialsForm'
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
    importingId,
    reconcilingId,
    loadRemotePlaylists,
    handleReconcile,
    handleConnect,
    handleCopyLink,
    handleDisconnect,
    handleImport
  } = useYoutubeAccounts(onPlaylistImported)

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
        onConnect={handleConnect}
        onCopyLink={handleCopyLink}
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
    </div>
  )
}
