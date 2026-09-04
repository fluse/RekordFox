import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { BrowserWindow } from 'electron'
import type { Playlist } from '../db'

const mocks = vi.hoisted(() => ({
  syncLocalPlaylist: vi.fn(),
  pullYoutubeOAuthPlaylist: vi.fn(),
  syncSpotifyPlaylist: vi.fn()
}))

// Real db.ts touches Electron's `app` at import time, which isn't available under the plain node
// test environment — stub it out, since syncPlaylist itself doesn't need anything from it.
vi.mock('../db', () => ({ getPlaylists: vi.fn(() => []) }))
vi.mock('./sync', () => ({ syncLocalPlaylist: mocks.syncLocalPlaylist }))
vi.mock('./youtubeSync', () => ({ pullYoutubeOAuthPlaylist: mocks.pullYoutubeOAuthPlaylist }))
vi.mock('./spotifySync', () => ({ syncSpotifyPlaylist: mocks.syncSpotifyPlaylist }))

import { syncPlaylist } from './syncManager'

const win = {} as BrowserWindow

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

describe('syncPlaylist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes a youtube-oauth playlist to pullYoutubeOAuthPlaylist even without a url', async () => {
    const playlist = makePlaylist({ source: 'youtube-oauth', url: '' })

    await syncPlaylist(playlist, win)

    expect(mocks.pullYoutubeOAuthPlaylist).toHaveBeenCalledWith(playlist, win)
    expect(mocks.syncLocalPlaylist).not.toHaveBeenCalled()
    expect(mocks.syncSpotifyPlaylist).not.toHaveBeenCalled()
  })

  it('skips a local playlist with no url (a manually created empty playlist)', async () => {
    const playlist = makePlaylist({ source: 'local', url: '' })

    await syncPlaylist(playlist, win)

    expect(mocks.syncLocalPlaylist).not.toHaveBeenCalled()
    expect(mocks.syncSpotifyPlaylist).not.toHaveBeenCalled()
    expect(mocks.pullYoutubeOAuthPlaylist).not.toHaveBeenCalled()
  })

  it('skips a spotify playlist with no url', async () => {
    const playlist = makePlaylist({ source: 'spotify', url: '' })

    await syncPlaylist(playlist, win)

    expect(mocks.syncSpotifyPlaylist).not.toHaveBeenCalled()
  })

  it('syncs a local playlist that has a url', async () => {
    const playlist = makePlaylist({
      source: 'local',
      url: 'https://www.youtube.com/playlist?list=abc'
    })

    await syncPlaylist(playlist, win)

    expect(mocks.syncLocalPlaylist).toHaveBeenCalledWith(playlist, win)
  })

  it('syncs a spotify playlist that has a url', async () => {
    const playlist = makePlaylist({
      source: 'spotify',
      url: 'https://open.spotify.com/playlist/abc'
    })

    await syncPlaylist(playlist, win)

    expect(mocks.syncSpotifyPlaylist).toHaveBeenCalledWith(playlist, win)
  })
})
