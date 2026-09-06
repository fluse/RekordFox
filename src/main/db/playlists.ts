import { existsSync, unlinkSync } from 'fs'
import { dbData, saveDb } from './store'
import { isDownloadAbandoned } from './trackStatus'
import type { Playlist, PlaylistLinkState, PlaylistStats } from './types'

export function getPlaylists(): Playlist[] {
  return dbData.playlists
}

// Per-playlist track counts for the sidebar: how many tracks the playlist has and how many are
// actually downloaded (a track counts as downloaded once it has a local filepath, matching the
// tracklist's own "placeholder = no filepath" rule).
export function getPlaylistStats(): Record<string, PlaylistStats> {
  const stats: Record<string, PlaylistStats> = {}
  for (const track of dbData.tracks) {
    if (isDownloadAbandoned(track)) continue
    const entry = stats[track.playlistId] || (stats[track.playlistId] = { total: 0, downloaded: 0 })
    entry.total++
    if (track.filepath) entry.downloaded++
  }
  return stats
}

export function addPlaylist(playlist: Playlist): void {
  if (!dbData.playlists.some((p) => p.id === playlist.id)) {
    dbData.playlists.push(playlist)
    saveDb()
  }
}

export function renamePlaylist(playlistId: string, newTitle: string): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  if (playlist) {
    playlist.title = newTitle
    saveDb()
  }
}

export function updatePlaylistStatus(
  playlistId: string,
  status: Playlist['syncStatus'],
  lastSync?: string
): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  if (playlist) {
    playlist.syncStatus = status
    if (lastSync) {
      playlist.lastSync = lastSync
    }
    saveDb()
  }
}

export function markPlaylistDirty(playlistId: string): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  // Only OAuth-backed playlists with a healthy link can push back, so only they track pending
  // changes — flagging a needs-reauth one would light up a "sync to YouTube" prompt that can't
  // succeed until the account is reconnected (an unlinked-account playlist isn't 'youtube-oauth'
  // at all any more, see unlinkPlaylistsForAccount, so it's excluded by the source check alone).
  if (
    playlist &&
    playlist.source === 'youtube-oauth' &&
    (playlist.linkState === undefined || playlist.linkState === 'linked') &&
    !playlist.pendingRemoteChanges
  ) {
    playlist.pendingRemoteChanges = true
    saveDb()
  }
}

export function clearPlaylistDirty(playlistId: string, timestamp: string): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  if (playlist) {
    playlist.pendingRemoteChanges = false
    playlist.lastPushToYoutube = timestamp
    saveDb()
  }
}

// Upgrades a 'local' (public-URL, download-only) playlist to 'youtube-oauth' — or re-links a
// 'needs-reauth' one to a (re)connected account — once it's been confirmed to actually belong to
// that account, restoring write-back support and clearing any stale link problem. A playlist
// whose account was fully removed goes through this same 'local' path, since that's what it was
// demoted to (see unlinkPlaylistsForAccount).
export function linkPlaylistToOauthAccount(playlistId: string, accountId: string): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  if (playlist) {
    playlist.source = 'youtube-oauth'
    playlist.oauthAccountId = accountId
    playlist.linkState = 'linked'
    saveDb()
  }
}

// Sets the link health of a single 'youtube-oauth' playlist (see PlaylistLinkState). No-op for
// playlists that aren't OAuth-backed.
export function setPlaylistLinkState(playlistId: string, state: PlaylistLinkState): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  if (playlist && playlist.source === 'youtube-oauth' && playlist.linkState !== state) {
    playlist.linkState = state
    saveDb()
  }
}

// A removed OAuth account is never coming back under the same ID, so there is nothing left to
// "re-link" to — rather than parking its playlists in a permanently-broken 'orphaned' state,
// demote them straight to a plain 'local' one, dropping out of OAuth entirely. They keep their
// source/tracks/downloads and behave exactly like a playlist added by URL from here on (synced by
// scraping, not the Data API), including staying eligible for automatic (re-)adoption later if the
// same channel is ever connected under a new account (see reconcileLocalPlaylistsWithAccount).
function demoteToLocalPlaylist(playlist: Playlist): void {
  playlist.source = 'local'
  delete playlist.oauthAccountId
  delete playlist.linkState
  playlist.pendingRemoteChanges = false
}

// Demotes every 'youtube-oauth' playlist tied to the given account when it's disconnected. Returns
// the affected playlists so the caller can tell the renderer to update.
export function unlinkPlaylistsForAccount(accountId: string): Playlist[] {
  const affected = dbData.playlists.filter(
    (p) => p.source === 'youtube-oauth' && p.oauthAccountId === accountId
  )
  if (affected.length === 0) return []
  affected.forEach(demoteToLocalPlaylist)
  saveDb()
  return affected
}

// Single-playlist counterpart to unlinkPlaylistsForAccount, used by the startup self-heal (see
// reconcilePlaylistLinkStates) which discovers stale links one playlist at a time rather than by
// account. No-op for playlists that aren't OAuth-backed.
export function unlinkPlaylistFromOauth(playlistId: string): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  if (playlist && playlist.source === 'youtube-oauth') {
    demoteToLocalPlaylist(playlist)
    saveDb()
  }
}

export function deletePlaylist(playlistId: string): void {
  const tracksToDelete = dbData.tracks.filter((t) => t.playlistId === playlistId)
  dbData.playlists = dbData.playlists.filter((p) => p.id !== playlistId)
  dbData.tracks = dbData.tracks.filter((t) => t.playlistId !== playlistId)
  saveDb()

  // Physically delete track MP3 and Cover files
  for (const track of tracksToDelete) {
    try {
      if (existsSync(track.filepath)) unlinkSync(track.filepath)
      if (existsSync(track.coverPath)) unlinkSync(track.coverPath)
    } catch (e) {
      console.error(`Failed to clean up files for deleted track ${track.id}:`, e)
    }
  }
}
