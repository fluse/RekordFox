/**
 * Reader for the Rekordbox DeviceSQL `export.pdb` format.
 *
 * Parses the file header and table directory, walks each table's page chain and
 * yields the absolute byte offset of every *present* row (using the row-presence
 * bitmask so deleted/garbage rows are skipped). Provides typed decoders for the
 * tables we need to merge into (tracks, artists, albums, keys, playlist tree).
 *
 * All parsing was verified against a real rekordbox export.pdb.
 */

import { decodeDeviceSqlString } from './DeviceSqlString'
import {
  FILE_HDR_LEN_PAGE,
  FILE_HDR_NEXT_UNUSED_PAGE,
  FILE_HDR_NUM_TABLES,
  FILE_HDR_SEQUENCE,
  FILE_HDR_TABLES_START,
  PAGE_FLAG_INDEX,
  PAGE_HDR_FLAGS,
  PAGE_HDR_NEXT_PAGE,
  PAGE_HDR_ROW_COUNTS,
  PAGE_HEAP_START,
  ROWS_PER_GROUP,
  ROW_GROUP_PRESENCE_OFFSET,
  ROW_GROUP_SIZE,
  TABLE_ENTRY_EMPTY_CANDIDATE,
  TABLE_ENTRY_FIRST_PAGE,
  TABLE_ENTRY_LAST_PAGE,
  TABLE_ENTRY_SIZE,
  TABLE_ENTRY_TYPE,
  TRACK_OFS,
  TRACK_STR
} from './PdbConstants'

export interface TableEntry {
  type: number
  /** Byte offset of this entry within the file header (for in-place patching). */
  entryOffset: number
  emptyCandidate: number
  firstPage: number
  lastPage: number
}

export interface NamedRow {
  id: number
  name: string
}

export interface TrackRowInfo {
  id: number
  filePath: string
}

export class PdbReader {
  readonly buf: Buffer
  readonly pageSize: number
  readonly numTables: number
  readonly nextUnusedPage: number
  readonly sequence: number
  readonly tables: TableEntry[]

  constructor(buf: Buffer) {
    this.buf = buf
    this.pageSize = buf.readUInt32LE(FILE_HDR_LEN_PAGE)
    this.numTables = buf.readUInt32LE(FILE_HDR_NUM_TABLES)
    this.nextUnusedPage = buf.readUInt32LE(FILE_HDR_NEXT_UNUSED_PAGE)
    this.sequence = buf.readUInt32LE(FILE_HDR_SEQUENCE)

    if (this.pageSize <= 0 || this.pageSize > buf.length) {
      throw new Error(`Invalid pdb page size: ${this.pageSize}`)
    }

    this.tables = []
    for (let i = 0; i < this.numTables; i++) {
      const entryOffset = FILE_HDR_TABLES_START + i * TABLE_ENTRY_SIZE
      this.tables.push({
        type: buf.readUInt32LE(entryOffset + TABLE_ENTRY_TYPE),
        entryOffset,
        emptyCandidate: buf.readUInt32LE(entryOffset + TABLE_ENTRY_EMPTY_CANDIDATE),
        firstPage: buf.readUInt32LE(entryOffset + TABLE_ENTRY_FIRST_PAGE),
        lastPage: buf.readUInt32LE(entryOffset + TABLE_ENTRY_LAST_PAGE)
      })
    }
  }

  getTable(type: number): TableEntry | undefined {
    return this.tables.find((t) => t.type === type)
  }

  private pageBase(index: number): number {
    return index * this.pageSize
  }

  private isIndexPage(pageIndex: number): boolean {
    const flags = this.buf.readUInt8(this.pageBase(pageIndex) + PAGE_HDR_FLAGS)
    return (flags & PAGE_FLAG_INDEX) !== 0
  }

