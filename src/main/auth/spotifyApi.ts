import { getValidSpotifyAccessToken } from './spotifyOAuth'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

async function requestSpotifyToken(
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!res.ok) {
    throw new Error(
      `Spotify authentication failed (${res.status}). Check your Client ID/Secret in Settings.`
    )
  }

  return (await res.json()) as { access_token: string; expires_in: number }
}

// Validates a Client ID/Secret pair on its own, independent of whatever is currently saved in
// Settings — used by the Settings UI's "Test connection" button so the user gets feedback before
// (or instead of) actually saving. Simply performs the real Client-Credentials token request:
// unlike YouTube's three-legged OAuth, Spotify's flow needs no user interaction to verify.
export async function testSpotifyCredentials(
  clientId: string,
  clientSecret: string
): Promise<void> {
  if (!clientId.trim() || !clientSecret.trim()) {
    throw new Error('Please enter both Client ID and Client Secret.')
  }
  await requestSpotifyToken(clientId.trim(), clientSecret.trim())
}

// Accepts both https://open.spotify.com/playlist/<id>[?...] and spotify:playlist:<id> forms.
export function parseSpotifyPlaylistId(url: string): string {
  const httpMatch = url.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/)
  if (httpMatch) return httpMatch[1]

  const uriMatch = url.match(/spotify:playlist:([a-zA-Z0-9]+)/)
  if (uriMatch) return uriMatch[1]

  throw new Error('Not a valid Spotify playlist URL.')
}

export interface SpotifyTrackInfo {
  id: string
  title: string
  artist: string
  album: string
  duration: number // in seconds
  coverUrl: string
}

export interface SpotifyPlaylistInfo {
  id: string
  title: string
  tracks: SpotifyTrackInfo[]
}

interface SpotifyImage {
  url: string
}

interface SpotifyArtist {
  name: string
}

// Spotify's playlist-items schema unifies tracks, episodes and local files under a single `item`
// per entry (with `type`/`track`/`episode` fields distinguishing which) rather than the older,
// still-documented `{ track: {...} }` shape — confirmed empirically against a real user-token
// response on 2026-09-04, where the playlist object's container is `items` (not `tracks`) and each
// entry is `{ item: {...} }` (not `{ track: {...} }`), with the track's own fields (id, name,
// duration_ms, artists, album) flattened directly onto `item`.
interface SpotifyApiItem {
  id: string | null
  name: string
  type: string // 'track' | 'episode' | ...
  duration_ms: number
  artists: SpotifyArtist[]
  album: { name: string; images: SpotifyImage[] }
}

interface SpotifyPlaylistItemsPage {
  items: { item: SpotifyApiItem | null }[]
  next: string | null
}

interface SpotifyApiPlaylist {
  id: string
  name: string
  items: SpotifyPlaylistItemsPage
}

async function spotifyFetch(url: string, token: string): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    throw new Error(`Spotify API request failed (${res.status}): ${url}`)
  }
  return res
}

function toTrackInfo(item: SpotifyApiItem): SpotifyTrackInfo | null {
  // Local files, removed/unavailable tracks, and episodes show up as a null `item`, a null `id`,
  // or a non-'track' `type` — skip them.
  if (!item || !item.id || item.type !== 'track') return null
  return {
    id: item.id,
    title: item.name,
    artist: (item.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist',
    album: item.album?.name || '',
    duration: Math.round((item.duration_ms || 0) / 1000),
    coverUrl: item.album?.images?.[0]?.url || ''
  }
}

// Fetches a public Spotify playlist's title and full track list, following pagination (Spotify
// returns items in pages of up to 100).
export async function getSpotifyPlaylistInfo(url: string): Promise<SpotifyPlaylistInfo> {
  const playlistId = parseSpotifyPlaylistId(url)
  const token = await getValidSpotifyAccessToken()

  const res = await spotifyFetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}`, token)
  const data = (await res.json()) as SpotifyApiPlaylist

  if (!data.items) {
    throw new Error(
      'Spotify did not return any track data for this playlist. Reconnect your Spotify account in Settings and try again.'
    )
  }

  const tracks: SpotifyTrackInfo[] = []
  for (const entry of data.items.items) {
    const info = entry.item ? toTrackInfo(entry.item) : null
    if (info) tracks.push(info)
  }

  let nextUrl = data.items.next
  while (nextUrl) {
    const pageRes = await spotifyFetch(nextUrl, token)
    const page = (await pageRes.json()) as SpotifyPlaylistItemsPage
    for (const entry of page.items) {
      const info = entry.item ? toTrackInfo(entry.item) : null
      if (info) tracks.push(info)
    }
    nextUrl = page.next
  }

  return { id: data.id, title: data.name || 'Spotify Playlist', tracks }
}
