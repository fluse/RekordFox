/**
 * Append-only writer for `export.pdb`.
 *
 * Rather than rewriting the whole database (risking corruption of the user's
 * existing rekordbox library), this appends brand-new data pages for the added
 * rows and splices them onto the end of each affected table's page chain. All
 * existing pages keep their exact bytes; only three kinds of small patches are
 * applied: the previous last page's `next_page` link, the table directory's
 * `last_page`, and the file header's `next_unused_page`/`sequence`.
 *
 * This is safe because rows reference each other by numeric id, never by page
 * index — so reassigning/adding page indices cannot break references.
 */

import { PdbReader } from './PdbReader'
import {
  FILE_HDR_NEXT_UNUSED_PAGE,
  FILE_HDR_SEQUENCE,
  PAGE_FLAG_DATA_DEFAULT,
  PAGE_HDR_FLAGS,
  PAGE_HDR_NEXT_PAGE,
  PAGE_HDR_PAGE_INDEX,
  PAGE_HDR_ROW_COUNTS,
  PAGE_HDR_SEQUENCE,
  PAGE_HDR_TYPE,
  PAGE_HDR_USED_SIZE,
  PAGE_HDR_FREE_SIZE,
  PAGE_HEAP_START,
  ROWS_PER_GROUP,
  ROW_GROUP_PRESENCE_OFFSET,
  ROW_GROUP_SIZE,
  TABLE_ENTRY_LAST_PAGE
} from './PdbConstants'

export interface TableAppend {
  type: number
  rows: Buffer[]
}

interface BuiltPage {
  index: number
  buf: Buffer
}

/**
 * Packs rows for one table into as many data pages as needed and returns them
 * with sequential indices starting at `startIndex`. Each page's `next_page`
 * points to the following page; the final page points to itself.
 */
function buildDataPages(
  rows: Buffer[],
  type: number,
  startIndex: number,
  pageSize: number,
  sequence: number
): BuiltPage[] {
  const pages: BuiltPage[] = []
  let i = 0
  while (i < rows.length) {
    const pageRows: Buffer[] = []
    let heapUsed = 0
    while (i < rows.length) {
      const n = pageRows.length + 1
      const indexSize = Math.ceil(n / ROWS_PER_GROUP) * ROW_GROUP_SIZE
      if (PAGE_HEAP_START + heapUsed + rows[i].length + indexSize > pageSize) break
      pageRows.push(rows[i])
      heapUsed += rows[i].length
      i++
    }
    if (pageRows.length === 0) {
      throw new Error(
        `pdb row too large to fit in a page (${rows[i].length} bytes, page ${pageSize})`
      )
    }
    pages.push({
      index: startIndex + pages.length,
      buf: buildDataPage(pageRows, type, startIndex + pages.length, pageSize, sequence)
    })
  }

  // Chain next_page links.
  for (let k = 0; k < pages.length; k++) {
    const next = k < pages.length - 1 ? pages[k + 1].index : pages[k].index
    pages[k].buf.writeUInt32LE(next, PAGE_HDR_NEXT_PAGE)
  }
  return pages
}

