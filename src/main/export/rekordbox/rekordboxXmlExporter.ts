import { writeFileSync, existsSync } from 'fs'

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

function filePathToLocation(filepath: string): string {
  let normalizedPath = filepath.replace(/\\/g, '/')
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath
  }
  const parts = normalizedPath.split('/')
  const encodedParts = parts.map((part, idx) => {
    if (idx === 1 && /^[a-zA-Z]:$/.test(part)) {
      return part
    }
    return encodeURIComponent(part)
  })
  return `file://localhost${encodedParts.join('/')}`
}

export function generateRekordboxXml(playlists: any[], tracks: any[]): string {
  const validTracks = tracks.filter((t) => t.filepath && existsSync(t.filepath))

  const trackIdMap = new Map<string, number>()
  let currentId = 1
  for (const track of validTracks) {
    trackIdMap.set(track.id, currentId++)
  }

  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8" ?>')
  lines.push('<DJ_PLAYLISTS Version="1.0.0">')
  lines.push('  <PRODUCT Name="rekordfox" Version="1.0.0" Company="RekordFox" />')

  lines.push(`  <COLLECTION Entries="${validTracks.length}">`)

  const todayStr = new Date().toISOString().split('T')[0]

  for (const track of validTracks) {
    const numericId = trackIdMap.get(track.id)!
    const name = escapeXml(track.title || 'Unknown Title')
    const artist = escapeXml(track.artist || 'Unknown Artist')
    const size = track.filesize || 0
    const duration = track.duration || 0
    const bpm = track.bpm ? track.bpm.toFixed(2) : '0.00'
    const key = escapeXml(track.key || '')
    const location = escapeXml(filePathToLocation(track.filepath))
    const bitrate = track.bitrate || 320
    const rating = track.rating || 0
    const kind = track.filepath.toLowerCase().endsWith('.wav') ? 'WAV File' : 'MP3 File'

    lines.push(
      `    <TRACK TrackID="${numericId}" Name="${name}" Artist="${artist}" Kind="${kind}" Size="${size}" TotalTime="${duration}" AverageBpm="${bpm}" Tonality="${key}" DateAdded="${todayStr}" BitRate="${bitrate}" SampleRate="44100" Rating="${rating}" Location="${location}" />`
    )
  }

  lines.push('  </COLLECTION>')

  lines.push('  <PLAYLISTS>')
  lines.push('    <NODE Name="ROOT" Type="0">')

  for (const playlist of playlists) {
    const playlistTracks = tracks.filter(
      (t) => t.playlistId === playlist.id && t.filepath && existsSync(t.filepath)
    )
    if (playlistTracks.length === 0) continue

    const playlistName = escapeXml(playlist.title)
    lines.push(`      <NODE Name="${playlistName}" Type="1">`)

    const sortedTracks = [...playlistTracks].sort((a, b) => {
      const posA = a.position !== undefined ? a.position : 999999
      const posB = b.position !== undefined ? b.position : 999999
      return posA - posB
    })

    for (const track of sortedTracks) {
      const numericId = trackIdMap.get(track.id)
      if (numericId !== undefined) {
        lines.push(`        <TRACK Key="TrackID" Value="${numericId}" />`)
      }
    }

    lines.push('      </NODE>')
  }

  lines.push('    </NODE>')
  lines.push('  </PLAYLISTS>')
  lines.push('</DJ_PLAYLISTS>')

  return lines.join('\n')
}

export function writeRekordboxXml(targetPath: string, playlists: any[], tracks: any[]): void {
  const xmlContent = generateRekordboxXml(playlists, tracks)
  writeFileSync(targetPath, xmlContent, 'utf-8')
}
