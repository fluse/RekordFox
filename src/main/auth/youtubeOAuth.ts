import { randomBytes } from 'crypto'
import * as http from 'http'
import { shell, safeStorage, BrowserWindow } from 'electron'
import { google, youtube_v3 } from 'googleapis'
import {
  OAuthAccount,
  Playlist,
  getSettings,
  getOAuthAccounts,
  addOAuthAccount,
  updateOAuthAccountTokens,
  removeOAuthAccount,
  unlinkPlaylistsForAccount
} from '../db'
import { renderOAuthCallbackPage } from './oauthCallbackPage'

// Broadcasts to every open window directly via BrowserWindow, rather than importing the
// sendToRenderer helper from '../app/window' — that module also pulls in the app icon asset (a
// Vite-only `?asset` import), which the renderer's separate tsconfig can't resolve once anything
// under src/renderer transitively imports a type from this file (as RemotePlaylistSummary does).
function broadcastToAllWindows(channel: string, ...args: unknown[]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  }
}

// Electron doesn't automatically bring the app back to the foreground once the browser finishes
// the OAuth redirect — without this, the user has no obvious signal that the flow completed and
// has to remember to alt-tab back manually.
function focusMainWindow(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  }
}

// The userinfo scopes are non-sensitive and need no extra setup in the Google Cloud Console —
// they're what gives every connected account a real, distinguishing label (name/email) instead
// of falling back to a generic placeholder when the Google account has no YouTube channel.
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
]

const OAUTH_TIMEOUT_MS = 5 * 60 * 1000

function encryptSecret(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return 'enc:' + safeStorage.encryptString(value).toString('base64')
  }
  return 'plain:' + Buffer.from(value, 'utf-8').toString('base64')
}

function decryptSecret(stored: string): string {
  if (stored.startsWith('enc:')) {
    return safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64'))
  }
  if (stored.startsWith('plain:')) {
    return Buffer.from(stored.slice(6), 'base64').toString('utf-8')
  }
  return ''
}

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const settings = getSettings()
  if (!settings.youtubeClientId || !settings.youtubeClientSecret) {
    throw new Error('Missing YouTube OAuth Client ID/Secret. Configure them in Settings first.')
  }
  return { clientId: settings.youtubeClientId, clientSecret: settings.youtubeClientSecret }
}

