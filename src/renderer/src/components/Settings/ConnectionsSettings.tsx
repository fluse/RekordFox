import React, { useCallback, useEffect, useState } from 'react'
import {
  Loader2,
  Trash2,
  Download,
  LogIn,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { AppSettings, Playlist, OAuthAccount } from '@main/db'
import type { RemotePlaylistSummary } from '@main/youtubeSync'
import { useLanguage } from '@renderer/i18n'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'
import GoogleOAuthSetupGuide from './GoogleOAuthSetupGuide'
import SettingsSection from './SettingsSection'

type PublicOAuthAccount = Omit<OAuthAccount, 'accessTokenEnc' | 'refreshTokenEnc'>

const REMOTE_PLAYLISTS_CACHE_PREFIX = 'rekordfox.remoteYoutubePlaylists.'

// Lets the last-known list of a connected account's YouTube playlists show up instantly, before
// the fresh (and much slower) list comes back from the API and silently replaces it.
function loadCachedRemotePlaylists(accountId: string): RemotePlaylistSummary[] {
  try {
    const raw = localStorage.getItem(`${REMOTE_PLAYLISTS_CACHE_PREFIX}${accountId}`)
    return raw ? (JSON.parse(raw) as RemotePlaylistSummary[]) : []
  } catch {
    return []
  }
}

function cacheRemotePlaylists(accountId: string, playlists: RemotePlaylistSummary[]): void {
  localStorage.setItem(`${REMOTE_PLAYLISTS_CACHE_PREFIX}${accountId}`, JSON.stringify(playlists))
}

interface ConnectionsSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onPlaylistImported: (playlist: Playlist) => void
}

