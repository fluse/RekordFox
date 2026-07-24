import type { RemotePlaylistSummary } from '@main/youtubeSync'
import { REMOTE_PLAYLISTS_CACHE_PREFIX } from './constants'

// Lets the last-known list of a connected account's YouTube playlists show up instantly, before
// the fresh (and much slower) list comes back from the API and silently replaces it.
export function loadCachedRemotePlaylists(accountId: string): RemotePlaylistSummary[] {
  try {
    const raw = localStorage.getItem(`${REMOTE_PLAYLISTS_CACHE_PREFIX}${accountId}`)
    return raw ? (JSON.parse(raw) as RemotePlaylistSummary[]) : []
  } catch {
    return []
  }
}

export function cacheRemotePlaylists(accountId: string, playlists: RemotePlaylistSummary[]): void {
  localStorage.setItem(`${REMOTE_PLAYLISTS_CACHE_PREFIX}${accountId}`, JSON.stringify(playlists))
}
