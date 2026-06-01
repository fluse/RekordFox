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
