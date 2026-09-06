import type { Playlist } from './types'

export function getPlaylistFolderName(playlist: Playlist): string {
  const cleanTitle = playlist.title.replace(/[\\/:*?"<>|]/g, '').trim() || 'Unknown Playlist'
  const lowercaseUrl = (playlist.url || '').toLowerCase()
  const provider = lowercaseUrl.includes('soundcloud.com')
    ? 'soundcloud'
    : lowercaseUrl.includes('spotify.com')
      ? 'spotify'
      : 'youtube'
  return `${cleanTitle}-${provider}-${playlist.id}`
}

function sanitizeForFilename(str: string): string {
  return str
    .replace(/[\\/:*?"<>|]/g, '') // remove invalid filename chars
    .trim()
}

export function getTrackFilename(
  playlistId: string,
  trackId: string,
  artist: string,
  title: string,
  position: number,
  bpm: number,
  template: 'default' | 'custom'
): string {
  if (template === 'custom') {
    const cleanArtist = sanitizeForFilename(artist) || 'Unknown Artist'
    const cleanTitle = sanitizeForFilename(title) || 'Unknown Title'
    const trackPos = position.toString().padStart(2, '0')
    return `${trackPos}-${cleanArtist}-${cleanTitle}-${Math.round(bpm)}bpm-${trackId}.mp3`
  }
  return `${playlistId}_${trackId}.mp3`
}
