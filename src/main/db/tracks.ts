import { copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import nodeId3 from 'node-id3'
import { dbData, getCoversDir, getDownloadsDir, saveDb } from './store'
import { getPlaylistFolderName, getTrackFilename } from './filenameUtils'
import { markPlaylistDirty } from './playlists'
import { getSettings } from './settings'
import type { FilepathChange, Track } from './types'

export function getTracks(): Track[] {
  return dbData.tracks
}

export function getTracksForPlaylist(playlistId: string): Track[] {
  return dbData.tracks
    .filter((t) => t.playlistId === playlistId)
    .sort((a, b) => {
      const posA = a.position !== undefined ? a.position : 999999
      const posB = b.position !== undefined ? b.position : 999999
      return posA - posB
    })
}

// Attaches the remote playlistItem ID a track needs for reorder push-back, once its parent
// playlist has been confirmed to belong to the connected account.
export function linkTrackToYoutubePlaylistItem(
  trackId: string,
  playlistId: string,
  youtubePlaylistItemId: string
): void {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    track.source = 'youtube-oauth'
    track.youtubePlaylistItemId = youtubePlaylistItemId
    saveDb()
  }
}

export function addTrack(track: Track): void {
  const index = dbData.tracks.findIndex(
    (t) => t.id === track.id && t.playlistId === track.playlistId
  )
  if (index !== -1) {
    const existing = dbData.tracks[index]
    dbData.tracks[index] = {
      ...track,
      position: track.position !== undefined ? track.position : existing.position,
      dateAdded: track.dateAdded !== undefined ? track.dateAdded : existing.dateAdded,
      played: track.played !== undefined ? track.played : existing.played,
      // Never drop the YouTube playlistItem link on a plain re-add (e.g. a re-download that
      // rebuilds the track record without carrying it): losing it would make the next push treat
      // an already-present remote item as new and insert a duplicate on the user's real playlist.
      youtubePlaylistItemId:
        track.youtubePlaylistItemId !== undefined
          ? track.youtubePlaylistItemId
          : existing.youtubePlaylistItemId
    }
  } else {
    const playlistTracks = dbData.tracks.filter((t) => t.playlistId === track.playlistId)
    const maxPos = playlistTracks.reduce(
      (max, t) => (t.position !== undefined && t.position > max ? t.position : max),
      0
    )
    dbData.tracks.push({
      ...track,
      position: track.position !== undefined ? track.position : maxPos + 1,
      dateAdded: track.dateAdded || new Date().toISOString(),
      played: track.played !== undefined ? track.played : false
    })
  }
  saveDb()
}

