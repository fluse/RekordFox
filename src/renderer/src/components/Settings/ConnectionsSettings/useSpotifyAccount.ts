import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@renderer/i18n'
import type {
  ConnectAction,
  ConnectHandler,
  PublicOAuthAccount,
  TestConnectionResult
} from './types'

export interface UseSpotifyAccountResult {
  account: PublicOAuthAccount | null
  activeAction: ConnectAction | null
  testResult: TestConnectionResult | null
  handleConnect: ConnectHandler
  handleCopyLink: ConnectHandler
  handleTestConnection: ConnectHandler
  handleDisconnect: () => Promise<void>
}

// Spotify only ever has one connected account (it's just used to read public playlist data, not
// linked to specific playlists the way YouTube's accounts are), so this is a much smaller version
// of useYoutubeAccounts.ts — no remote-playlist list, no reconcile/import.
export function useSpotifyAccount(): UseSpotifyAccountResult {
  const { t } = useLanguage()
  const [account, setAccount] = useState<PublicOAuthAccount | null>(null)
  const [activeAction, setActiveAction] = useState<ConnectAction | null>(null)
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null)

  useEffect(() => {
    window.api.getSpotifyAccount().then(setAccount).catch(console.error)
  }, [])

  const finishConnect = async (
    connectPromise: ReturnType<typeof window.api.connectSpotifyAccount>
  ): Promise<void> => {
    try {
      const res = await connectPromise
      if (res.success && res.account) {
        setAccount(res.account)
      } else if (!res.success) {
        toast.error(t('connections.errorConnectSpotify', { error: res.error || '' }))
      }
    } catch (err) {
      toast.error(t('connections.errorConnectSpotify', { error: String(err) }))
    } finally {
      setActiveAction(null)
    }
  }

  const handleConnect: ConnectHandler = async (clientId, clientSecret, saveCredentials) => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error(t('connections.missingCredentials'))
      return
    }
    await saveCredentials()
    setActiveAction('connect')
    await finishConnect(window.api.connectSpotifyAccount())
  }

  // Starts the same OAuth flow but without auto-opening a browser: copies the consent URL to the
  // clipboard instead, so the user can paste it into whichever browser/profile they want.
  const handleCopyLink: ConnectHandler = async (clientId, clientSecret, saveCredentials) => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error(t('connections.missingCredentials'))
      return
    }
    await saveCredentials()
    setActiveAction('copy')

    const urlPromise = new Promise<string>((resolve) => {
      const unsubscribe = window.api.onSpotifyAuthUrlReady((url) => {
        unsubscribe()
        resolve(url)
      })
    })
    const connectPromise = window.api.connectSpotifyAccount(false)

    try {
      const url = await urlPromise
      window.api.copyToClipboard(url)
      toast.success(t('connections.linkCopied'))
    } catch (err) {
      toast.error(t('connections.errorConnectSpotify', { error: String(err) }))
    }

    await finishConnect(connectPromise)
  }

  const handleTestConnection: ConnectHandler = async (clientId, clientSecret, saveCredentials) => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error(t('connections.missingCredentials'))
      return
    }
    await saveCredentials()
    setActiveAction('test')
    setTestResult(null)
    try {
      const res = await window.api.testSpotifyConnection(clientId, clientSecret)
      setTestResult(res.success ? { status: 'success' } : { status: 'error', message: res.error })
    } catch (err) {
      setTestResult({ status: 'error', message: String(err) })
    } finally {
      setActiveAction(null)
    }
  }

  const handleDisconnect = async (): Promise<void> => {
    try {
      const res = await window.api.disconnectSpotifyAccount()
      if (res.success) {
        setAccount(null)
      } else {
        toast.error(t('connections.errorDisconnectSpotify', { error: res.error || '' }))
      }
    } catch (err) {
      toast.error(t('connections.errorDisconnectSpotify', { error: String(err) }))
    }
  }

  return {
    account,
    activeAction,
    testResult,
    handleConnect,
    handleCopyLink,
    handleTestConnection,
    handleDisconnect
  }
}
