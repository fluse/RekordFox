/**
 * Constants and layout offsets for the Rekordbox DeviceSQL `export.pdb` format.
 *
 * All values were verified empirically against a real rekordbox-exported
 * `export.pdb` (see docs/roadmap and the reverse-engineering references from
 * Deep Symmetry's crate-digger and the DJL analysis project).
 *
 * The file is a sequence of fixed-size pages. Page 0 holds the file header and
 * the table directory. Each table is a linked list of pages; the first page of
 * every table is an (index) page, followed by data pages holding rows. Rows are
 * packed into a heap that starts at {@link PAGE_HEAP_START}; a "row index" of
 * 16-row groups grows backwards from the end of each page.
 */

/** Table type identifiers stored in the file header's table directory. */
export const PageType = {
  Tracks: 0,
  Genres: 1,
  Artists: 2,
  Albums: 3,
  Labels: 4,
  Keys: 5,
  Colors: 6,
  PlaylistTree: 7,
  PlaylistEntries: 8,
  Artwork: 13,
  Columns: 16,
  History: 19
} as const

export type PageTypeValue = (typeof PageType)[keyof typeof PageType]

// ---- File header layout ----
export const FILE_HDR_LEN_PAGE = 0x04
export const FILE_HDR_NUM_TABLES = 0x08
export const FILE_HDR_NEXT_UNUSED_PAGE = 0x0c
export const FILE_HDR_SEQUENCE = 0x14
export const FILE_HDR_TABLES_START = 0x1c
export const TABLE_ENTRY_SIZE = 16
// within a table entry:
export const TABLE_ENTRY_TYPE = 0x00
export const TABLE_ENTRY_EMPTY_CANDIDATE = 0x04
export const TABLE_ENTRY_FIRST_PAGE = 0x08
export const TABLE_ENTRY_LAST_PAGE = 0x0c

// ---- Page header layout ----
export const PAGE_HDR_PAGE_INDEX = 0x04
export const PAGE_HDR_TYPE = 0x08
export const PAGE_HDR_NEXT_PAGE = 0x0c
export const PAGE_HDR_SEQUENCE = 0x10
export const PAGE_HDR_ROW_COUNTS = 0x18 // u32: bits 0-12 num_row_offsets, bits 13-23 num_rows
export const PAGE_HDR_FLAGS = 0x1b
export const PAGE_HDR_FREE_SIZE = 0x1c
export const PAGE_HDR_USED_SIZE = 0x1e
/** Row heap begins here (after the 0x28-byte page header). */
export const PAGE_HEAP_START = 0x28

/** page_flags bit 6 (0x40) marks an index page; data pages have it clear. */
export const PAGE_FLAG_INDEX = 0x40
export const PAGE_FLAG_DATA_DEFAULT = 0x24

// ---- Row group layout (at end of page, built backwards) ----
export const ROW_GROUP_SIZE = 36 // 16 offsets (u16) + presence flags (u16) + unknown (u16)
export const ROWS_PER_GROUP = 16
export const ROW_GROUP_PRESENCE_OFFSET = 32 // within the 36-byte group block

// ---- Track row fixed-field offsets ----
export const TRACK_SUBTYPE = 0x24 // 16-bit string offsets
export const TRACK_OFS = {
  subtype: 0x00,
  indexShift: 0x02,
  bitmask: 0x04,
  sampleRate: 0x08,
  composerId: 0x0c,
  fileSize: 0x10,
  artworkId: 0x1c,
  keyId: 0x20,
  origArtistId: 0x24,
  labelId: 0x28,
  remixerId: 0x2c,
  bitrate: 0x30,
  trackNumber: 0x34,
  tempo: 0x38,
  genreId: 0x3c,
  albumId: 0x40,
  artistId: 0x44,
  id: 0x48,
  discNumber: 0x4c,
  playCount: 0x4e,
  year: 0x50,
  sampleDepth: 0x52,
  duration: 0x54,
  colorId: 0x58,
  rating: 0x59,
  strOffsets: 0x5e // 21 u16 string offsets follow
} as const
export const TRACK_NUM_STRINGS = 21
export const TRACK_FIXED_SIZE = 0x5e + TRACK_NUM_STRINGS * 2 // 0x88

/** Indices into the 21 track string-offset slots that we populate. */
export const TRACK_STR = {
  isrc: 0,
  dateAdded: 10,
  releaseDate: 11,
  mixName: 12,
  analyzePath: 14,
  analyzeDate: 15,
  comment: 16,
  title: 17,
  filename: 19,
  filePath: 20
} as const
