import type { AppSettings, Playlist, OAuthAccount } from '@main/db'

export type PublicOAuthAccount = Omit<OAuthAccount, 'accessTokenEnc' | 'refreshTokenEnc'>

// Which of the credentials-form actions is currently mid-flight (null = idle).
export type ConnectAction = 'connect' | 'copy' | 'test'

// Shared shape of the two connect entry points: both validate + persist credentials (via the
// passed-in save callback) before kicking off the OAuth round trip.
export type ConnectHandler = (
  clientId: string,
  clientSecret: string,
  saveCredentials: () => Promise<void>
) => Promise<void>

// Result of the last "Test connection" run — cleared as soon as a new one starts.
export interface TestConnectionResult {
  status: 'success' | 'error'
  message?: string
}

export interface ConnectionsSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onPlaylistImported: (playlist: Playlist) => void
}
