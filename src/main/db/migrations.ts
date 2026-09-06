import { existsSync, mkdirSync, readFileSync, renameSync, statSync } from 'fs'
import { basename, dirname, join } from 'path'
import nodeId3 from 'node-id3'
import type { Playlist, Track } from './types'
import { getPlaylistFolderName } from './filenameUtils'

// Every playlist created before source management existed was added via a public URL scrape
// (yt-dlp), so it becomes 'local' by definition. Returns whether anything changed.
export function migrateLegacyPlaylistSource(playlists: Playlist[]): boolean {
  let updated = false
  for (const playlist of playlists) {
    if (!playlist.source) {
      playlist.source = 'local'
      updated = true
    }
  }
  return updated
}

// Assign position sequences to existing tracks if they don't have them.
export function assignTrackPositions(tracks: Track[]): boolean {
  let updated = false
  const playlistTrackGroups: Record<string, Track[]> = {}
  for (const track of tracks) {
    if (!playlistTrackGroups[track.playlistId]) {
      playlistTrackGroups[track.playlistId] = []
    }
    playlistTrackGroups[track.playlistId].push(track)
  }

  for (const playlistId in playlistTrackGroups) {
    const group = playlistTrackGroups[playlistId]
    let posCounter = 1
    for (const track of group) {
      if (track.position === undefined) {
        track.position = posCounter
        updated = true
      }
      posCounter++
    }
  }
  return updated
}

// Self-healing subfolders migration: move files from root downloads dir (or anywhere incorrect)
// into correct playlist subfolders.
export function migrateTrackSubfolders(
  tracks: Track[],
  playlists: Playlist[],
  downloadsDir: string
): boolean {
  let updated = false
  for (const track of tracks) {
    if (track.filepath && existsSync(track.filepath)) {
      if (statSync(track.filepath).isDirectory()) {
        // A past migrateDownloadsFolder bug could set a still-downloading track's filepath
        // to its playlist's own folder (basename('') is '' so the "file" path collapsed to
        // the directory). Clear it so the track is treated as missing its file rather than
        // attempting to rename a directory into a subdirectory of itself (EINVAL) on every
        // startup.
        track.filepath = ''
        updated = true
        continue
      }
      const playlist = playlists.find((p) => p.id === track.playlistId)
      if (playlist) {
        const expectedDir = join(downloadsDir, getPlaylistFolderName(playlist))
        const actualDir = dirname(track.filepath)

        if (actualDir !== expectedDir) {
          try {
            if (!existsSync(expectedDir)) {
              mkdirSync(expectedDir, { recursive: true })
            }
            const targetPath = join(expectedDir, basename(track.filepath))
            renameSync(track.filepath, targetPath)
            track.filepath = targetPath
            updated = true
          } catch (e) {
            console.error(
              `Failed to self-heal/move track file ${track.id} to playlist subdirectory:`,
              e
            )
          }
        }
      }
    }
  }
  return updated
}

// Self-healing database: ensure all tracks have filesize, format, rating, bitrate, etc.
export function healTrackMetadata(tracks: Track[]): boolean {
  let updated = false
  for (const track of tracks) {
    let trackUpdated = false
    if (track.filesize === undefined || track.filesize === 0) {
      try {
        if (existsSync(track.filepath)) {
          track.filesize = statSync(track.filepath).size
          trackUpdated = true
        }
      } catch (e) {
        console.error(`Failed to get size for ${track.filepath}:`, e)
      }
    }
    if (track.format === undefined) {
      track.format = 'MP3'
      trackUpdated = true
    }
    if (track.rating === undefined) {
      track.rating = 0
      trackUpdated = true
    }
    if (track.key === undefined) {
      track.key = ''
      trackUpdated = true
    }
    if (track.bitrate === undefined || track.bitrate === 0) {
      if (track.filesize && track.duration > 0) {
        track.bitrate = Math.round((track.filesize * 8) / (track.duration * 1000))
      } else {
        track.bitrate = 320
      }
      trackUpdated = true
    }
    if (track.dateAdded === undefined) {
      try {
        if (track.filepath && existsSync(track.filepath)) {
          const stats = statSync(track.filepath)
          track.dateAdded = (stats.birthtime || stats.mtime || new Date()).toISOString()
        } else {
          track.dateAdded = new Date().toISOString()
        }
      } catch {
        track.dateAdded = new Date().toISOString()
      }
      trackUpdated = true
    }
    if (track.played === undefined) {
      track.played = true // default existing tracks to played
      trackUpdated = true
    }
    if (track.downloadFailed === undefined) {
      track.downloadFailed = false
      trackUpdated = true
    }
    if (trackUpdated) {
      updated = true
    }
  }
  return updated
}

// Ensure cover image and BPM are embedded in the MP3 file ID3 tags.
export function embedId3TagsForTracks(tracks: Track[], playlists: Playlist[]): void {
  for (const track of tracks) {
    try {
      if (existsSync(track.filepath)) {
        const currentTags = nodeId3.read(track.filepath)

        // 1. If BPM is in database but missing from ID3 tags, update the tag
        if (track.bpm > 0 && currentTags && !currentTags.bpm) {
          try {
            nodeId3.update({ bpm: Math.round(track.bpm).toString() }, track.filepath)
          } catch (bpmErr) {
            console.error(`Failed to update BPM ID3 tag for track ${track.id}:`, bpmErr)
          }
        }

        // 1b. If the YouTube source URL is missing from ID3 tags, update the tag
        const youtubeUrl = `https://www.youtube.com/watch?v=${track.id}`
        if (currentTags && currentTags.audioSourceUrl !== youtubeUrl) {
          try {
            nodeId3.update({ audioSourceUrl: youtubeUrl }, track.filepath)
          } catch (urlErr) {
            console.error(`Failed to update YouTube URL ID3 tag for track ${track.id}:`, urlErr)
          }
        }

        // 2. If cover image is missing, write the whole set of tags
        if (!currentTags || !currentTags.image) {
          if (existsSync(track.coverPath)) {
            const playlist = playlists.find((p) => p.id === track.playlistId)
            const albumName = playlist ? playlist.title : 'RekordFox'
            const tags = {
              title: track.title,
              artist: track.artist,
              album: albumName,
              bpm: track.bpm > 0 ? Math.round(track.bpm).toString() : undefined,
              audioSourceUrl: youtubeUrl,
              popularimeter:
                track.rating > 0
                  ? {
                      email: 'no@email',
                      rating: [0, 32, 64, 128, 196, 255][track.rating] || 0,
                      counter: 0
                    }
                  : undefined,
              image: {
                mime: 'image/jpeg',
                type: { id: 3, name: 'front cover' },
                description: 'Cover',
                imageBuffer: readFileSync(track.coverPath)
              }
            }
            nodeId3.write(tags, track.filepath)
          }
        }
      }
    } catch (err) {
      console.error(`Failed to embed cover in MP3 for track ${track.id}:`, err)
    }
  }
}
