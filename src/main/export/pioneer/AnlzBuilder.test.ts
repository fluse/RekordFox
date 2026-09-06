import { describe, expect, it } from 'vitest'
import { buildWavePreviewDat, buildWaveScrollExt } from './AnlzBuilder'

/**
 * Byte-layout assertions here are checked against Deep Symmetry's crate-digger
 * `rekordbox_anlz.ksy` (the authoritative reverse-engineered ANLZ spec):
 * https://github.com/Deep-Symmetry/crate-digger/blob/main/src/main/kaitai/rekordbox_anlz.ksy
 *
 * The file header has *two* length fields (header length, then file length),
 * and each tag has its own two length fields (tag-header length, then whole-
 * tag length) before its type-specific fields. A previous implementation
 * collapsed each pair into a single field, which every strict ANLZ parser
 * (including a real CDJ) reads as a corrupt file.
 */

function readPmaiHeader(buf: Buffer): { lenHeader: number; lenFile: number } {
  expect(buf.toString('ascii', 0, 4)).toBe('PMAI')
  return { lenHeader: buf.readUInt32BE(4), lenFile: buf.readUInt32BE(8) }
}

describe('buildWavePreviewDat', () => {
  it('writes a spec-correct PMAI header and PWAV tag', () => {
    const heights = [0, 5, 31, 16]
    const buf = buildWavePreviewDat(heights)

    const { lenHeader, lenFile } = readPmaiHeader(buf)
    expect(lenHeader).toBe(0x1c)
    expect(lenFile).toBe(buf.length)

    const tagStart = lenHeader
    expect(buf.toString('ascii', tagStart, tagStart + 4)).toBe('PWAV')
    const tagLenHeader = buf.readUInt32BE(tagStart + 4)
    const tagLenTag = buf.readUInt32BE(tagStart + 8)
    expect(tagLenHeader).toBe(0x14)
    expect(tagLenTag).toBe(0x14 + heights.length)
    expect(buf.length).toBe(tagStart + tagLenTag)

    const lenData = buf.readUInt32BE(tagStart + 12)
    expect(lenData).toBe(heights.length)

    const dataStart = tagStart + tagLenHeader
    const data = [...buf.subarray(dataStart, dataStart + heights.length)]
    expect(data).toEqual(heights)
  })

  it('round-trips height values into the low 5 bits with whiteness left at 0', () => {
    const buf = buildWavePreviewDat([31])
    const byte = buf[buf.length - 1]
    expect(byte & 0x1f).toBe(31)
    expect(byte >> 5).toBe(0)
  })
})

describe('buildWavePreviewDat with a beat grid', () => {
  it('omits the PQTZ tag entirely when no beats are given (default)', () => {
    const buf = buildWavePreviewDat([1, 2, 3])
    const { lenHeader } = readPmaiHeader(buf)
    // The PWAV tag must immediately follow the file header, unchanged from
    // the no-beat-grid case.
    expect(buf.toString('ascii', lenHeader, lenHeader + 4)).toBe('PWAV')
  })

  it('writes a spec-correct PQTZ tag before the PWAV tag when beats are given', () => {
    const heights = [10, 20]
    const beats = [
      { beatNumber: 1, tempo: 12800, timeMs: 0 },
      { beatNumber: 2, tempo: 12800, timeMs: 469 },
      { beatNumber: 3, tempo: 12800, timeMs: 938 }
    ]
    const buf = buildWavePreviewDat(heights, beats)

    const { lenHeader, lenFile } = readPmaiHeader(buf)
    expect(lenFile).toBe(buf.length)

    const tagStart = lenHeader
    expect(buf.toString('ascii', tagStart, tagStart + 4)).toBe('PQTZ')
    const tagLenHeader = buf.readUInt32BE(tagStart + 4)
    const tagLenTag = buf.readUInt32BE(tagStart + 8)
    expect(tagLenHeader).toBe(0x18)
    expect(tagLenTag).toBe(0x18 + beats.length * 8)

    const numBeats = buf.readUInt32BE(tagStart + 20)
    expect(numBeats).toBe(beats.length)

    const entriesStart = tagStart + tagLenHeader
    for (let i = 0; i < beats.length; i++) {
      const off = entriesStart + i * 8
      expect(buf.readUInt16BE(off)).toBe(beats[i].beatNumber)
      expect(buf.readUInt16BE(off + 2)).toBe(beats[i].tempo)
      expect(buf.readUInt32BE(off + 4)).toBe(beats[i].timeMs)
    }

    // The PWAV tag must directly follow the PQTZ tag.
    const pwavStart = tagStart + tagLenTag
    expect(buf.toString('ascii', pwavStart, pwavStart + 4)).toBe('PWAV')
    expect(buf.length).toBe(pwavStart + 0x14 + heights.length)
  })
})

describe('buildWaveScrollExt', () => {
  it('writes a spec-correct PMAI header and PWV3 tag', () => {
    const heights = [1, 2, 3, 4, 5, 6, 7]
    const buf = buildWaveScrollExt(heights)

    const { lenHeader, lenFile } = readPmaiHeader(buf)
    expect(lenHeader).toBe(0x1c)
    expect(lenFile).toBe(buf.length)

    const tagStart = lenHeader
    expect(buf.toString('ascii', tagStart, tagStart + 4)).toBe('PWV3')
    const tagLenHeader = buf.readUInt32BE(tagStart + 4)
    const tagLenTag = buf.readUInt32BE(tagStart + 8)
    expect(tagLenHeader).toBe(0x18)
    expect(tagLenTag).toBe(0x18 + heights.length)
    expect(buf.length).toBe(tagStart + tagLenTag)

    const lenEntryBytes = buf.readUInt32BE(tagStart + 12)
    const lenEntries = buf.readUInt32BE(tagStart + 16)
    expect(lenEntryBytes).toBe(1)
    expect(lenEntries).toBe(heights.length)

    const dataStart = tagStart + tagLenHeader
    const data = [...buf.subarray(dataStart, dataStart + heights.length)]
    expect(data).toEqual(heights)
  })
})