// Copies a track (metadata + physical mp3/cover files) into another playlist, appended at the
// end. Used by the sidebar drag & drop feature — callers must gate this with canDropTrack first.
// Marks the target playlist dirty so a 'youtube-oauth' playlist can push the new membership back
// to YouTube, mirroring updateTrackPositions' handling of local reorders.
export function addTrackToPlaylist(sourceTrackId: string, targetPlaylistId: string): Track | null {
  const sourceTrack = dbData.tracks.find((t) => t.id === sourceTrackId)
  const targetPlaylist = dbData.playlists.find((p) => p.id === targetPlaylistId)
  if (!sourceTrack || !targetPlaylist) return null

  if (dbData.tracks.some((t) => t.id === sourceTrackId && t.playlistId === targetPlaylistId)) {
    return null // already present
  }

  const settings = getSettings()
  const targetFolder = getPlaylistFolderName(targetPlaylist)
  const targetDir = join(getDownloadsDir(), targetFolder)
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  const targetTracks = dbData.tracks.filter((t) => t.playlistId === targetPlaylistId)
  const maxPos = targetTracks.reduce(
    (max, t) => (t.position !== undefined && t.position > max ? t.position : max),
    0
  )
  const newPosition = maxPos + 1

  let newFilepath = ''
  if (sourceTrack.filepath && existsSync(sourceTrack.filepath)) {
    const filename = getTrackFilename(
      targetPlaylistId,
      sourceTrack.id,
      sourceTrack.artist,
      sourceTrack.title,
      newPosition,
      sourceTrack.bpm || 0,
      settings.filenameTemplate || 'custom'
    )
    newFilepath = join(targetDir, filename)
    try {
      copyFileSync(sourceTrack.filepath, newFilepath)
    } catch (e) {
      console.error(`Failed to copy track file ${sourceTrack.id} into target playlist:`, e)
      newFilepath = ''
    }
  }

  let newCoverPath = ''
  if (sourceTrack.coverPath && existsSync(sourceTrack.coverPath)) {
    newCoverPath = join(getCoversDir(), `${targetPlaylistId}_${sourceTrack.id}.jpg`)
    try {
      copyFileSync(sourceTrack.coverPath, newCoverPath)
    } catch (e) {
      console.error(`Failed to copy cover for track ${sourceTrack.id} into target playlist:`, e)
    }
  }

  const newTrack: Track = {
    ...sourceTrack,
    playlistId: targetPlaylistId,
    filepath: newFilepath,
    coverPath: newCoverPath,
    position: newPosition,
    dateAdded: new Date().toISOString(),
    played: false,
    source: undefined,
    youtubePlaylistItemId: undefined
  }
  dbData.tracks.push(newTrack)
  markPlaylistDirty(targetPlaylistId)
  saveDb()
  return newTrack
}

export function updateTrackPositions(playlistId: string, trackIds: string[]): FilepathChange[] {
  const settings = getSettings()
  const playlistTracks = dbData.tracks.filter((t) => t.playlistId === playlistId)
  const changes: FilepathChange[] = []
  let anyPositionChanged = false

  for (const track of playlistTracks) {
    const oldPosition = track.position
    const newIdx = trackIds.indexOf(track.id)
    const newPosition = newIdx !== -1 ? newIdx + 1 : trackIds.length + 1

    if (oldPosition !== newPosition) {
      anyPositionChanged = true
      const oldFilepath = track.filepath
      track.position = newPosition

      if (settings.filenameTemplate === 'custom' && oldFilepath && existsSync(oldFilepath)) {
        try {
          const playlist = dbData.playlists.find((p) => p.id === playlistId)
          const playlistFolder = playlist ? getPlaylistFolderName(playlist) : ''
          const targetDir = playlistFolder
            ? join(getDownloadsDir(), playlistFolder)
            : dirname(oldFilepath)

          if (playlistFolder && !existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true })
          }

          const newFilename = getTrackFilename(
            playlistId,
            track.id,
            track.artist,
            track.title,
            newPosition,
            track.bpm || 0,
            'custom'
          )
          const newFilepath = join(targetDir, newFilename)
          if (oldFilepath !== newFilepath) {
            renameSync(oldFilepath, newFilepath)
            track.filepath = newFilepath
            changes.push({ id: track.id, filepath: newFilepath })
          }
        } catch (err) {
          console.error(`Failed to rename file on position change for track ${track.id}:`, err)
        }
      }
    }
  }
  if (anyPositionChanged) {
    markPlaylistDirty(playlistId)
  }
  saveDb()
  return changes
}

// User-initiated removal of a single track from a playlist. Physically deletes the track's own
// MP3/Cover copy for that playlist and flags an OAuth-backed playlist as dirty so the change
// can be pushed back to YouTube. The sync flows never remove tracks themselves (add-only, so a
// track missing from YouTube is never taken as proof it should be deleted locally) — this is the
// only path that deletes a track today.
export function removeTrackFromPlaylist(trackId: string, playlistId: string): void {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    try {
      if (track.filepath && existsSync(track.filepath)) unlinkSync(track.filepath)
      if (track.coverPath && existsSync(track.coverPath)) unlinkSync(track.coverPath)
    } catch (e) {
      console.error(`Failed to clean up files for removed track ${trackId}:`, e)
    }
  }
  dbData.tracks = dbData.tracks.filter((t) => !(t.id === trackId && t.playlistId === playlistId))
  markPlaylistDirty(playlistId)
  saveDb()
}

