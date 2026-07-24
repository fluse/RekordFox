/**
 * Builders that serialize new rows into the exact on-disk byte layout expected
 * by the Rekordbox `export.pdb` format. Layouts verified against real data.
 *
 * String offsets inside a row are relative to the row's own start, so a row is
 * self-contained and can be relocated freely within a page's heap.
 */

import { encodeDeviceSqlString } from './DeviceSqlString'
import {
  TRACK_FIXED_SIZE,
  TRACK_NUM_STRINGS,
  TRACK_OFS,
  TRACK_STR,
  TRACK_SUBTYPE
} from './PdbConstants'

export interface NewTrack {
  id: number
  title: string
  filePath: string
  filename: string
  analyzePath: string
  artistId: number
  albumId: number
  keyId: number
  genreId: number
  tempo: number // BPM * 100
  durationSec: number
  bitrate: number
  sampleRate: number
  sampleDepth: number
  fileSize: number
  comment: string
  dateAdded: string
}

/** Builds a track row. */
export function buildTrackRow(t: NewTrack): Buffer {
  // The 21 DeviceSQL strings in slot order; empty by default.
  const strings: string[] = new Array(TRACK_NUM_STRINGS).fill('')
  strings[TRACK_STR.title] = t.title
  strings[TRACK_STR.filename] = t.filename
  strings[TRACK_STR.filePath] = t.filePath
  strings[TRACK_STR.analyzePath] = t.analyzePath
  strings[TRACK_STR.comment] = t.comment
  strings[TRACK_STR.dateAdded] = t.dateAdded

  // Encode each string, tracking its offset relative to the row start.
  const encoded: Buffer[] = []
  const offsets: number[] = new Array(TRACK_NUM_STRINGS).fill(0)
  let cursor = TRACK_FIXED_SIZE
  for (let i = 0; i < TRACK_NUM_STRINGS; i++) {
    const b = encodeDeviceSqlString(strings[i])
    offsets[i] = cursor
    encoded.push(b)
    cursor += b.length
  }

  const fixed = Buffer.alloc(TRACK_FIXED_SIZE)
  fixed.writeUInt16LE(TRACK_SUBTYPE, TRACK_OFS.subtype)
  fixed.writeUInt16LE(0, TRACK_OFS.indexShift)
  fixed.writeUInt32LE(0, TRACK_OFS.bitmask)
  fixed.writeUInt32LE(t.sampleRate, TRACK_OFS.sampleRate)
  fixed.writeUInt32LE(0, TRACK_OFS.composerId)
  fixed.writeUInt32LE(t.fileSize >>> 0, TRACK_OFS.fileSize)
  fixed.writeUInt32LE(0, TRACK_OFS.artworkId)
  fixed.writeUInt32LE(t.keyId, TRACK_OFS.keyId)
  fixed.writeUInt32LE(0, TRACK_OFS.origArtistId)
  fixed.writeUInt32LE(0, TRACK_OFS.labelId)
  fixed.writeUInt32LE(0, TRACK_OFS.remixerId)
  fixed.writeUInt32LE(t.bitrate, TRACK_OFS.bitrate)
  fixed.writeUInt32LE(0, TRACK_OFS.trackNumber)
  fixed.writeUInt32LE(t.tempo, TRACK_OFS.tempo)
  fixed.writeUInt32LE(t.genreId, TRACK_OFS.genreId)
  fixed.writeUInt32LE(t.albumId, TRACK_OFS.albumId)
  fixed.writeUInt32LE(t.artistId, TRACK_OFS.artistId)
  fixed.writeUInt32LE(t.id, TRACK_OFS.id)
  fixed.writeUInt16LE(0, TRACK_OFS.discNumber)
  fixed.writeUInt16LE(0, TRACK_OFS.playCount)
  fixed.writeUInt16LE(0, TRACK_OFS.year)
  fixed.writeUInt16LE(t.sampleDepth, TRACK_OFS.sampleDepth)
  fixed.writeUInt16LE(t.durationSec, TRACK_OFS.duration)
  fixed.writeUInt8(0, TRACK_OFS.colorId)
  fixed.writeUInt8(0, TRACK_OFS.rating)
  for (let i = 0; i < TRACK_NUM_STRINGS; i++) {
    fixed.writeUInt16LE(offsets[i], TRACK_OFS.strOffsets + i * 2)
  }

  return Buffer.concat([fixed, ...encoded])
}

/** Builds an artist row (near-offset form, subtype 0x60). */
export function buildArtistRow(id: number, name: string): Buffer {
  const nameBuf = encodeDeviceSqlString(name)
  const head = Buffer.alloc(10)
  head.writeUInt16LE(0x60, 0) // subtype
  head.writeUInt16LE(0, 2) // index_shift
  head.writeUInt32LE(id, 4)
  head.writeUInt8(0x03, 8) // constant
  head.writeUInt8(0x0a, 9) // ofs_name_near -> right after this header
  return Buffer.concat([head, nameBuf])
}

/** Builds an album row (near-offset form, subtype 0x80). */
export function buildAlbumRow(id: number, name: string, artistId = 0): Buffer {
  const nameBuf = encodeDeviceSqlString(name)
  const head = Buffer.alloc(0x16)
  head.writeUInt16LE(0x80, 0) // subtype
  head.writeUInt16LE(0, 2) // index_shift
  head.writeUInt32LE(0, 4)
  head.writeUInt32LE(artistId, 8)
  head.writeUInt32LE(id, 0x0c)
  head.writeUInt32LE(0, 0x10)
  head.writeUInt8(0x03, 0x14) // constant
  head.writeUInt8(0x16, 0x15) // ofs_name_near
  return Buffer.concat([head, nameBuf])
}

/** Builds a key row: id (u32), id2 (u32), name at offset 8. */
export function buildKeyRow(id: number, name: string): Buffer {
  const nameBuf = encodeDeviceSqlString(name)
  const head = Buffer.alloc(8)
  head.writeUInt32LE(id, 0)
  head.writeUInt32LE(id, 4)
  return Buffer.concat([head, nameBuf])
}

/** Builds a playlist-tree row (a playlist node, not a folder). */
export function buildPlaylistTreeRow(
  id: number,
  parentId: number,
  sortOrder: number,
  name: string,
  isFolder = false
): Buffer {
  const nameBuf = encodeDeviceSqlString(name)
  const head = Buffer.alloc(0x14)
  head.writeUInt32LE(parentId, 0)
  head.writeUInt32LE(0, 4)
  head.writeUInt32LE(sortOrder, 8)
  head.writeUInt32LE(id, 0x0c)
  head.writeUInt32LE(isFolder ? 1 : 0, 0x10)
  return Buffer.concat([head, nameBuf])
}

/** Builds a playlist-entry row linking a track into a playlist at a position. */
export function buildPlaylistEntryRow(
  entryIndex: number,
  trackId: number,
  playlistId: number
): Buffer {
  const buf = Buffer.alloc(12)
  buf.writeUInt32LE(entryIndex, 0)
  buf.writeUInt32LE(trackId, 4)
  buf.writeUInt32LE(playlistId, 8)
  return buf
}
