import { describe, expect, it, vi, beforeEach } from 'vitest'

type IpcHandler = (event: unknown, ...args: never[]) => unknown

const mocks = vi.hoisted(() => {
  const handlers = new Map<string, IpcHandler>()
  return {
    handlers,
    ipcHandle: vi.fn((channel: string, listener: IpcHandler) => {
      handlers.set(channel, listener)
    }),
    addPlaylist: vi.fn(),
    getPlaylists: vi.fn(() => []),
    getMainWindow: vi.fn(() => undefined),
    syncPlaylist: vi.fn()
  }
})

vi.mock('electron', () => ({ ipcMain: { handle: mocks.ipcHandle } }))
// Real db.ts touches Electron's `app` at import time, which isn't available under the plain node
// test environment — stub out just the pieces registerPlaylistsIpc needs.
vi.mock('../db', () => ({
  getPlaylists: mocks.getPlaylists,
  getPlaylistStats: vi.fn(() => ({})),
  addPlaylist: mocks.addPlaylist,
  deletePlaylist: vi.fn(),
  renamePlaylist: vi.fn()
}))
vi.mock('../media/downloader', () => ({ getPlaylistInfo: vi.fn() }))
vi.mock('../auth/spotifyApi', () => ({ getSpotifyPlaylistInfo: vi.fn() }))
vi.mock('../sync/syncManager', () => ({ syncPlaylist: mocks.syncPlaylist }))
vi.mock('../export/m3u8/m3u8Exporter', () => ({ exportPlaylistToUsb: vi.fn() }))
vi.mock('../app/window', () => ({ getMainWindow: mocks.getMainWindow }))

import { registerPlaylistsIpc } from './playlists'

describe('playlists:create-empty', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.handlers.clear()
    registerPlaylistsIpc()
  })

  function invoke(title: string): Promise<unknown> {
    const handler = mocks.handlers.get('playlists:create-empty')
    if (!handler) throw new Error('playlists:create-empty handler was not registered')
    return Promise.resolve(handler(null, title as never))
  }

  it('creates a "local" playlist with no url', async () => {
    const result = await invoke('My New Playlist')

    expect(result).toMatchObject({
      success: true,
      playlist: {
        title: 'My New Playlist',
        url: '',
        source: 'local',
        syncStatus: 'idle',
        lastSync: ''
      }
    })
    const playlist = (result as { playlist: { id: string } }).playlist
    expect(typeof playlist.id).toBe('string')
    expect(playlist.id.length).toBeGreaterThan(0)
  })

  it('trims the title', async () => {
    const result = (await invoke('  Warmup Set  ')) as { playlist: { title: string } }
    expect(result.playlist.title).toBe('Warmup Set')
  })

  it('persists the new playlist via addPlaylist', async () => {
    await invoke('Crate Diggers')

    expect(mocks.addPlaylist).toHaveBeenCalledTimes(1)
    expect(mocks.addPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Crate Diggers', url: '', source: 'local' })
    )
  })

  it('does not trigger a sync, unlike playlists:add', async () => {
    await invoke('Silent Crate')

    expect(mocks.getMainWindow).not.toHaveBeenCalled()
    expect(mocks.syncPlaylist).not.toHaveBeenCalled()
  })

  it('assigns each new playlist a distinct id', async () => {
    const first = (await invoke('One')) as { playlist: { id: string } }
    const second = (await invoke('Two')) as { playlist: { id: string } }

    expect(first.playlist.id).not.toBe(second.playlist.id)
  })
})
