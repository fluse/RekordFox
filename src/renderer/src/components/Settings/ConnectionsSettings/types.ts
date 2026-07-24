import type { AppSettings, Playlist, OAuthAccount } from '@main/db'

export type PublicOAuthAccount = Omit<OAuthAccount, 'accessTokenEnc' | 'refreshTokenEnc'>

// Which of the two OAuth-start buttons is currently mid-flight (null = idle).
export type ConnectAction = 'connect' | 'copy'

// Shared shape of the two connect entry points: both validate + persist credentials (via the
// passed-in save callback) before kicking off the OAuth round trip.
export type ConnectHandler = (
  clientId: string,
  clientSecret: string,
  saveCredentials: () => Promise<void>
) => Promise<void>

export interface ConnectionsSettingsProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>
  onPlaylistImported: (playlist: Playlist) => void
}
