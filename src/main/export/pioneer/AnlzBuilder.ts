import { writeFile } from 'fs/promises'
import { dirname } from 'path'
import { mkdirSync, existsSync } from 'fs'

/**
 * AnlzBuilder builds Pioneer-compatible binary files (like ANLZ dat files) using BigEndian encoding.
 * It manages a dynamic buffer internally that grows as needed, preventing buffer overflows.
 */
export class AnlzBuilder {
  private buffer: Buffer
  private offset: number

  /**
   * Initializes a new AnlzBuilder with an optional starting capacity.
   * @param initialCapacity Starting size of the internal buffer in bytes (default 1024).
   */
  constructor(initialCapacity = 1024) {
    this.buffer = Buffer.alloc(initialCapacity)
    this.offset = 0
  }

  /**
   * Defensive capacity checker. Doubles the buffer size until it can fit the needed capacity.
   */
  private ensureCapacity(bytesNeeded: number): void {
    const needed = this.offset + bytesNeeded
    if (needed > this.buffer.length) {
      let newCapacity = this.buffer.length * 2
      while (newCapacity < needed) {
        newCapacity *= 2
      }
      const newBuffer = Buffer.alloc(newCapacity)
      this.buffer.copy(newBuffer, 0, 0, this.offset)
      this.buffer = newBuffer
    }
  }

  /**
   * Writes an ASCII string to the buffer.
   * If a length is provided, the string will be padded with null bytes (0x00) to match that length,
   * or truncated if it exceeds it.
   *
   * @param str The string to write.
   * @param length Optional fixed length in bytes.
   */
  public writeString(str: string, length?: number): void {
    if (length !== undefined) {
      this.ensureCapacity(length)
      const bytesWritten = this.buffer.write(str, this.offset, length, 'ascii')
      if (bytesWritten < length) {
        // Zero-pad the remaining space
        this.buffer.fill(0, this.offset + bytesWritten, this.offset + length)
      }
      this.offset += length
    } else {
      const byteLength = Buffer.byteLength(str, 'ascii')
      this.ensureCapacity(byteLength)
      this.buffer.write(str, this.offset, byteLength, 'ascii')
      this.offset += byteLength
    }
  }

  /**
   * Writes an 8-bit unsigned integer (byte) to the buffer.
   * @param val Value to write (clamped to 0-255).
   */
  public writeUInt8(val: number): void {
    this.ensureCapacity(1)
    const clampedVal = Math.max(0, Math.min(255, Math.floor(val)))
    this.buffer.writeUInt8(clampedVal, this.offset)
    this.offset += 1
  }

  /**
   * Writes a 16-bit unsigned integer in BigEndian format.
   * @param val Value to write (clamped to 0-65535).
   */
  public writeUInt16(val: number): void {
    this.ensureCapacity(2)
    const clampedVal = Math.max(0, Math.min(65535, Math.floor(val)))
    this.buffer.writeUInt16BE(clampedVal, this.offset)
    this.offset += 2
  }

  /**
   * Writes a 32-bit unsigned integer in BigEndian format.
   * @param val Value to write (clamped to 0-4294967295).
   */
  public writeUInt32(val: number): void {
    this.ensureCapacity(4)
    const clampedVal = Math.max(0, Math.min(4294967295, Math.floor(val)))
    this.buffer.writeUInt32BE(clampedVal, this.offset)
    this.offset += 4
  }

  /**
   * Overwrites a 32-bit unsigned integer in BigEndian format at a specific offset.
   * Helpful for updating headers or block lengths retroactively.
   *
   * @param targetOffset The buffer offset to overwrite.
   * @param val Value to write (clamped to 0-4294967295).
   */
  public setUInt32(targetOffset: number, val: number): void {
    if (targetOffset < 0 || targetOffset + 4 > this.offset) {
      throw new RangeError(
        `Target offset ${targetOffset} is out of bounds (current length: ${this.offset})`
      )
    }
    const clampedVal = Math.max(0, Math.min(4294967295, Math.floor(val)))
    this.buffer.writeUInt32BE(clampedVal, targetOffset)
  }

  /**
   * Appends an existing Buffer to the builder.
   * @param buf Buffer to append.
   */
  public writeBuffer(buf: Buffer): void {
    const len = buf.length
    this.ensureCapacity(len)
    buf.copy(this.buffer, this.offset, 0, len)
    this.offset += len
  }

  /**
   * Returns the current byte offset (size of written data).
   */
  public getOffset(): number {
    return this.offset
  }

  /**
   * Clones and returns the written segment of the internal buffer.
   * The copy prevents memory leaks that would occur if the caller held onto a sliced view
   * of the larger internal backing buffer.
   */
  public build(): Buffer {
    const finalBuf = Buffer.alloc(this.offset)
    this.buffer.copy(finalBuf, 0, 0, this.offset)
    return finalBuf
  }

