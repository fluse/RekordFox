import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, mkdir, writeFile, copyFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import type { BrowserWindow } from 'electron'
import type { Track, Playlist } from '../../db/types'

type IpcResponseHandler = (
  event: unknown,
  trackId: string,
  result: { peaks: PeakLike[]; rms: PeakLike[] }
) => void

interface PeakLike {
  low: number
  mid: number
  high: number
  all: number
}

const mocks = vi.hoisted(() => {
  let responseHandler: IpcResponseHandler | null = null
  return {
    getResponseHandler: (): IpcResponseHandler | null => responseHandler,
    ipcMainOn: vi.fn((channel: string, handler: IpcResponseHandler) => {
      if (channel === 'waveform:analysis-response') responseHandler = handler
    }),
    getTracksForPlaylist: vi.fn(),
    getPlaylists: vi.fn()
  }
})

vi.mock('electron', () => ({ ipcMain: { on: mocks.ipcMainOn } }))
// Real db/index.ts touches Electron's `app` (via db/store.ts) at import time, which isn't
// available under the plain node test environment — stub out just what this module needs.
vi.mock('../../db', () => ({
  getTracksForPlaylist: mocks.getTracksForPlaylist,
  getPlaylists: mocks.getPlaylists
}))

import { ExportQueueManager } from './ExportQueueManager'
import { PdbReader } from './pdb/PdbReader'

const FIXTURE_PDB_PATH = join(process.cwd(), 'test-fixtures', 'EXPORT.PDB')

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 't1',
    playlistId: 'p1',
    title: 'Test Track',
    artist: 'Test Artist',
    bpm: 128,
    key: '8A',
    duration: 200,
    filepath: '',
    coverPath: '',
    filesize: 1234,
    format: 'MP3',
    rating: 0,
    bitrate: 320,
    ...overrides
  }
}

/** A fake `win.webContents.send` that auto-resolves every waveform-analysis request. */
function makeAutoRespondingWindow(
  peaks: PeakLike[] = [{ low: 0.1, mid: 0.2, high: 0.3, all: 0.4 }]
): {
  win: BrowserWindow
  sentChannels: string[]
} {
  const sentChannels: string[] = []
  const send = vi.fn((channel: string, payload: unknown) => {
    sentChannels.push(channel)
    if (channel === 'waveform:analysis-request') {
      const { trackId } = payload as { trackId: string; filepath: string }
      const handler = mocks.getResponseHandler()
      queueMicrotask(() => handler?.(null, trackId, { peaks, rms: peaks }))
    }
  })
  return { win: { webContents: { send } } as unknown as BrowserWindow, sentChannels }
}

/** A fake window whose waveform-analysis requests are recorded but never answered. */
function makeNonRespondingWindow(): { win: BrowserWindow; requestSent: Promise<void> } {
  let resolveRequestSent: () => void
  const requestSent = new Promise<void>((resolve) => {
    resolveRequestSent = resolve
  })
  const send = vi.fn((channel: string) => {
    if (channel === 'waveform:analysis-request') resolveRequestSent()
  })
  return { win: { webContents: { send } } as unknown as BrowserWindow, requestSent }
}

