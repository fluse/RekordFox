import type { Playlist } from '@main/db'

// A 'youtube-oauth' playlist mirrors a real YouTube playlist the user owns. Sync can push both
// reordering (playlistItems.update) and new membership (playlistItems.insert) back to YouTube —
// technically this would work for any track, since every track's ID is a real YouTube video ID
// regardless of source. Restricting drops into a youtube-oauth playlist to tracks that already
// came from another youtube-oauth playlist (e.g. when consolidating imported playlists) is a
// deliberate product choice, not a technical necessity — it keeps a 'local' playlist's
// download-only tracks from unexpectedly appearing on the user's real YouTube account.
export function canDropTrack(
  sourcePlaylist: Playlist | undefined,
  targetPlaylist: Playlist
): boolean {
  if (targetPlaylist.source === 'youtube-oauth') {
    return sourcePlaylist?.source === 'youtube-oauth'
  }
  return true
}
