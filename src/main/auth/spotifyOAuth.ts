import { randomBytes } from 'crypto'
import * as http from 'http'
import { shell } from 'electron'
import {
  OAuthAccount,
  getSettings,
  getOAuthAccounts,
  addOAuthAccount,
  updateOAuthAccountTokens,
  removeOAuthAccount
} from '../db'
import { renderOAuthCallbackPage } from './oauthCallbackPage'
import { OAUTH_TIMEOUT_MS, broadcastToAllWindows, focusMainWindow } from './oauthShared'
import { encryptSecret, decryptSecret } from './secretCrypto'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'

// Only one Spotify account is ever meaningful here — unlike YouTube, a Spotify playlist is never
// "owned" by the connected account (it's just a public URL the user pasted), so there's nothing to
// link per-playlist. A fixed id means reconnecting simply replaces the single stored account
// (addOAuthAccount upserts by id) instead of accumulating duplicates.
const SPOTIFY_ACCOUNT_ID = 'spotify'

// Unlike Google's "Desktop app" OAuth client type (any loopback port auto-allowed, which is why
// youtubeOAuth.ts can bind to a random OS-assigned port), Spotify requires the redirect URI to
// match a value pre-registered in the app's dashboard exactly, port included — so this must be a
// fixed port, not `server.listen(0, ...)`. Matches the redirect URI the Settings setup guide tells
// users to register.
const SPOTIFY_REDIRECT_PORT = 8888
const SPOTIFY_REDIRECT_URI = `http://127.0.0.1:${SPOTIFY_REDIRECT_PORT}/callback`

// A user-authenticated token requested with no scope at all still comes back empty-handed for
// `GET /playlists/{id}`'s `tracks` field (confirmed empirically: 200 OK, but the field is missing
// even when explicitly requested via `fields=`) — Spotify's playlist-read lockdown for
// non-extended-quota apps apparently applies regardless of whether the playlist is public or
// whose it is. These two scopes are the ones Spotify documents for playlist reads.
const SPOTIFY_SCOPES = ['playlist-read-private', 'playlist-read-collaborative']

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const settings = getSettings()
  if (!settings.spotifyClientId || !settings.spotifyClientSecret) {
    throw new Error('Missing Spotify Client ID/Secret. Configure them in Settings first.')
  }
  return { clientId: settings.spotifyClientId, clientSecret: settings.spotifyClientSecret }
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

export function hasSpotifyAccount(): boolean {
  return getOAuthAccounts().some((a) => a.provider === 'spotify')
}

export function getSpotifyAccount(): OAuthAccount | undefined {
  return getOAuthAccounts().find((a) => a.provider === 'spotify')
}

interface SpotifyTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
  error?: string
  error_description?: string
}

