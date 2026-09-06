export type PlaylistSource = 'local' | 'youtube-oauth' | 'soundcloud' | 'spotify'

export interface Playlist {
  id: string // YouTube or Spotify playlist ID, depending on `source`
  title: string
  url: string
  syncStatus: 'idle' | 'syncing' | 'error'
  lastSync: string
  // 'local': today's behavior — added via public URL, scraped with yt-dlp, download-only, no
  // write-back. 'youtube-oauth': imported from the user's own YouTube account via OAuth2;
  // supports pushing the local track order back to YouTube. 'soundcloud' reserved for future use.
  // 'spotify': added via a public Spotify playlist URL — metadata comes from the Spotify Web API,
  // audio is matched and downloaded from YouTube (download-only, no write-back, like 'local').
  source: PlaylistSource
  oauthAccountId?: string // links a 'youtube-oauth' playlist to the OAuthAccount used to import it
  // Health of the OAuth link, authoritative for whether write-back is possible. Only meaningful
  // for source === 'youtube-oauth'; undefined is treated as 'linked' for backward compatibility.
  // A playlist whose account is gone for good isn't represented here at all — it's demoted to a
  // plain 'local' playlist instead (see unlinkPlaylistsForAccount), so there's nothing left to
  // track: 'needs-reauth' is the only unhealthy state a 'youtube-oauth' playlist can be in.
  //  - 'linked':       oauthAccountId points at a connected account that owns this playlist.
  //  - 'needs-reauth': the account still exists but its token is invalid (revoked/expired refresh).
  linkState?: PlaylistLinkState
  pendingRemoteChanges?: boolean // true once the local order diverges from the last YouTube push
  lastPushToYoutube?: string
}

export type PlaylistLinkState = 'linked' | 'needs-reauth'

export interface OAuthAccount {
  id: string
  provider: 'google' | 'spotify'
  label: string // display name shown in the UI — the account's YouTube channel title, or the Spotify display name
  accessTokenEnc: string // encrypted with Electron safeStorage, base64-encoded
  refreshTokenEnc: string
  expiresAt: number
  scope: string
}

export interface Track {
  id: string // YouTube video ID
  playlistId: string
  title: string
  artist: string
  bpm: number
  key: string // Camelot notation, e.g. "8A", "10B" – empty string if not yet analyzed
  duration: number // in seconds
  filepath: string // absolute local path to MP3
  coverPath: string // absolute local path to Cover image
  filesize: number // size in bytes
  format: string // e.g. "MP3"
  rating: number // 0 to 5 stars
  bitrate?: number // bitrate in kbps
  position?: number
  dateAdded?: string
  played?: boolean
  downloadFailed?: boolean // true if the last download attempt failed; excluded from queue/shuffle relevance
  // Consecutive failed download attempts; reset to 0 on a successful download. Once it reaches
  // MAX_DOWNLOAD_ATTEMPTS the track is "abandoned" (see isDownloadAbandoned): sync stops retrying
  // it and it's hidden from track lists/counts, though it stays in the db so a fresh placeholder
  // isn't recreated for it on the next sync.
  downloadAttempts?: number
  // Present (and always 'discover') for tracks added via the Discover feature rather than
  // found in the actual remote YouTube playlist. Sync must never delete these based on the
  // playlist diff, since they will never appear in the remote playlist's entries.
  source?: 'discover' | 'youtube-oauth'
  // The YouTube playlistItem ID (distinct from the video ID) — required to push reordering
  // back via playlistItems.update. Only present for tracks in a 'youtube-oauth' playlist.
  youtubePlaylistItemId?: string
  // The Spotify track ID this track was matched from. Only present for tracks in a 'spotify'
  // playlist — `id` itself is always the matched YouTube video ID (that's where the audio comes
  // from), so this is the stable key used to diff "already synced" Spotify tracks, since the
  // YouTube ID is only known after the search match.
  spotifyTrackId?: string
}

export type ColorScheme =
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'rose'
  | 'teal'
  | 'forest'
  | 'amber'
  | 'cyan'
  | 'fuchsia'
  | 'custom'

export interface AppSettings {
  theme: 'dark' | 'light'
  colorScheme?: ColorScheme
  customAccentColor?: string // hex color, used when colorScheme === 'custom'
  downloadPath: string
  sidebarWidth: number
  maxWorkers: number
  language?: 'de' | 'en' | 'fr' | 'es'
  filenameTemplate?: 'default' | 'custom'
  rekordboxXmlPath?: string
  historyLimit?: number
  appShortcuts?: Record<string, string>
  youtubeClientId?: string
  youtubeClientSecret?: string
  spotifyClientId?: string
  spotifyClientSecret?: string
  tooltipsEnabled?: boolean
  tooltipDelay?: number
}

export interface DatabaseSchema {
  playlists: Playlist[]
  tracks: Track[]
  settings?: AppSettings
  // Video IDs the user marked as "not interested" from the Discover feature — excluded from
  // all future recommendations.
  discoverBlacklist?: string[]
  oauthAccounts?: OAuthAccount[]
}

export interface StorageStats {
  downloadsSize: number
  downloadsCount: number
  cacheSize: number
  cacheCount: number
}

export interface PlaylistStats {
  total: number
  downloaded: number
}

export interface FilepathChange {
  id: string
  filepath: string
}
