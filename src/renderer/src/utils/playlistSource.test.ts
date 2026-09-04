import { describe, expect, it } from 'vitest'
import type { Playlist } from '@main/db'
import { canDropTrack } from './playlistSource'

function makePlaylist(overrides: Partial<Playlist>): Playlist {
  return {
    id: 'p1',
    title: 'Test Playlist',
    url: '',
    syncStatus: 'idle',
    lastSync: '',
    source: 'local',
    ...overrides
  }
}

describe('canDropTrack', () => {
  it('allows dropping into a manually created empty playlist regardless of the source', () => {
    const target = makePlaylist({ source: 'local', url: '' })

    expect(canDropTrack(undefined, target)).toBe(true)
    expect(canDropTrack(makePlaylist({ source: 'local' }), target)).toBe(true)
    expect(canDropTrack(makePlaylist({ source: 'spotify' }), target)).toBe(true)
    expect(canDropTrack(makePlaylist({ source: 'youtube-oauth' }), target)).toBe(true)
  })

  it('allows dropping into a plain local or spotify playlist regardless of the source', () => {
    expect(
      canDropTrack(makePlaylist({ source: 'spotify' }), makePlaylist({ source: 'local' }))
    ).toBe(true)
    expect(
      canDropTrack(makePlaylist({ source: 'youtube-oauth' }), makePlaylist({ source: 'spotify' }))
    ).toBe(true)
  })

  it('only allows dropping into a youtube-oauth playlist from another youtube-oauth playlist', () => {
    const target = makePlaylist({ source: 'youtube-oauth' })

    expect(canDropTrack(makePlaylist({ source: 'youtube-oauth' }), target)).toBe(true)
    expect(canDropTrack(makePlaylist({ source: 'local' }), target)).toBe(false)
    expect(canDropTrack(makePlaylist({ source: 'spotify' }), target)).toBe(false)
    expect(canDropTrack(undefined, target)).toBe(false)
  })
})
