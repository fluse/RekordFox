import type { Playlist } from '@main/db'

// A 'youtube-oauth' playlist mirrors a real YouTube playlist the user owns — every track in it
// must correspond to a YouTube video that's actually in that remote playlist, since sync only
// pushes reordering (playlistItems.update), never inserts. So a track can only be dropped into a
// youtube-oauth playlist if it already came from that same youtube-oauth playlist (or another
// one, e.g. when consolidating imported playlists) — never from a 'local' one.
export function canDropTrack(
  sourcePlaylist: Playlist | undefined,
  targetPlaylist: Playlist
): boolean {
  if (targetPlaylist.source === 'youtube-oauth') {
    return sourcePlaylist?.source === 'youtube-oauth'
  }
  return true
}
