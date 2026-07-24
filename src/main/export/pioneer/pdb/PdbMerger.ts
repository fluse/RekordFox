/**
 * High-level merge: adds a playlist and its tracks into an existing
 * `export.pdb`, reusing existing artist/album/key/track rows where possible and
 * creating new ones otherwise. Existing rows are never modified.
 */

import { PdbReader } from './PdbReader'
import { appendRows, TableAppend } from './PdbAppendWriter'
import {
  buildAlbumRow,
  buildArtistRow,
  buildKeyRow,
  buildPlaylistEntryRow,
  buildPlaylistTreeRow,
  buildTrackRow,
  NewTrack
} from './rowBuilders'
import { PageType } from './PdbConstants'

export interface MergeTrackInput {
  title: string
  artist: string
  album?: string
  key?: string
  /** On-USB audio path, e.g. `/CONTENTS/Artist/Collection/Title.mp3`. */
  filePath: string
  filename: string
  /** On-USB analysis path, e.g. `/PIONEER/USBANLZ/P001/00000001/ANLZ0000.DAT`. */
  analyzePath: string
  tempo: number // BPM * 100
  durationSec: number
  bitrate: number
  sampleRate?: number
  sampleDepth?: number
  fileSize: number
  dateAdded?: string
  comment?: string
}

export interface MergeResult {
  buffer: Buffer
  playlistId: number
  addedTracks: number
  reusedTracks: number
  addedArtists: number
  addedAlbums: number
  addedKeys: number
}

const norm = (s: string | undefined): string => (s ?? '').trim().toLowerCase()

export function mergePlaylist(
  originalBuf: Buffer,
  playlistName: string,
  tracks: MergeTrackInput[]
): MergeResult {
  const reader = new PdbReader(originalBuf)

  const existingTracks = reader.decodeTracks()
  const existingArtists = reader.decodeArtists()
  const existingAlbums = reader.decodeAlbums()
  const existingKeys = reader.decodeKeys()
  const existingPlaylistIds = reader.playlistTreeIds()

  const trackByPath = new Map<string, number>()
  for (const t of existingTracks) if (t.filePath) trackByPath.set(t.filePath, t.id)
  const artistByName = new Map<string, number>()
  for (const a of existingArtists) if (a.name) artistByName.set(norm(a.name), a.id)
  const albumByName = new Map<string, number>()
  for (const a of existingAlbums) if (a.name) albumByName.set(norm(a.name), a.id)
  const keyByName = new Map<string, number>()
  for (const k of existingKeys) if (k.name) keyByName.set(norm(k.name), k.id)

  let nextTrackId = PdbReader.maxId(existingTracks) + 1
  let nextArtistId = PdbReader.maxId(existingArtists) + 1
  let nextAlbumId = PdbReader.maxId(existingAlbums) + 1
  let nextKeyId = PdbReader.maxId(existingKeys) + 1
  const playlistId = PdbReader.maxId(existingPlaylistIds) + 1

  const newArtistRows: Buffer[] = []
  const newAlbumRows: Buffer[] = []
  const newKeyRows: Buffer[] = []
  const newTrackRows: Buffer[] = []
  const newEntryRows: Buffer[] = []

  let addedTracks = 0
  let reusedTracks = 0

  const resolveArtist = (name: string): number => {
    if (!name.trim()) return 0
    const found = artistByName.get(norm(name))
    if (found !== undefined) return found
    const id = nextArtistId++
    artistByName.set(norm(name), id)
    newArtistRows.push(buildArtistRow(id, name))
    return id
  }
  const resolveAlbum = (name: string | undefined): number => {
    if (!name || !name.trim()) return 0
    const found = albumByName.get(norm(name))
    if (found !== undefined) return found
    const id = nextAlbumId++
    albumByName.set(norm(name), id)
    newAlbumRows.push(buildAlbumRow(id, name))
    return id
  }
  const resolveKey = (name: string | undefined): number => {
    if (!name || !name.trim()) return 0
    const found = keyByName.get(norm(name))
    if (found !== undefined) return found
    const id = nextKeyId++
    keyByName.set(norm(name), id)
    newKeyRows.push(buildKeyRow(id, name))
    return id
  }

  let entryIndex = 1
  for (const t of tracks) {
    let trackId = trackByPath.get(t.filePath)
    if (trackId === undefined) {
      trackId = nextTrackId++
      const artistId = resolveArtist(t.artist)
      const albumId = resolveAlbum(t.album)
      const keyId = resolveKey(t.key)
      const row: NewTrack = {
        id: trackId,
        title: t.title,
        filePath: t.filePath,
        filename: t.filename,
        analyzePath: t.analyzePath,
        artistId,
        albumId,
        keyId,
        genreId: 0,
        tempo: t.tempo,
        durationSec: t.durationSec,
        bitrate: t.bitrate,
        sampleRate: t.sampleRate ?? 44100,
        sampleDepth: t.sampleDepth ?? 16,
        fileSize: t.fileSize,
        comment: t.comment ?? '',
        dateAdded: t.dateAdded ?? ''
      }
      newTrackRows.push(buildTrackRow(row))
      trackByPath.set(t.filePath, trackId)
      addedTracks++
    } else {
      reusedTracks++
    }
    newEntryRows.push(buildPlaylistEntryRow(entryIndex++, trackId, playlistId))
  }

  const playlistRow = buildPlaylistTreeRow(playlistId, 0, playlistId, playlistName, false)

  const appends: TableAppend[] = [
    { type: PageType.Artists, rows: newArtistRows },
    { type: PageType.Albums, rows: newAlbumRows },
    { type: PageType.Keys, rows: newKeyRows },
    { type: PageType.Tracks, rows: newTrackRows },
    { type: PageType.PlaylistTree, rows: [playlistRow] },
    { type: PageType.PlaylistEntries, rows: newEntryRows }
  ]

  const buffer = appendRows(originalBuf, appends)

  return {
    buffer,
    playlistId,
    addedTracks,
    reusedTracks,
    addedArtists: newArtistRows.length,
    addedAlbums: newAlbumRows.length,
    addedKeys: newKeyRows.length
  }
}