// Runs the full "installed app" OAuth2 flow via a short-lived loopback HTTP server: builds the
// consent URL, opens the system browser for it (unless `openBrowser` is false — e.g. when the
// user chose "copy link" instead, to paste it into a specific browser/profile themselves), waits
// for Google's redirect carrying the auth code, exchanges it for tokens, and persists the
// encrypted account. Requires the user to have entered their own Google Cloud OAuth Client
// ID/Secret in Settings first (we don't ship credentials). The generated URL is always pushed to
// the renderer via 'youtube-oauth:auth-url' as soon as it's built, well before login completes,
// so a "copy link" action doesn't have to wait for the whole round trip.
export function startYoutubeOAuthFlow(openBrowser = true): Promise<OAuthAccount> {
  const { clientId, clientSecret } = getClientCredentials()

  return new Promise((resolve, reject) => {
    const server = http.createServer()

    const cleanup = (): void => {
      clearTimeout(timeoutHandle)
      server.close()
    }

    const timeoutHandle = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for YouTube sign-in.'))
    }, OAUTH_TIMEOUT_MS)

    server.on('request', (req, res) => {
      void (async (): Promise<void> => {
        const url = new URL(req.url || '', 'http://127.0.0.1')
        if (url.pathname !== '/oauth/callback') {
          res.writeHead(404).end()
          return
        }

        // The whole exchange runs BEFORE the HTTP response is written, so the page shown to the
        // user always reflects what actually happened — never claim success prematurely just
        // because Google redirected back with a code; the token exchange or account lookup can
        // still fail after that (wrong/missing scope, API not enabled, revoked client, etc.).
        try {
          const code = url.searchParams.get('code')
          const errorParam = url.searchParams.get('error')
          if (errorParam || !code) {
            throw new Error(errorParam || 'No authorization code received.')
          }

          const address = server.address()
          const port = typeof address === 'object' && address ? address.port : 0
          const redirectUri = `http://127.0.0.1:${port}/oauth/callback`
          const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

          const { tokens } = await oauth2Client.getToken(code)
          oauth2Client.setCredentials(tokens)

          // Prefer the Google account's own name/email as the label — it's always present,
          // unlike the YouTube channel title, which is only set if the account actually has a
          // (visible) channel. Without this, every account with no channel falls back to the
          // same generic placeholder, making them indistinguishable in the accounts list.
          const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
          let accountLabel: string | undefined
          try {
            const userinfoRes = await oauth2.userinfo.get()
            accountLabel = userinfoRes.data.name || userinfoRes.data.email || undefined
          } catch (err) {
            console.error('Failed to fetch Google userinfo for account label:', err)
          }

          if (!accountLabel) {
            const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
            const channelRes = await youtube.channels.list({ part: ['snippet'], mine: true })
            accountLabel = channelRes.data.items?.[0]?.snippet?.title || 'YouTube-Konto'
          }

          const account: OAuthAccount = {
            id: randomBytes(8).toString('hex'),
            provider: 'google',
            label: accountLabel,
            accessTokenEnc: encryptSecret(tokens.access_token || ''),
            refreshTokenEnc: encryptSecret(tokens.refresh_token || ''),
            expiresAt: tokens.expiry_date || 0,
            scope: tokens.scope || YOUTUBE_SCOPES.join(' ')
          }
          addOAuthAccount(account)

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(
            renderOAuthCallbackPage({ status: 'success', lang: getSettings().language || 'de' })
          )

          cleanup()
          focusMainWindow()
          resolve(account)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error('YouTube OAuth flow failed:', err)
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(
            renderOAuthCallbackPage({
              status: 'error',
              lang: getSettings().language || 'de',
              detail: message
            })
          )
          cleanup()
          focusMainWindow()
          reject(err instanceof Error ? err : new Error(message))
        }
      })()
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      const redirectUri = `http://127.0.0.1:${port}/oauth/callback`
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: YOUTUBE_SCOPES,
        prompt: 'consent'
      })
      broadcastToAllWindows('youtube-oauth:auth-url', authUrl)
      if (openBrowser) {
        shell.openExternal(authUrl)
      }
    })

    server.on('error', (err) => {
      cleanup()
      reject(err)
    })
  })
}

// Validates a Client ID/Secret pair without requiring the user to sign in. Google's OAuth token
// endpoint authenticates the client (client_id + client_secret) before it even looks at the grant,
// so exchanging a deliberately invalid authorization code still tells us what we need: an
// 'invalid_client' error means the credentials themselves are wrong, while any other error (e.g.
// 'invalid_grant' for the bogus code) means the client authenticated fine and only the throwaway
// code was rejected — i.e. the credentials are valid. Used by the Settings UI's "Test connection"
// button so the user gets feedback before starting the full browser-based sign-in.
export async function testYoutubeCredentials(
  clientId: string,
  clientSecret: string
): Promise<void> {
  if (!clientId.trim() || !clientSecret.trim()) {
    throw new Error('Please enter both Client ID and Client Secret.')
  }
  const oauth2Client = new google.auth.OAuth2(
    clientId.trim(),
    clientSecret.trim(),
    'http://127.0.0.1/oauth/callback'
  )
  try {
    await oauth2Client.getToken('rekordfox-connection-test-invalid-code')
  } catch (err) {
    const data = (err as { response?: { data?: { error?: string; error_description?: string } } })
      ?.response?.data
    if (data?.error === 'invalid_client') {
      throw new Error(data.error_description || 'Client ID or Client Secret is incorrect.')
    }
  }
}

// One live OAuth2Client per account, reused across all API calls for that account. A single client
// means a single 'tokens' listener and a single in-flight refresh, so concurrent calls (e.g. the
// reconcile fan-out) can't each mint their own client and race to persist different rotated
// tokens — the last writer no longer clobbers a fresher refresh_token.
const clientCache = new Map<string, InstanceType<typeof google.auth.OAuth2>>()

