import { BrowserWindow } from 'electron'
import { Playlist, getPlaylists } from '../db'
import { syncLocalPlaylist } from './sync'
import { pullYoutubeOAuthPlaylist } from './youtubeSync'
import { syncSpotifyPlaylist } from './spotifySync'

// Source-aware sync entry point. Routes each playlist to the path that matches its source so the
// destructive yt-dlp diff (syncLocalPlaylist, which can't see private/unlisted items) never runs
// against an OAuth-backed playlist, and the Data API pull never runs against a plain public one.
// Every caller that syncs an *existing* playlist — the manual sync button, the background
// scheduler, add-by-URL — must go through here rather than calling a specific path directly.
export async function syncPlaylist(playlist: Playlist, win: BrowserWindow): Promise<void> {
  if (playlist.source === 'youtube-oauth') {
    return pullYoutubeOAuthPlaylist(playlist, win)
  }
  if (playlist.source === 'spotify') {
    return syncSpotifyPlaylist(playlist, win)
  }
  return syncLocalPlaylist(playlist, win)
}

export async function syncPlaylistById(id: string, win: BrowserWindow): Promise<void> {
  const playlist = getPlaylists().find((p) => p.id === id)
  if (!playlist) return
  return syncPlaylist(playlist, win)
}

// Background cron sync across all playlists. Safe for every source now that it dispatches: a
// needs-reauth OAuth playlist falls back to a plain scrape inside pullYoutubeOAuthPlaylist (an
// account-removed one isn't 'youtube-oauth' any more, so it goes straight through syncLocalPlaylist
// like any other playlist), and the shared active-sync guard keeps a scheduled run from colliding
// with a manual one on the same playlist.
let syncInterval: NodeJS.Timeout | null = null

export function startBackgroundSync(win: BrowserWindow, intervalMs = 30 * 60 * 1000): void {
  if (syncInterval) clearInterval(syncInterval)

  syncInterval = setInterval(() => {
    for (const playlist of getPlaylists()) {
      syncPlaylist(playlist, win).catch((err) => console.error(err))
    }
  }, intervalMs)
}

export function stopBackgroundSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}