  /**
   * Asynchronously writes the packaged buffer to a file.
   * Ensures the target directory exists before writing.
   *
   * @param targetPath The destination absolute file path.
   */
  public async saveToFile(targetPath: string): Promise<void> {
    const dir = dirname(targetPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    const data = this.build()
    await writeFile(targetPath, data)
  }
}

/**
 * Writes the PMAI file header shared by every ANLZ file: magic, a fixed
 * 0x1C-byte header length, a size-placeholder for the total file length
 * (patched by {@link patchFileLength} once the file is complete), and the
 * zero-padding needed to reach the header length.
 *
 * Layout verified against Deep Symmetry's crate-digger `rekordbox_anlz.ksy`:
 * the header has *two* length fields (header length, then file length) —
 * a single merged field here would misalign every tag a real player reads.
 */
function writePmaiHeader(b: AnlzBuilder): void {
  b.writeString('PMAI', 4)
  b.writeUInt32(0x1c) // len_header: fixed size of this header
  b.writeUInt32(0) // len_file: placeholder, patched below
  for (let k = 0; k < 16; k++) b.writeUInt8(0) // pad up to len_header (0x1c = 28 bytes)
}

function patchFileLength(b: AnlzBuilder): void {
  b.setUInt32(8, b.getOffset()) // len_file, at offset 8 (len_header at offset 4 stays 0x1c)
}

/** A single beat grid entry, as stored in a Pioneer `PQTZ` (beat grid) tag. */
export interface BeatGridEntry {
  /** Position of this beat within its musical bar; 1 is the down beat. Cycles 1-4. */
  beatNumber: number
  /** Tempo at this beat, in BPM * 100. */
  tempo: number
  /** Position of this beat in the track, in milliseconds, at 100% pitch. */
  timeMs: number
}

/**
 * Writes a `PQTZ` (beat grid) tag: a fixed 12-byte body header (two unknown
 * u32s — the second is a constant observed as 0x80000 — plus a beat count)
 * followed by one 8-byte entry per beat (beat_number:u2, tempo:u2, time:u4).
 */
function writeBeatGridTag(b: AnlzBuilder, beats: BeatGridEntry[]): void {
  b.writeString('PQTZ', 4)
  b.writeUInt32(0x18) // tag len_header: fourcc+len_header+len_tag+2 unknown u4s+num_beats
  b.writeUInt32(0x18 + beats.length * 8) // tag len_tag: header + 8 bytes/beat
  b.writeUInt32(0) // unknown
  b.writeUInt32(0x80000) // unknown (observed constant per spec)
  b.writeUInt32(beats.length) // num_beats
  for (const beat of beats) {
    b.writeUInt16(beat.beatNumber)
    b.writeUInt16(beat.tempo)
    b.writeUInt32(Math.round(beat.timeMs))
  }
}

/**
 * Builds a standard `ANLZ0000.DAT` file: a PMAI header, an optional `PQTZ`
 * (beat grid) tag, and a `PWAV` (wave_preview) tag — the low-resolution
 * waveform shown above the touch strip, supported by every Pioneer player.
 *
 * Each waveform entry byte packs height in bits 0-4 (0-31) and "whiteness"
 * in bits 5-7; `heights` values must already be in 0-31 and are written
 * with whiteness left at 0. `beats` is omitted (no `PQTZ` tag written) when
 * empty — e.g. the track has no reliable BPM/grid-phase analysis yet.
 */
export function buildWavePreviewDat(heights: number[], beats: BeatGridEntry[] = []): Buffer {
  const b = new AnlzBuilder(64 + heights.length + beats.length * 8)
  writePmaiHeader(b)

  if (beats.length > 0) writeBeatGridTag(b, beats)

  b.writeString('PWAV', 4)
  b.writeUInt32(0x14) // tag len_header: fourcc+len_header+len_tag+len_data+reserved
  b.writeUInt32(0x14 + heights.length) // tag len_tag: header + data
  b.writeUInt32(heights.length) // len_data
  b.writeUInt32(0x10000) // reserved (observed constant per spec)
  for (const h of heights) b.writeUInt8(h)

  patchFileLength(b)
  return b.build()
}

/**
 * Builds a standard `ANLZ0000.EXT` file: a PMAI header followed by a single
 * `PWV3` (wave_scroll) tag — the higher-resolution waveform that scrolls as
 * the track plays.
 *
 * Same per-byte height/whiteness packing as {@link buildWavePreviewDat}.
 */
export function buildWaveScrollExt(heights: number[]): Buffer {
  const b = new AnlzBuilder(64 + heights.length)
  writePmaiHeader(b)

  b.writeString('PWV3', 4)
  b.writeUInt32(0x18) // tag len_header: fourcc+len_header+len_tag+len_entry_bytes+len_entries+reserved
  b.writeUInt32(0x18 + heights.length) // tag len_tag: header + (len_entry_bytes=1) * entries
  b.writeUInt32(1) // len_entry_bytes
  b.writeUInt32(heights.length) // len_entries
  b.writeUInt32(0x960000) // reserved (observed constant per spec)
  for (const h of heights) b.writeUInt8(h)

  patchFileLength(b)
  return b.build()
}