// Runs the Authorization Code flow via a short-lived loopback HTTP server on the fixed
// SPOTIFY_REDIRECT_PORT: builds the consent URL, opens the system browser for it (unless
// `openBrowser` is false — the user chose "copy link" instead), waits for Spotify's redirect
// carrying the auth code, exchanges it for tokens, and persists the encrypted account. Requires
// the user to have entered their own Spotify Client ID/Secret in Settings first, and to have
// registered SPOTIFY_REDIRECT_URI in their Spotify app and added their own account under the
// app's "User Management" (Development Mode only allows explicitly-listed accounts to sign in).
export function startSpotifyOAuthFlow(openBrowser = true): Promise<OAuthAccount> {
  const { clientId, clientSecret } = getClientCredentials()
  const state = randomBytes(16).toString('hex')

  return new Promise((resolve, reject) => {
    const server = http.createServer()

    const cleanup = (): void => {
      clearTimeout(timeoutHandle)
      server.close()
    }

    const timeoutHandle = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for Spotify sign-in.'))
    }, OAUTH_TIMEOUT_MS)

    server.on('request', (req, res) => {
      void (async (): Promise<void> => {
        const url = new URL(req.url || '', 'http://127.0.0.1')
        if (url.pathname !== '/callback') {
          res.writeHead(404).end()
          return
        }

        // The whole exchange runs BEFORE the HTTP response is written, so the page shown to the
        // user always reflects what actually happened — never claim success prematurely just
        // because Spotify redirected back with a code.
        try {
          const code = url.searchParams.get('code')
          const returnedState = url.searchParams.get('state')
          const errorParam = url.searchParams.get('error')
          if (errorParam || !code) {
            throw new Error(errorParam || 'No authorization code received.')
          }
          if (returnedState !== state) {
            throw new Error('State mismatch — please try connecting again.')
          }

          const tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
            method: 'POST',
            headers: {
              Authorization: basicAuthHeader(clientId, clientSecret),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: SPOTIFY_REDIRECT_URI
            }).toString()
          })
          const tokenData = (await tokenRes.json()) as SpotifyTokenResponse
          if (!tokenRes.ok || !tokenData.access_token) {
            throw new Error(
              tokenData.error_description || tokenData.error || 'Spotify sign-in failed.'
            )
          }

          // display_name is a nice-to-have for the account label — fall back gracefully rather
          // than failing the whole connect if it's unavailable for any reason.
          let accountLabel = 'Spotify-Konto'
          try {
            const meRes = await fetch('https://api.spotify.com/v1/me', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` }
            })
            if (meRes.ok) {
              const me = (await meRes.json()) as { display_name?: string; id?: string }
              accountLabel = me.display_name || me.id || accountLabel
            }
          } catch (err) {
            console.error('Failed to fetch Spotify profile for account label:', err)
          }

          const account: OAuthAccount = {
            id: SPOTIFY_ACCOUNT_ID,
            provider: 'spotify',
            label: accountLabel,
            accessTokenEnc: encryptSecret(tokenData.access_token),
            refreshTokenEnc: encryptSecret(tokenData.refresh_token || ''),
            expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000,
            scope: tokenData.scope || ''
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
          console.error('Spotify OAuth flow failed:', err)
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

    server.listen(SPOTIFY_REDIRECT_PORT, '127.0.0.1', () => {
      const authUrl = new URL(SPOTIFY_AUTHORIZE_URL)
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('redirect_uri', SPOTIFY_REDIRECT_URI)
      authUrl.searchParams.set('scope', SPOTIFY_SCOPES.join(' '))
      authUrl.searchParams.set('state', state)
      broadcastToAllWindows('spotify-oauth:auth-url', authUrl.toString())
      if (openBrowser) {
        shell.openExternal(authUrl.toString())
      }
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      cleanup()
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${SPOTIFY_REDIRECT_PORT} is already in use — close whatever is using it and try ` +
              'again. RekordFox needs this exact port because it must match the redirect URI ' +
              'registered in your Spotify app.'
          )
        )
      } else {
        reject(err)
      }
    })
  })
}

// Returns a valid access token for the connected Spotify account, refreshing it first if expired.
// Throws an actionable error if no account is connected, or if the refresh token itself has been
// revoked (the account is then dropped so the UI reflects that a fresh connect is needed).
export async function getValidSpotifyAccessToken(): Promise<string> {
  const account = getSpotifyAccount()
  if (!account) {
    throw new Error('Connect your Spotify account in Settings first, then try again.')
  }

  if (account.expiresAt > Date.now() + 60_000) {
    return decryptSecret(account.accessTokenEnc)
  }

  const { clientId, clientSecret } = getClientCredentials()
  const refreshToken = decryptSecret(account.refreshTokenEnc)

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(clientId, clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString()
  })
  const data = (await res.json()) as SpotifyTokenResponse

  if (!res.ok || !data.access_token) {
    removeOAuthAccount(SPOTIFY_ACCOUNT_ID)
    throw new Error('Your Spotify session expired. Reconnect your account in Settings.')
  }

  // Spotify doesn't always rotate the refresh token — keep the existing one when a new one isn't
  // returned (updateOAuthAccountTokens already treats refreshTokenEnc as optional for this reason).
  updateOAuthAccountTokens(SPOTIFY_ACCOUNT_ID, {
    accessTokenEnc: encryptSecret(data.access_token),
    refreshTokenEnc: data.refresh_token ? encryptSecret(data.refresh_token) : undefined,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000
  })

  return data.access_token
}

// Spotify has no token-revocation endpoint (unlike Google) — disconnecting is just forgetting the
// account locally.
export async function disconnectSpotifyAccount(): Promise<void> {
  removeOAuthAccount(SPOTIFY_ACCOUNT_ID)
}
