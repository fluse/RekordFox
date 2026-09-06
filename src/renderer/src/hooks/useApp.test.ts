// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { Playlist, Track } from '@main/db'
import { useApp } from './useApp'

function makePlaylist(overrides: Partial<Playlist> & { id: string; title: string }): Playlist {
  return {
    url: '',
    syncStatus: 'idle',
    lastSync: '',
    source: 'local',
    ...overrides
  }
}

function makeTrack(overrides: Partial<Track> & { id: string; playlistId: string }): Track {
  return {
    title: 'Untitled',
    artist: '',
    bpm: 0,
    key: '',
    duration: 0,
    filepath: '',
    coverPath: '',
    filesize: 0,
    format: 'MP3',
    rating: 0,
    ...overrides
  }
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

// Builds a minimal-but-complete `window.api` mock: every method useApp() can call during its
// effects gets a harmless stub, while `getTracks` is the one under test and returns a
// caller-controlled deferred promise per playlist id.
function installWindowApi(
  playlists: Playlist[],
  tracksByPlaylist: Map<string, Deferred<Track[]>>
): { getTracks: ReturnType<typeof vi.fn> } {
  const getTracks = vi.fn((playlistId?: string) => {
    if (!playlistId) return Promise.resolve([])
    return tracksByPlaylist.get(playlistId)?.promise ?? Promise.resolve([])
  })

  window.api = {
    getPlaylists: vi.fn().mockResolvedValue(playlists),
    getPlaylistStats: vi.fn().mockResolvedValue({}),
    getSettings: vi.fn().mockResolvedValue({
      theme: 'dark',
      colorScheme: 'purple',
      downloadPath: '',
      sidebarWidth: 256,
      maxWorkers: 3,
      language: 'en'
    }),
    getTracks,
    onSyncStatusChanged: vi.fn(() => () => {}),
    onDownloadProgress: vi.fn(() => () => {}),
    onBpmAnalyzed: vi.fn(() => () => {}),
    onKeyAnalyzed: vi.fn(() => () => {}),
    onRenamingStatus: vi.fn(() => () => {}),
    onTrackFilepathChanged: vi.fn(() => () => {}),
    onTracksUpdated: vi.fn(() => () => {}),
    onYoutubePlaylistsLinked: vi.fn(() => () => {}),
    onYoutubePlaylistsUnlinked: vi.fn(() => () => {})
  } as unknown as Window['api']

  return { getTracks }
}

describe('useApp - selected playlist track fetching', () => {
  const localPlaylist = makePlaylist({ id: 'local-1', title: 'Deep', source: 'local' })
  const spotifyPlaylist = makePlaylist({
    id: 'spotify-1',
    title: 'AfterGood2U',
    source: 'spotify'
  })

  const localTracks = [makeTrack({ id: 'local-track', playlistId: 'local-1', title: 'Local' })]
  const spotifyTracks = [
    makeTrack({ id: 'spotify-track', playlistId: 'spotify-1', title: 'Spotify' })
  ]

  beforeEach(() => {
    localStorage.clear()
  })

  it('ignores a stale response for a playlist the user already navigated away from', async () => {
    const tracksByPlaylist = new Map<string, Deferred<Track[]>>([
      ['local-1', createDeferred<Track[]>()],
      ['spotify-1', createDeferred<Track[]>()]
    ])
    const { getTracks } = installWindowApi([localPlaylist, spotifyPlaylist], tracksByPlaylist)

    const { result } = renderHook(() => useApp())

    // Startup auto-selects the first playlist (the local one), same as clicking it in the
    // sidebar — its tracks fetch is still in flight, matching the reported repro.
    await waitFor(() => expect(result.current.selectedPlaylistId).toBe('local-1'))

    // The user then clicks the Spotify playlist before the local fetch resolves.
    act(() => {
      result.current.setSelectedPlaylistId('spotify-1')
    })
    await waitFor(() => expect(getTracks).toHaveBeenCalledWith('spotify-1'))

    // The newly selected playlist's tracks arrive...
    await act(async () => {
      tracksByPlaylist.get('spotify-1')!.resolve(spotifyTracks)
    })
    expect(result.current.tracks).toEqual(spotifyTracks)

    // ...then the stale local-playlist response finally arrives. It must not overwrite the
    // Spotify tracks that are now on screen.
    await act(async () => {
      tracksByPlaylist.get('local-1')!.resolve(localTracks)
    })
    expect(result.current.tracks).toEqual(spotifyTracks)
  })

  it('applies an in-order response normally', async () => {
    const tracksByPlaylist = new Map<string, Deferred<Track[]>>([
      ['local-1', createDeferred<Track[]>()],
      ['spotify-1', createDeferred<Track[]>()]
    ])
    installWindowApi([localPlaylist, spotifyPlaylist], tracksByPlaylist)

    const { result } = renderHook(() => useApp())
    await waitFor(() => expect(result.current.selectedPlaylistId).toBe('local-1'))

    await act(async () => {
      tracksByPlaylist.get('local-1')!.resolve(localTracks)
    })
    expect(result.current.tracks).toEqual(localTracks)

    act(() => {
      result.current.setSelectedPlaylistId('spotify-1')
    })
    await act(async () => {
      tracksByPlaylist.get('spotify-1')!.resolve(spotifyTracks)
    })
    expect(result.current.tracks).toEqual(spotifyTracks)
  })
})
