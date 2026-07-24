/**
 * Encoding and decoding of DeviceSQL strings as used in `export.pdb`.
 *
 * Three on-disk forms (all length-prefixed, verified against real data):
 *  - Short:      byte0 is odd; `fieldLen = byte0 >> 1` counts the whole field
 *                (incl. the length byte); text is latin1, `fieldLen - 1` bytes.
 *                Umlauts (e.g. "Lässig") are stored as latin1 in short strings.
 *  - Long ASCII: byte0 = 0x40; u16 `fieldLen` at +1 counts the whole field
 *                (header is 4 bytes: marker, u16 len, pad); text at +4.
 *  - Long UTF16: byte0 = 0x90; same 4-byte header; text is UTF-16LE at +4.
 *                (Rekordbox also uses 0x90 with a 0x03 prefix for ISRC codes;
 *                that special case is handled on decode.)
 */

const SHORT_MAX_TEXT = 126 // fieldLen max 127 -> text length max 126

export interface DecodedString {
  text: string
  /** Total number of bytes this string occupies on disk. */
  byteLength: number
}

/** Decodes a DeviceSQL string starting at `pos` in `buf`. */
export function decodeDeviceSqlString(buf: Buffer, pos: number): DecodedString {
  const lk = buf.readUInt8(pos)

  // Short latin1 string (odd marker byte).
  if ((lk & 0x01) === 0x01) {
    const fieldLen = lk >> 1
    if (fieldLen < 1) return { text: '', byteLength: 1 }
    const text = buf.toString('latin1', pos + 1, pos + fieldLen)
    return { text, byteLength: fieldLen }
  }

  // Long ASCII.
  if (lk === 0x40) {
    const fieldLen = buf.readUInt16LE(pos + 1)
    const text = buf.toString('latin1', pos + 4, pos + fieldLen)
    return { text, byteLength: fieldLen }
  }

  // Long UTF-16LE (with rekordbox's 0x03-prefixed-ASCII special case, e.g. ISRC).
  if (lk === 0x90) {
    const fieldLen = buf.readUInt16LE(pos + 1)
    if (buf.readUInt8(pos + 4) === 0x03) {
      // ASCII payload prefixed by 0x03 and null-terminated.
      let end = pos + 5
      const limit = pos + fieldLen
      while (end < limit && buf.readUInt8(end) !== 0x00) end++
      return { text: buf.toString('latin1', pos + 5, end), byteLength: fieldLen }
    }
    const text = buf.toString('utf16le', pos + 4, pos + fieldLen)
    return { text, byteLength: fieldLen }
  }

  // Unknown marker: consume a single byte defensively.
  return { text: '', byteLength: 1 }
}

/** Encodes a string into its most compact valid DeviceSQL on-disk form. */
export function encodeDeviceSqlString(value: string): Buffer {
  const str = value ?? ''

  // Any code point above latin1 range requires UTF-16.
  let needsUtf16 = false
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 0xff) {
      needsUtf16 = true
      break
    }
  }

  if (needsUtf16) {
    const data = Buffer.from(str, 'utf16le')
    const fieldLen = data.length + 4
    const head = Buffer.alloc(4)
    head.writeUInt8(0x90, 0)
    head.writeUInt16LE(fieldLen, 1)
    head.writeUInt8(0x00, 3)
    return Buffer.concat([head, data])
  }

  // latin1 short form when it fits.
  if (str.length <= SHORT_MAX_TEXT) {
    const fieldLen = str.length + 1
    const out = Buffer.alloc(fieldLen)
    out.writeUInt8((fieldLen << 1) | 0x01, 0)
    out.write(str, 1, 'latin1')
    return out
  }

  // latin1 long form.
  const data = Buffer.from(str, 'latin1')
  const fieldLen = data.length + 4
  const head = Buffer.alloc(4)
  head.writeUInt8(0x40, 0)
  head.writeUInt16LE(fieldLen, 1)
  head.writeUInt8(0x00, 3)
  return Buffer.concat([head, data])
}