// Drops an account's cached client — call on disconnect, or after credentials change, so a stale
// client (revoked tokens / wrong secret) is never reused.
export function invalidateYoutubeClient(accountId: string): void {
  clientCache.delete(accountId)
}

// True for the OAuth errors that mean the account's authorization is gone and re-consent is
// required — either a revoked/expired refresh token, or a token minted under an older, narrower
// scope list (e.g. before YOUTUBE_SCOPES gained a scope) that Google now rejects as insufficient.
// Both are fixed the same way: re-running the OAuth consent flow for the account. Distinct from a
// transient/quota/network error.
export function isAuthError(err: unknown): boolean {
  const anyErr = err as { response?: { data?: { error?: string } }; message?: string } | undefined
  const code = anyErr?.response?.data?.error || ''
  const msg = anyErr?.message || ''
  return /invalid_grant|invalid_token|unauthorized|401|insufficient.*scope/i.test(`${code} ${msg}`)
}

// True when the error is a YouTube Data API quota / rate-limit rejection, so callers can back off
// and preserve pending state instead of surfacing it as a hard failure.
export function isQuotaError(err: unknown): boolean {
  const anyErr = err as
    | { response?: { data?: { error?: { errors?: { reason?: string }[] } }; status?: number } }
    | undefined
  const reasons = anyErr?.response?.data?.error?.errors || []
  const status = anyErr?.response?.status
  return (
    status === 429 || reasons.some((e) => /quota|rateLimit|userRateLimit/i.test(e.reason || ''))
  )
}

// Rehydrates an authorized googleapis YouTube client for a stored account, refreshing the access
// token via the OAuth2Client's built-in refresh logic if needed and persisting any rotated tokens.
export function getYoutubeClientForAccount(accountId: string): youtube_v3.Youtube {
  const account = getOAuthAccounts().find((a) => a.id === accountId)
  if (!account) {
    throw new Error('YouTube account not found. Please reconnect it in Settings.')
  }
  const { clientId, clientSecret } = getClientCredentials()

  let oauth2Client = clientCache.get(accountId)
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({
      access_token: decryptSecret(account.accessTokenEnc),
      refresh_token: decryptSecret(account.refreshTokenEnc),
      expiry_date: account.expiresAt
    })
    oauth2Client.on('tokens', (tokens) => {
      const current = getOAuthAccounts().find((a) => a.id === accountId)
      if (!current) return
      updateOAuthAccountTokens(accountId, {
        accessTokenEnc: encryptSecret(tokens.access_token || decryptSecret(current.accessTokenEnc)),
        refreshTokenEnc: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : undefined,
        expiresAt: tokens.expiry_date || current.expiresAt
      })
    })
    clientCache.set(accountId, oauth2Client)
  }

  return google.youtube({ version: 'v3', auth: oauth2Client })
}

// Disconnects an account: best-effort token revocation, then removes it. Any playlists that were
// linked to it are demoted to plain 'local' playlists (kept, but write-back disabled) and returned
// so the caller can push the change to the renderer — without this they'd keep 'youtube-oauth' + a
// dead oauthAccountId and every "sync to YouTube" would fail with "account not found".
export async function disconnectYoutubeAccount(accountId: string): Promise<Playlist[]> {
  const account = getOAuthAccounts().find((a) => a.id === accountId)
  if (account) {
    try {
      const { clientId, clientSecret } = getClientCredentials()
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
      oauth2Client.setCredentials({ refresh_token: decryptSecret(account.refreshTokenEnc) })
      await oauth2Client.revokeCredentials()
    } catch (err) {
      console.error(`Failed to revoke YouTube credentials for account ${accountId}:`, err)
    }
  }
  invalidateYoutubeClient(accountId)
  const unlinked = unlinkPlaylistsForAccount(accountId)
  removeOAuthAccount(accountId)
  if (unlinked.length > 0) {
    broadcastToAllWindows('youtube-oauth:playlists-unlinked', unlinked)
  }
  return unlinked
}