/** Serializes a single data page (header + heap + backward row-group index). */
function buildDataPage(
  rows: Buffer[],
  type: number,
  index: number,
  pageSize: number,
  sequence: number
): Buffer {
  const buf = Buffer.alloc(pageSize)
  buf.writeUInt32LE(0, 0) // gap
  buf.writeUInt32LE(index, PAGE_HDR_PAGE_INDEX)
  buf.writeUInt32LE(type, PAGE_HDR_TYPE)
  buf.writeUInt32LE(index, PAGE_HDR_NEXT_PAGE) // placeholder, chained later
  buf.writeUInt32LE(sequence, PAGE_HDR_SEQUENCE)

  // Heap: place rows consecutively from PAGE_HEAP_START.
  const offsets: number[] = []
  let cursor = PAGE_HEAP_START
  for (const row of rows) {
    row.copy(buf, cursor)
    offsets.push(cursor - PAGE_HEAP_START)
    cursor += row.length
  }
  const usedHeap = cursor - PAGE_HEAP_START
  const n = rows.length

  // Row counts: bits 0-12 num_row_offsets, bits 13-23 num_rows. For freshly
  // written pages with no deletions both equal n. Written as u32 first (its top
  // byte is 0 because n < 2048), then page_flags overwrites byte 0x1b.
  const rowCounts = (n & 0x1fff) | ((n & 0x7ff) << 13)
  buf.writeUInt32LE(rowCounts >>> 0, PAGE_HDR_ROW_COUNTS)
  buf.writeUInt8(PAGE_FLAG_DATA_DEFAULT, PAGE_HDR_FLAGS)

  const indexSize = Math.ceil(n / ROWS_PER_GROUP) * ROW_GROUP_SIZE
  const free = pageSize - PAGE_HEAP_START - usedHeap - indexSize
  buf.writeUInt16LE(free & 0xffff, PAGE_HDR_FREE_SIZE)
  buf.writeUInt16LE(usedHeap & 0xffff, PAGE_HDR_USED_SIZE)

  // Backward row-group index. Logical row s in group g -> offset slot (15-s),
  // presence bit s. Group g occupies [pageEnd-(g+1)*36, pageEnd-g*36).
  const numGroups = Math.ceil(n / ROWS_PER_GROUP)
  for (let g = 0; g < numGroups; g++) {
    const block = pageSize - (g + 1) * ROW_GROUP_SIZE
    let presence = 0
    for (let s = 0; s < ROWS_PER_GROUP; s++) {
      const globalIndex = g * ROWS_PER_GROUP + s
      if (globalIndex >= n) break
      presence |= 1 << s
      buf.writeUInt16LE(offsets[globalIndex], block + (ROWS_PER_GROUP - 1 - s) * 2)
    }
    buf.writeUInt16LE(presence, block + ROW_GROUP_PRESENCE_OFFSET)
    buf.writeUInt16LE(0, block + ROW_GROUP_PRESENCE_OFFSET + 2) // unknown
  }

  return buf
}

/**
 * Returns a new pdb buffer with the given rows appended to their tables.
 * Tables not present in `appends` (or with no rows) are left untouched.
 */
export function appendRows(originalBuf: Buffer, appends: TableAppend[]): Buffer {
  const reader = new PdbReader(originalBuf)
  const pageSize = reader.pageSize
  const originalPages = Math.ceil(originalBuf.length / pageSize)
  const newSequence = (reader.sequence + 1) >>> 0

  // First index at which we may place new pages: past both the physical file
  // end and the header's next_unused_page hint (which may reference not-yet-
  // materialized empty-candidate pages).
  const firstNewIndex = Math.max(originalPages, reader.nextUnusedPage)

  const active = appends.filter((a) => a.rows.length > 0)

  // Build all new pages, assigning indices sequentially per table.
  let cursor = firstNewIndex
  const built: { type: number; pages: BuiltPage[] }[] = []
  for (const a of active) {
    const pages = buildDataPages(a.rows, a.type, cursor, pageSize, newSequence)
    if (pages.length === 0) continue
    built.push({ type: a.type, pages })
    cursor += pages.length
  }
  const nextUnusedPage = cursor

  // Assemble output: original bytes, zero-padded up to firstNewIndex, then the
  // new pages contiguously.
  const out = Buffer.alloc(nextUnusedPage * pageSize)
  originalBuf.copy(out, 0)

  for (const { type, pages } of built) {
    for (const p of pages) p.buf.copy(out, p.index * pageSize)

    const table = reader.getTable(type)
    if (!table) throw new Error(`pdb append: table type ${type} not found`)

    // Splice: previous last page -> first new page; header last_page -> new last.
    const prevLast = table.lastPage
    out.writeUInt32LE(pages[0].index, prevLast * pageSize + PAGE_HDR_NEXT_PAGE)
    out.writeUInt32LE(pages[pages.length - 1].index, table.entryOffset + TABLE_ENTRY_LAST_PAGE)
  }

  out.writeUInt32LE(nextUnusedPage, FILE_HDR_NEXT_UNUSED_PAGE)
  out.writeUInt32LE(newSequence, FILE_HDR_SEQUENCE)

  return out
}
