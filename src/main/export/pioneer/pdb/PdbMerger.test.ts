import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { PdbReader } from './PdbReader'
import { mergePlaylist } from './PdbMerger'
import { PageType } from './PdbConstants'

/**
 * Round-trip test against a real rekordbox-exported `export.pdb`
 * (test-fixtures/EXPORT.PDB), so a byte-layout mistake in the writer is
 * caught here instead of on a real CDJ. Byte layout was independently
 * verified against Deep Symmetry's crate-digger `rekordbox_pdb.ksy`.
 */

const FIXTURE_PATH = join(process.cwd(), 'test-fixtures', 'EXPORT.PDB')

describe('mergePlaylist (round-trip against a real export.pdb)', () => {
  const original = readFileSync(FIXTURE_PATH)

  it('preserves every pre-existing row and correctly adds the new ones', () => {
    const before = new PdbReader(original)
    const beforeTracks = before.decodeTracks()
    const beforeArtists = before.decodeArtists()
    const beforePlaylistIds = before.playlistTreeIds()

    const result = mergePlaylist(original, 'RekordFox Test Playlist', [
      {
        title: 'Brand New Track',
        artist: 'Brand New Artist',
        filePath: '/CONTENTS/Test/brand-new-track.mp3',
        filename: 'brand-new-track.mp3',
        analyzePath: '/PIONEER/USBANLZ/P100/10000001/ANLZ0000.DAT',
        tempo: 12800,
        durationSec: 200,
        bitrate: 320,
        fileSize: 8_000_000
      }
    ])

    // The file must remain a whole number of pages, and still parse.
    expect(result.buffer.length % before.pageSize).toBe(0)
    expect(result.addedTracks).toBe(1)
    expect(result.reusedTracks).toBe(0)
    expect(result.addedArtists).toBe(1)

    const after = new PdbReader(result.buffer)
    const afterTracks = after.decodeTracks()
    const afterArtists = after.decodeArtists()
    const afterPlaylistIds = after.playlistTreeIds()

    // Every pre-existing track/artist row must still decode identically.
    const afterTrackById = new Map(afterTracks.map((t) => [t.id, t]))
    for (const t of beforeTracks) {
      expect(afterTrackById.get(t.id)).toEqual(t)
    }
    const afterArtistById = new Map(afterArtists.map((a) => [a.id, a]))
    for (const a of beforeArtists) {
      expect(afterArtistById.get(a.id)).toEqual(a)
    }

    // The new track, artist and playlist were actually added.
    const newTrack = afterTracks.find((t) => t.filePath === '/CONTENTS/Test/brand-new-track.mp3')
    expect(newTrack).toBeDefined()
    expect(afterArtists.some((a) => a.name === 'Brand New Artist')).toBe(true)
    expect(afterPlaylistIds).toContain(result.playlistId)
    expect(afterPlaylistIds.length).toBe(beforePlaylistIds.length + 1)
    expect(afterTracks.length).toBe(beforeTracks.length + 1)

    // Tables this merge never touches must be entirely unaffected.
    for (const type of [PageType.Genres, PageType.Labels, PageType.Colors, PageType.Artwork]) {
      expect(after.rowOffsets(type).length).toBe(before.rowOffsets(type).length)
    }
  })

  it('reuses an existing track instead of duplicating it when the file path already exists', () => {
    const before = new PdbReader(original)
    const beforeTracks = before.decodeTracks()
    const existing = beforeTracks.find((t) => t.filePath)
    expect(existing).toBeDefined()

    const result = mergePlaylist(original, 'Reuse Test Playlist', [
      {
        title: 'Ignored (row already exists)',
        artist: 'Ignored',
        filePath: existing!.filePath,
        filename: 'ignored.mp3',
        analyzePath: '/PIONEER/USBANLZ/P100/10000002/ANLZ0000.DAT',
        tempo: 12000,
        durationSec: 180,
        bitrate: 320,
        fileSize: 1
      }
    ])

    expect(result.addedTracks).toBe(0)
    expect(result.reusedTracks).toBe(1)

    const after = new PdbReader(result.buffer)
    expect(after.decodeTracks().length).toBe(beforeTracks.length)
  })
})
