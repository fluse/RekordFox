import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Playlist } from '@main/db'
import type { RemotePlaylistSummary } from '@main/youtubeSync'
import { useLanguage } from '@renderer/i18n'
import { cacheRemotePlaylists, loadCachedRemotePlaylists } from './cache'
import type { ConnectAction, ConnectHandler, PublicOAuthAccount } from './types'

export interface UseYoutubeAccountsResult {
  accounts: PublicOAuthAccount[]
  remotePlaylistsByAccount: Record<string, RemotePlaylistSummary[]>
  activeAction: ConnectAction | null
  importingId: string | null
  reconcilingId: string | null
  loadRemotePlaylists: (accountId: string) => Promise<void>
  handleReconcile: (accountId: string) => Promise<void>
  handleConnect: ConnectHandler
  handleCopyLink: ConnectHandler
  handleDisconnect: (accountId: string) => Promise<void>
  handleImport: (accountId: string, remotePlaylistId: string) => Promise<void>
}

// Owns everything about the connected YouTube accounts: loading them on mount, keeping their
// remote-playlist lists fresh (with an instant cached preview), and the connect / copy-link /
// reconcile / disconnect / import handlers the view wires up to buttons.
export function useYoutubeAccounts(
  onPlaylistImported: (playlist: Playlist) => void
): UseYoutubeAccountsResult {
  const { t } = useLanguage()
  const [accounts, setAccounts] = useState<PublicOAuthAccount[]>([])
  const [activeAction, setActiveAction] = useState<ConnectAction | null>(null)
  const [remotePlaylistsByAccount, setRemotePlaylistsByAccount] = useState<
    Record<string, RemotePlaylistSummary[]>
  >({})
  const [importingId, setImportingId] = useState<string | null>(null)
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

  const handleConnect: ConnectHandler = async (clientId, clientSecret, saveCredentials) => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error(t('connections.missingCredentials'))
      return
    }
    await saveCredentials()
    setActiveAction('connect')
    await finishConnect(window.api.connectYoutubeAccount())
  }

  // Starts the same OAuth flow but without auto-opening a browser: copies the consent URL to the
  // clipboard instead, so the user can paste it into whichever browser/profile they want, then
  // keeps waiting in the background for that login to complete.
  const handleCopyLink: ConnectHandler = async (clientId, clientSecret, saveCredentials) => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error(t('connections.missingCredentials'))
      return
    }
    await saveCredentials()
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

  return {
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
  }
}