export default function ConnectionsSettings({
  settings,
  onUpdateSettings,
  onPlaylistImported
}: ConnectionsSettingsProps): React.JSX.Element {
  const { t } = useLanguage()
  const [clientId, setClientId] = useState(settings.youtubeClientId || '')
  const [clientSecret, setClientSecret] = useState(settings.youtubeClientSecret || '')
  const [accounts, setAccounts] = useState<PublicOAuthAccount[]>([])
  const [activeAction, setActiveAction] = useState<'connect' | 'copy' | null>(null)
  const [remotePlaylistsByAccount, setRemotePlaylistsByAccount] = useState<
    Record<string, RemotePlaylistSummary[]>
  >({})
  const [importingId, setImportingId] = useState<string | null>(null)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [reconcilingId, setReconcilingId] = useState<string | null>(null)

  const loadRemotePlaylists = useCallback(
    async (accountId: string): Promise<void> => {
      try {
        const res = await window.api.listMyYoutubePlaylists(accountId)
        if (res.success && res.playlists) {
          setRemotePlaylistsByAccount((prev) => ({ ...prev, [accountId]: res.playlists! }))
          cacheRemotePlaylists(accountId, res.playlists)
        } else {
          toast.error(t('connections.errorLoadPlaylists', { error: res.error || '' }))
        }
      } catch (err) {
        toast.error(t('connections.errorLoadPlaylists', { error: String(err) }))
      }
    },
    [t]
  )

  useEffect(() => {
    window.api
      .getYoutubeAccounts()
      .then((accs) => {
        setAccounts(accs)
        // Show each account's last-cached playlists right away, then quietly refresh them.
        setRemotePlaylistsByAccount((prev) => {
          const next = { ...prev }
          for (const account of accs) {
            if (!(account.id in next)) next[account.id] = loadCachedRemotePlaylists(account.id)
          }
          return next
        })
        for (const account of accs) {
          loadRemotePlaylists(account.id)
        }
      })
      .catch(console.error)
  }, [loadRemotePlaylists])

  const handleSaveCredentials = async (): Promise<void> => {
    await onUpdateSettings({
      youtubeClientId: clientId.trim(),
      youtubeClientSecret: clientSecret.trim()
    })
  }

  // Applies playlists the main process confirmed belong to the given account, upgrading them
  // from 'local' to 'youtube-oauth' in the UI too — shared by the post-connect check and the
  // manual re-check button, since both surface the exact same kind of result.
  const applyLinkedPlaylists = (linkedPlaylists: Playlist[]): void => {
    if (linkedPlaylists.length === 0) return
    for (const playlist of linkedPlaylists) {
      onPlaylistImported(playlist)
    }
    toast.success(t('connections.playlistsLinked', { count: String(linkedPlaylists.length) }))
  }

  // Awaits the full connect round trip (started by either button) and applies its result once
  // the user finishes signing in — whether they used the auto-opened browser or a pasted link.
  const finishConnect = async (
    connectPromise: ReturnType<typeof window.api.connectYoutubeAccount>
  ): Promise<void> => {
    try {
      const res = await connectPromise
      if (res.success && res.account) {
        setAccounts((prev) => [...prev.filter((a) => a.id !== res.account!.id), res.account!])
        loadRemotePlaylists(res.account.id)
        applyLinkedPlaylists(res.linkedPlaylists || [])
      } else if (!res.success) {
        toast.error(t('connections.errorConnect', { error: res.error || '' }))
      }
    } catch (err) {
      toast.error(t('connections.errorConnect', { error: String(err) }))
    } finally {
      setActiveAction(null)
    }
  }

  // Lets an already-connected account re-run the ownership check on demand — e.g. after pasting
  // a public URL for a playlist that turns out to be the user's own, without having to
  // reconnect or wait for the next app restart.
  const handleReconcile = async (accountId: string): Promise<void> => {
    setReconcilingId(accountId)
    try {
      const res = await window.api.reconcileYoutubePlaylists(accountId)
      if (res.success) {
        if (!res.linkedPlaylists || res.linkedPlaylists.length === 0) {
          toast.success(t('connections.noNewPlaylistsLinked'))
        } else {
          applyLinkedPlaylists(res.linkedPlaylists)
        }
      } else {
        toast.error(t('connections.errorReconcile', { error: res.error || '' }))
      }
    } catch (err) {
      toast.error(t('connections.errorReconcile', { error: String(err) }))
    } finally {
      setReconcilingId(null)
    }
  }

  const handleConnect = async (): Promise<void> => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error(t('connections.missingCredentials'))
      return
    }
    await handleSaveCredentials()
    setActiveAction('connect')
    await finishConnect(window.api.connectYoutubeAccount())
  }

  // Starts the same OAuth flow but without auto-opening a browser: copies the consent URL to the
  // clipboard instead, so the user can paste it into whichever browser/profile they want, then
  // keeps waiting in the background for that login to complete.
  const handleCopyLink = async (): Promise<void> => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error(t('connections.missingCredentials'))
      return
    }
    await handleSaveCredentials()
    setActiveAction('copy')

    const urlPromise = new Promise<string>((resolve) => {
      const unsubscribe = window.api.onYoutubeAuthUrlReady((url) => {
        unsubscribe()
        resolve(url)
      })
    })
    const connectPromise = window.api.connectYoutubeAccount(false)

    try {
      const url = await urlPromise
      window.api.copyToClipboard(url)
      toast.success(t('connections.linkCopied'))
    } catch (err) {
      toast.error(t('connections.errorConnect', { error: String(err) }))
    }

    await finishConnect(connectPromise)
  }

  const handleDisconnect = async (accountId: string): Promise<void> => {
    try {
      const res = await window.api.disconnectYoutubeAccount(accountId)
      if (res.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId))
        setRemotePlaylistsByAccount((prev) => {
          const next = { ...prev }
          delete next[accountId]
          return next
        })
      } else {
        toast.error(t('connections.errorDisconnect', { error: res.error || '' }))
      }
    } catch (err) {
      toast.error(t('connections.errorDisconnect', { error: String(err) }))
    }
  }

  const handleImport = async (accountId: string, remotePlaylistId: string): Promise<void> => {
    setImportingId(remotePlaylistId)
    try {
      const res = await window.api.importYoutubePlaylist(accountId, remotePlaylistId)
      if (res.success && res.playlist) {
        onPlaylistImported(res.playlist)
      } else {
        toast.error(t('connections.errorImport', { error: res.error || '' }))
      }
    } catch (err) {
      toast.error(t('connections.errorImport', { error: String(err) }))
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <YoutubeIcon className="h-4 w-4" />
          {t('connections.title')}
        </h2>
        <p className="text-xs text-muted-foreground">{t('connections.subtitle')}</p>
      </div>

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
              onClick={handleConnect}
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
                  onClick={handleCopyLink}
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

      <SettingsSection title={t('connections.connectedAccountsTitle')}>
        {accounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('connections.noAccounts')}</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{account.label}</span>
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleReconcile(account.id)}
                          disabled={reconcilingId === account.id}
                        >
                          {reconcilingId === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('connections.reconcileButton')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleDisconnect(account.id)}
                          className="hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('connections.disconnectButton')}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t('connections.importPlaylistsTitle')}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadRemotePlaylists(account.id)}
                    >
                      {t('connections.loadPlaylistsButton')}
                    </Button>
                  </div>
                  {(remotePlaylistsByAccount[account.id] || []).length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">
                      {t('connections.noRemotePlaylists')}
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-96 overflow-y-auto">
                      {remotePlaylistsByAccount[account.id].map((remote) => (
                        <div
                          key={remote.id}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5"
                        >
                          <span className="truncate text-xs text-foreground" title={remote.title}>
                            {remote.title}{' '}
                            <span className="text-muted-foreground">({remote.itemCount})</span>
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                onClick={() => handleImport(account.id, remote.id)}
                                disabled={importingId === remote.id}
                              >
                                {importingId === remote.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('connections.importButton')}</TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  )
}
