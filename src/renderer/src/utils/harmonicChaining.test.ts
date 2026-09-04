import type { Track } from '@main/db'
import { describe, expect, it } from 'vitest'
import { buildHarmonicChain, isTrackPlayable } from './harmonicChaining'

let nextId = 0

function makeTrack(overrides: Partial<Track>): Track {
  nextId += 1
  return {
    id: `track-${nextId}`,
    playlistId: 'playlist-1',
    title: `Track ${nextId}`,
    artist: 'Artist',
    bpm: 120,
    key: '8A',
    duration: 200,
    filepath: `/music/track-${nextId}.mp3`,
    coverPath: '',
    filesize: 1000,
    format: 'MP3',
    rating: 0,
    ...overrides
  }
}

describe('isTrackPlayable', () => {
  it('is true for a downloaded track with no failed download', () => {
    expect(isTrackPlayable(makeTrack({ filepath: '/music/a.mp3' }))).toBe(true)
  })

  it('is false without a local filepath', () => {
    expect(isTrackPlayable(makeTrack({ filepath: '' }))).toBe(false)
  })

  it('is false once download has permanently failed', () => {
    expect(isTrackPlayable(makeTrack({ filepath: '/music/a.mp3', downloadFailed: true }))).toBe(
      false
    )
  })
})

describe('buildHarmonicChain', () => {
  it('prefers a perfect key/BPM match over a harmonically incompatible track', () => {
    const start = makeTrack({ key: '8A', bpm: 120 })
    const perfectMatch = makeTrack({ key: '8A', bpm: 121 })
    const incompatible = makeTrack({ key: '5A', bpm: 120 })

    const chain = buildHarmonicChain(start, [perfectMatch, incompatible])

    expect(chain[0]).toBe(perfectMatch)
  })

  it('excludes tracks that are not locally playable', () => {
    const start = makeTrack({ key: '8A', bpm: 120 })
    const notDownloaded = makeTrack({ key: '8A', bpm: 120, filepath: '' })

    const chain = buildHarmonicChain(start, [notDownloaded])

    expect(chain).toHaveLength(0)
  })

  it('never returns more tracks than maxTracks', () => {
    const start = makeTrack({ key: '8A', bpm: 120 })
    const pool = Array.from({ length: 10 }, () => makeTrack({ key: '8A', bpm: 120 }))

    const chain = buildHarmonicChain(start, pool, { maxTracks: 3 })

    expect(chain).toHaveLength(3)
  })
})