  /** Absolute offsets of every present row on a single data page. */
  private pageRowOffsets(pageIndex: number): number[] {
    const base = this.pageBase(pageIndex)
    if (this.isIndexPage(pageIndex)) return []
    const rowCounts = this.buf.readUInt32LE(base + PAGE_HDR_ROW_COUNTS)
    const numRowOffsets = rowCounts & 0x1fff
    const pageEnd = base + this.pageSize
    const numGroups = Math.ceil(numRowOffsets / ROWS_PER_GROUP)
    const offsets: number[] = []
    for (let g = 0; g < numGroups; g++) {
      const block = pageEnd - (g + 1) * ROW_GROUP_SIZE
      const presence = this.buf.readUInt16LE(block + ROW_GROUP_PRESENCE_OFFSET)
      for (let s = 0; s < ROWS_PER_GROUP; s++) {
        const globalIndex = g * ROWS_PER_GROUP + s
        if (globalIndex >= numRowOffsets) break
        if ((presence >> s) & 1) {
          const rowOffset = this.buf.readUInt16LE(block + (ROWS_PER_GROUP - 1 - s) * 2)
          offsets.push(base + PAGE_HEAP_START + rowOffset)
        }
      }
    }
    return offsets
  }

  /** Absolute offsets of every present row across a whole table. */
  rowOffsets(type: number): number[] {
    const table = this.getTable(type)
    if (!table) return []
    const result: number[] = []
    let pageIndex = table.firstPage
    let guard = 0
    const maxPages = this.buf.length / this.pageSize + 1
    while (pageIndex && pageIndex * this.pageSize < this.buf.length && guard++ < maxPages) {
      for (const off of this.pageRowOffsets(pageIndex)) result.push(off)
      if (pageIndex === table.lastPage) break
      pageIndex = this.buf.readUInt32LE(this.pageBase(pageIndex) + PAGE_HDR_NEXT_PAGE)
    }
    return result
  }

  // ---- Typed decoders for tables we merge into ----

  decodeTracks(): TrackRowInfo[] {
    return this.rowOffsets(0).map((o) => {
      const id = this.buf.readUInt32LE(o + TRACK_OFS.id)
      const filePathOfs = this.buf.readUInt16LE(o + TRACK_OFS.strOffsets + TRACK_STR.filePath * 2)
      const filePath = filePathOfs ? decodeDeviceSqlString(this.buf, o + filePathOfs).text : ''
      return { id, filePath }
    })
  }

  /** Artists and albums share a "name via near/far offset" layout. */
  private decodeNamedWithOffset(type: number, idOffset: number, nearOffset: number): NamedRow[] {
    return this.rowOffsets(type).map((o) => {
      const subtype = this.buf.readUInt16LE(o)
      const id = this.buf.readUInt32LE(o + idOffset)
      const nameOfs =
        subtype & 0x04
          ? this.buf.readUInt16LE(o + nearOffset + 1)
          : this.buf.readUInt8(o + nearOffset)
      const name = nameOfs ? decodeDeviceSqlString(this.buf, o + nameOfs).text : ''
      return { id, name }
    })
  }

  decodeArtists(): NamedRow[] {
    return this.decodeNamedWithOffset(2, 0x04, 0x09)
  }

  decodeAlbums(): NamedRow[] {
    return this.decodeNamedWithOffset(3, 0x0c, 0x15)
  }

  /** Key rows store id (u32), id2 (u32), then the name directly at offset 8. */
  decodeKeys(): NamedRow[] {
    return this.rowOffsets(5).map((o) => ({
      id: this.buf.readUInt32LE(o),
      name: decodeDeviceSqlString(this.buf, o + 8).text
    }))
  }

  /** Playlist tree node ids (id lives at offset 0x0c). */
  playlistTreeIds(): number[] {
    return this.rowOffsets(7).map((o) => this.buf.readUInt32LE(o + 0x0c))
  }

  /** Largest existing id in a table's decoded rows, or 0 if none. */
  static maxId(rows: { id: number }[] | number[]): number {
    let max = 0
    for (const r of rows) {
      const id = typeof r === 'number' ? r : r.id
      if (id > max) max = id
    }
    return max
  }
}