export function updateTrackBpm(
  trackId: string,
  playlistId: string,
  bpm: number,
  gridOffset?: number
): FilepathChange | null {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    const oldFilepath = track.filepath
    track.bpm = bpm
    if (gridOffset !== undefined) track.gridOffset = gridOffset
    saveDb()

    // Write BPM to the ID3 tags of the local file
    try {
      const tags = {
        bpm: bpm.toString()
      }
      nodeId3.update(tags, oldFilepath)
    } catch (e) {
      console.error(`Failed to update BPM ID3 tag for track ${trackId}:`, e)
    }

    // Rename file if custom naming template is enabled and path exists
    const settings = getSettings()
    if (settings.filenameTemplate === 'custom' && oldFilepath) {
      try {
        if (existsSync(oldFilepath)) {
          const playlist = dbData.playlists.find((p) => p.id === playlistId)
          const playlistFolder = playlist ? getPlaylistFolderName(playlist) : ''
          const targetDir = playlistFolder
            ? join(getDownloadsDir(), playlistFolder)
            : dirname(oldFilepath)

          if (playlistFolder && !existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true })
          }

          const newFilename = getTrackFilename(
            playlistId,
            trackId,
            track.artist,
            track.title,
            track.position || 0,
            bpm,
            'custom'
          )
          const newFilepath = join(targetDir, newFilename)
          if (oldFilepath !== newFilepath) {
            renameSync(oldFilepath, newFilepath)
            track.filepath = newFilepath
            saveDb()
            return { id: track.id, filepath: newFilepath }
          }
        }
      } catch (err) {
        console.error(`Failed to rename file to update BPM in filename for track ${trackId}:`, err)
      }
    }
  }
  return null
}

export function updateTrackKey(
  trackId: string,
  playlistId: string,
  key: string,
  tkey: string
): void {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    track.key = key
    saveDb()

    // Write key to the ID3 TKEY tag of the local file
    try {
      const tags: Parameters<typeof nodeId3.update>[0] = {}
      if (tkey) tags.initialKey = tkey // TKEY frame
      nodeId3.update(tags, track.filepath)
    } catch (e) {
      console.error(`Failed to update key ID3 tag for track ${trackId}:`, e)
    }
  }
}

export function updateTrackRating(trackId: string, playlistId: string, rating: number): void {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    track.rating = rating
    saveDb()

    // Write POPM frame to ID3 tags (0 to 255 rating)
    try {
      // Star rating POPM mapping
      // 0 -> 0, 1 -> 32, 2 -> 64, 3 -> 128, 4 -> 196, 5 -> 255
      const ratingMap = [0, 32, 64, 128, 196, 255]
      const ratingVal = ratingMap[rating] || 0

      const tags = {
        popularimeter: {
          email: 'no@email',
          rating: ratingVal,
          counter: 0
        }
      }
      nodeId3.update(tags, track.filepath)
    } catch (e) {
      console.error(`Failed to update Rating ID3 tag for track ${trackId}:`, e)
    }
  }
}

export function updateTrackPlayed(trackId: string, playlistId: string, played: boolean): void {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    track.played = played
    saveDb()
  }
}

export function recordTrackDownloadFailure(trackId: string, playlistId: string): void {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    track.downloadFailed = true
    track.downloadAttempts = (track.downloadAttempts ?? 0) + 1
    saveDb()
  }
}

export function recordTrackDownloadSuccess(trackId: string, playlistId: string): void {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    track.downloadFailed = false
    track.downloadAttempts = 0
    saveDb()
  }
}
