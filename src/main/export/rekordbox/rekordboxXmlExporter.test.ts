import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn()
}))

import { existsSync } from 'fs'
import { generateRekordboxXml } from './rekordboxXmlExporter'

beforeEach(() => {
  vi.mocked(existsSync).mockReturnValue(true)
})

type ExportTrack = Parameters<typeof generateRekordboxXml>[1][number]

function makeTrack(overrides: Partial<ExportTrack> = {}): ExportTrack {
  return {
    id: 't1',
    playlistId: 'p1',
    title: 'Test Track',
    artist: 'Test Artist',
    filepath: '/music/test.mp3',
    duration: 200,
    bpm: 128,
    key: '8A',
    rating: 0,
    ...overrides
  }
}

describe('generateRekordboxXml', () => {
  it('references playlist tracks by TrackID directly in Key, not as a literal "TrackID" attribute', () => {
    const xml = generateRekordboxXml(
      [{ id: 'p1', title: 'My Playlist' }],
      [makeTrack({ id: 't1' })]
    )

    expect(xml).toContain('<TRACK Key="1" />')
    expect(xml).not.toContain('Key="TrackID"')
  })

  it('emits a TEMPO element with Inizio from gridOffset when BPM is known', () => {
    const xml = generateRekordboxXml([], [makeTrack({ bpm: 128, gridOffset: 0.123 })])

    expect(xml).toContain('<TEMPO Inizio="0.123" Bpm="128.00" Metro="4/4" Battito="1" />')
  })

  it('defaults Inizio to 0.000 when gridOffset is missing', () => {
    const xml = generateRekordboxXml([], [makeTrack({ bpm: 128, gridOffset: undefined })])

    expect(xml).toContain('<TEMPO Inizio="0.000" Bpm="128.00" Metro="4/4" Battito="1" />')
  })

  it('omits TEMPO entirely when BPM has not been analyzed yet', () => {
    const xml = generateRekordboxXml([], [makeTrack({ bpm: 0 })])

    expect(xml).not.toContain('<TEMPO')
    expect(xml).toContain('<TRACK TrackID="1" Name="Test Track" Artist="Test Artist"')
    expect(xml).toMatch(/AverageBpm="0\.00"[^>]*\/>/)
  })

  it('skips tracks and playlists whose file no longer exists on disk', () => {
    vi.mocked(existsSync).mockReturnValue(false)

    const xml = generateRekordboxXml(
      [{ id: 'p1', title: 'My Playlist' }],
      [makeTrack({ id: 't1' })]
    )

    expect(xml).toContain('<COLLECTION Entries="0">')
    expect(xml).not.toContain('My Playlist')
  })
})