describe('ExportQueueManager.exportPlaylist', () => {
  let usbDir: string
  let sourceDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    usbDir = await mkdtemp(join(tmpdir(), 'rekordfox-usb-'))
    sourceDir = await mkdtemp(join(tmpdir(), 'rekordfox-src-'))
    mocks.getPlaylists.mockReturnValue([{ id: 'p1', title: 'My Export Playlist' } as Playlist])
  })

  afterEach(async () => {
    await rm(usbDir, { recursive: true, force: true })
    await rm(sourceDir, { recursive: true, force: true })
  })

  async function installPdbFixture(): Promise<string> {
    const dest = join(usbDir, 'PIONEER', 'rekordbox', 'export.pdb')
    await mkdir(dirname(dest), { recursive: true })
    await copyFile(FIXTURE_PDB_PATH, dest)
    return dest
  }

  async function makeSourceFile(name: string, content = 'fake audio bytes'): Promise<string> {
    const p = join(sourceDir, name)
    await writeFile(p, content)
    return p
  }

  it('copies audio + writes ANLZ files + merges the playlist into export.pdb', async () => {
    const pdbPath = await installPdbFixture()
    const before = new PdbReader(await readFile(pdbPath))
    const beforeTrackCount = before.decodeTracks().length
    const beforePlaylistCount = before.playlistTreeIds().length

    const track1Src = await makeSourceFile('track1.mp3')
    const track2Src = await makeSourceFile('track2.mp3', 'other bytes')
    mocks.getTracksForPlaylist.mockReturnValue([
      makeTrack({ id: 't1', title: 'First Track', artist: 'Artist One', filepath: track1Src }),
      makeTrack({ id: 't2', title: 'Second Track', artist: 'Artist Two', filepath: track2Src })
    ])

    const manager = new ExportQueueManager()
    const { win, sentChannels } = makeAutoRespondingWindow()

    const result = await manager.exportPlaylist('p1', usbDir, win)

    expect(result).toEqual({ success: true })
    expect(sentChannels).toContain('waveform:analysis-request')
    expect(sentChannels).toContain('pioneer:export-progress')

    // Audio files were copied byte-for-byte to the expected on-USB location.
    const audio1 = join(usbDir, 'CONTENTS', 'Artist One', 'Collection', 'First Track.mp3')
    const audio2 = join(usbDir, 'CONTENTS', 'Artist Two', 'Collection', 'Second Track.mp3')
    expect(await readFile(audio1, 'utf8')).toBe('fake audio bytes')
    expect(await readFile(audio2, 'utf8')).toBe('other bytes')

    // ANLZ files were written next to rekordbox's own USBANLZ convention, and look like
    // real PMAI-headed ANLZ files (byte-level layout is covered by AnlzBuilder.test.ts).
    const anlzDat1 = join(usbDir, 'PIONEER', 'USBANLZ', 'P100', '10000000', 'ANLZ0000.DAT')
    const anlzExt1 = join(usbDir, 'PIONEER', 'USBANLZ', 'P100', '10000000', 'ANLZ0000.EXT')
    const anlzDat2 = join(usbDir, 'PIONEER', 'USBANLZ', 'P100', '10000001', 'ANLZ0000.DAT')
    expect(existsSync(anlzDat1)).toBe(true)
    expect(existsSync(anlzExt1)).toBe(true)
    expect(existsSync(anlzDat2)).toBe(true)
    expect((await readFile(anlzDat1)).toString('ascii', 0, 4)).toBe('PMAI')
    expect((await readFile(anlzExt1)).toString('ascii', 0, 4)).toBe('PMAI')

    // A one-time backup of the untouched pdb was made before merging.
    expect(existsSync(`${pdbPath}.rffbak`)).toBe(true)

    // The two new tracks and the playlist were merged into the real export.pdb.
    const after = new PdbReader(await readFile(pdbPath))
    expect(after.decodeTracks().length).toBe(beforeTrackCount + 2)
    expect(after.playlistTreeIds().length).toBe(beforePlaylistCount + 1)
    const newFilePaths = after.decodeTracks().map((t) => t.filePath)
    expect(newFilePaths).toContain('/CONTENTS/Artist One/Collection/First Track.mp3')
    expect(newFilePaths).toContain('/CONTENTS/Artist Two/Collection/Second Track.mp3')
  })

  it('still copies files successfully when no export.pdb is present on the stick', async () => {
    const trackSrc = await makeSourceFile('track1.mp3')
    mocks.getTracksForPlaylist.mockReturnValue([makeTrack({ filepath: trackSrc })])

    const manager = new ExportQueueManager()
    const { win } = makeAutoRespondingWindow()

    const result = await manager.exportPlaylist('p1', usbDir, win)

    expect(result).toEqual({ success: true })
    expect(
      existsSync(join(usbDir, 'CONTENTS', 'Test Artist', 'Collection', 'Test Track.mp3'))
    ).toBe(true)
    // No pdb was ever created — nothing to merge into.
    expect(existsSync(join(usbDir, 'PIONEER', 'rekordbox', 'export.pdb'))).toBe(false)
  })

  it('returns an error and copies nothing when the playlist has no local tracks', async () => {
    mocks.getTracksForPlaylist.mockReturnValue([
      makeTrack({ filepath: join(sourceDir, 'does-not-exist.mp3') })
    ])

    const manager = new ExportQueueManager()
    const { win, sentChannels } = makeAutoRespondingWindow()

    const result = await manager.exportPlaylist('p1', usbDir, win)

    expect(result).toEqual({
      success: false,
      error: 'Keine lokalen Tracks in dieser Playlist vorhanden.'
    })
    expect(sentChannels).toEqual([])
    expect(existsSync(join(usbDir, 'CONTENTS'))).toBe(false)
  })

  it('rejects a second export while one is already running', async () => {
    const trackSrc = await makeSourceFile('track1.mp3')
    mocks.getTracksForPlaylist.mockReturnValue([makeTrack({ filepath: trackSrc })])

    const manager = new ExportQueueManager()
    const { win } = makeAutoRespondingWindow()

    const first = manager.exportPlaylist('p1', usbDir, win)
    const second = await manager.exportPlaylist('p1', usbDir, win)

    expect(second).toEqual({ success: false, error: 'Ein Export-Job läuft bereits.' })
    expect(await first).toEqual({ success: true })
  })

  it('cancel() aborts an in-flight export instead of letting it finish', async () => {
    const trackSrc = await makeSourceFile('track1.mp3')
    mocks.getTracksForPlaylist.mockReturnValue([makeTrack({ filepath: trackSrc })])

    const manager = new ExportQueueManager()
    const { win, requestSent } = makeNonRespondingWindow()

    const pending = manager.exportPlaylist('p1', usbDir, win)
    await requestSent
    manager.cancel()

    const result = await pending
    expect(result).toEqual({ success: false, error: 'Export abgebrochen' })
    // The track's audio was never copied — cancellation happened before that step.
    expect(existsSync(join(usbDir, 'CONTENTS'))).toBe(false)
  })
})
