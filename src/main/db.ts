import { app } from 'electron'
import { join, basename, dirname } from 'path'
import {
  existsSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  copyFileSync,
  unlinkSync,
  statSync,
  renameSync
} from 'fs'
import nodeId3 from 'node-id3'
import { writeRekordboxXml } from './export/rekordbox/rekordboxXmlExporter'

export interface Playlist {
  id: string // YouTube playlist ID
  title: string
  url: string
  syncStatus: 'idle' | 'syncing' | 'error'
  lastSync: string
}

export interface Track {
  id: string // YouTube video ID
  playlistId: string
  title: string
  artist: string
  bpm: number
  key: string // Camelot notation, e.g. "8A", "10B" – empty string if not yet analyzed
  duration: number // in seconds
  filepath: string // absolute local path to MP3
  coverPath: string // absolute local path to Cover image
  filesize: number // size in bytes
  format: string // e.g. "MP3"
  rating: number // 0 to 5 stars
  bitrate?: number // bitrate in kbps
  position?: number
  dateAdded?: string
  played?: boolean
  downloadFailed?: boolean // true if the last download attempt failed; excluded from queue/shuffle relevance
}

export function getPlaylistFolderName(playlist: Playlist): string {
  const cleanTitle = playlist.title.replace(/[\\/:*?"<>|]/g, '').trim() || 'Unknown Playlist'
  const lowercaseUrl = (playlist.url || '').toLowerCase()
  const provider = lowercaseUrl.includes('soundcloud.com') ? 'soundcloud' : 'youtube'
  return `${cleanTitle}-${provider}-${playlist.id}`
}

export interface AppSettings {
  theme: 'dark' | 'light'
  downloadPath: string
  sidebarWidth: number
  maxWorkers: number
  language?: 'de' | 'en' | 'fr' | 'es'
  filenameTemplate?: 'default' | 'custom'
  rekordboxXmlPath?: string
  historyLimit?: number
  appShortcuts?: Record<string, string>
}

interface DatabaseSchema {
  playlists: Playlist[]
  tracks: Track[]
  settings?: AppSettings
}

let dbPath = ''
let defaultDownloadsDir = ''
let coversDir = ''

let dbData: DatabaseSchema = {
  playlists: [],
  tracks: [],
  settings: {
    theme: 'dark',
    downloadPath: '',
    sidebarWidth: 256,
    maxWorkers: 1,
    language: 'de',
    filenameTemplate: 'default',
    historyLimit: 50
  }
}

export function initDb(): void {
  const userData = app.getPath('userData')
  defaultDownloadsDir = join(userData, 'downloads')
  coversDir = join(userData, 'covers')
  dbPath = join(userData, 'db.json')

  // Create directories if they do not exist
  if (!existsSync(defaultDownloadsDir)) {
    mkdirSync(defaultDownloadsDir, { recursive: true })
  }
  if (!existsSync(coversDir)) {
    mkdirSync(coversDir, { recursive: true })
  }

  // Initialize DB file
  if (!existsSync(dbPath)) {
    dbData.settings = {
      theme: 'dark',
      downloadPath: defaultDownloadsDir,
      sidebarWidth: 256,
      maxWorkers: 3,
      language: 'de',
      rekordboxXmlPath: '',
      historyLimit: 50
    }
    saveDb()
  } else {
    try {
      const content = readFileSync(dbPath, 'utf-8')
      dbData = JSON.parse(content)
      // Ensure arrays exist
      if (!dbData.playlists) dbData.playlists = []
      if (!dbData.tracks) dbData.tracks = []

      // Ensure settings exist with defaults
      if (!dbData.settings) {
        dbData.settings = {
          theme: 'dark',
          downloadPath: defaultDownloadsDir,
          sidebarWidth: 256,
          maxWorkers: 3,
          language: 'de',
          filenameTemplate: 'default',
          rekordboxXmlPath: ''
        }
      } else {
        if (!dbData.settings.theme) dbData.settings.theme = 'dark'
        if (!dbData.settings.downloadPath) dbData.settings.downloadPath = defaultDownloadsDir
        if (!dbData.settings.sidebarWidth) dbData.settings.sidebarWidth = 256
        if (!dbData.settings.maxWorkers) dbData.settings.maxWorkers = 3
        if (!dbData.settings.language) dbData.settings.language = 'de'
        if (!dbData.settings.filenameTemplate) dbData.settings.filenameTemplate = 'default'
        if (dbData.settings.rekordboxXmlPath === undefined) dbData.settings.rekordboxXmlPath = ''
      }

      // Self-healing database: Ensure all tracks have filesize, format, rating, and bitrate
      let dbUpdated = false

      // Assign position sequences to existing tracks if they don't have them
      if (dbData.tracks && Array.isArray(dbData.tracks)) {
        const playlistTrackGroups: Record<string, Track[]> = {}
        for (const track of dbData.tracks) {
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
              dbUpdated = true
            }
            posCounter++
          }
        }
      }

      // Self-healing subfolders migration: move files from root downloads dir (or anywhere incorrect) into correct playlist subfolders
      if (dbData.tracks && Array.isArray(dbData.tracks)) {
        for (const track of dbData.tracks) {
          if (track.filepath && existsSync(track.filepath)) {
            const playlist = dbData.playlists.find((p) => p.id === track.playlistId)
            if (playlist) {
              const expectedDir = join(getDownloadsDir(), getPlaylistFolderName(playlist))
              const actualDir = dirname(track.filepath)

              if (actualDir !== expectedDir) {
                try {
                  if (!existsSync(expectedDir)) {
                    mkdirSync(expectedDir, { recursive: true })
                  }
                  const targetPath = join(expectedDir, basename(track.filepath))
                  renameSync(track.filepath, targetPath)
                  track.filepath = targetPath
                  dbUpdated = true
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
      }

      if (dbData.tracks && Array.isArray(dbData.tracks)) {
        for (const track of dbData.tracks) {
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
            dbUpdated = true
          }

          // Ensure cover image and BPM are embedded in the MP3 file ID3 tags
          try {
            if (existsSync(track.filepath)) {
              const currentTags = nodeId3.read(track.filepath)

              // 1. If BPM is in database but missing from ID3 tags, update the tag
              if (track.bpm > 0 && currentTags && !currentTags.bpm) {
                try {
                  nodeId3.update({ bpm: track.bpm.toString() }, track.filepath)
                } catch (bpmErr) {
                  console.error(`Failed to update BPM ID3 tag for track ${track.id}:`, bpmErr)
                }
              }

              // 2. If cover image is missing, write the whole set of tags
              if (!currentTags || !currentTags.image) {
                if (existsSync(track.coverPath)) {
                  const playlist = dbData.playlists.find((p) => p.id === track.playlistId)
                  const albumName = playlist ? playlist.title : 'RekordFox'
                  const tags = {
                    title: track.title,
                    artist: track.artist,
                    album: albumName,
                    bpm: track.bpm > 0 ? track.bpm.toString() : undefined,
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
      if (dbUpdated) {
        saveDb()
      }
    } catch (e) {
      console.error('Error reading database file, recreating:', e)
      dbData.settings = {
        theme: 'dark',
        downloadPath: defaultDownloadsDir,
        sidebarWidth: 256,
        maxWorkers: 3
      }
      saveDb()
    }
  }
}

function saveDb(): void {
  try {
    writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8')
    if (dbData.settings?.rekordboxXmlPath) {
      try {
        writeRekordboxXml(dbData.settings.rekordboxXmlPath, dbData.playlists, dbData.tracks)
      } catch (xmlErr) {
        console.error('Failed to auto-export Rekordbox XML:', xmlErr)
      }
    }
  } catch (e) {
    console.error('Failed to write database file:', e)
  }
}

export function getDownloadsDir(): string {
  return dbData.settings?.downloadPath || defaultDownloadsDir
}

export function getCoversDir(): string {
  return coversDir
}

export function getPlaylists(): Playlist[] {
  return dbData.playlists
}

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

export function addPlaylist(playlist: Playlist): void {
  if (!dbData.playlists.some((p) => p.id === playlist.id)) {
    dbData.playlists.push(playlist)
    saveDb()
  }
}

export function renamePlaylist(playlistId: string, newTitle: string): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  if (playlist) {
    playlist.title = newTitle
    saveDb()
  }
}

export function updatePlaylistStatus(
  playlistId: string,
  status: Playlist['syncStatus'],
  lastSync?: string
): void {
  const playlist = dbData.playlists.find((p) => p.id === playlistId)
  if (playlist) {
    playlist.syncStatus = status
    if (lastSync) {
      playlist.lastSync = lastSync
    }
    saveDb()
  }
}

export function deletePlaylist(playlistId: string): void {
  const tracksToDelete = dbData.tracks.filter((t) => t.playlistId === playlistId)
  dbData.playlists = dbData.playlists.filter((p) => p.id !== playlistId)
  dbData.tracks = dbData.tracks.filter((t) => t.playlistId !== playlistId)
  saveDb()

  // Physically delete track MP3 and Cover files
  for (const track of tracksToDelete) {
    try {
      if (existsSync(track.filepath)) unlinkSync(track.filepath)
      if (existsSync(track.coverPath)) unlinkSync(track.coverPath)
    } catch (e) {
      console.error(`Failed to clean up files for deleted track ${track.id}:`, e)
    }
  }
}

export function addTrack(track: Track): void {
  const index = dbData.tracks.findIndex(
    (t) => t.id === track.id && t.playlistId === track.playlistId
  )
  if (index !== -1) {
    const existingPosition = dbData.tracks[index].position
    const existingDateAdded = dbData.tracks[index].dateAdded
    const existingPlayed = dbData.tracks[index].played
    dbData.tracks[index] = {
      ...track,
      position: track.position !== undefined ? track.position : existingPosition,
      dateAdded: track.dateAdded !== undefined ? track.dateAdded : existingDateAdded,
      played: track.played !== undefined ? track.played : existingPlayed
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

export interface FilepathChange {
  id: string
  filepath: string
}

export function updateTrackPositions(playlistId: string, trackIds: string[]): FilepathChange[] {
  const settings = getSettings()
  const playlistTracks = dbData.tracks.filter((t) => t.playlistId === playlistId)
  const changes: FilepathChange[] = []

  for (const track of playlistTracks) {
    const oldPosition = track.position
    const newIdx = trackIds.indexOf(track.id)
    const newPosition = newIdx !== -1 ? newIdx + 1 : trackIds.length + 1

    if (oldPosition !== newPosition) {
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
  saveDb()
  return changes
}

export function deleteTrack(trackId: string, playlistId: string): void {
  dbData.tracks = dbData.tracks.filter((t) => !(t.id === trackId && t.playlistId === playlistId))
  saveDb()
}

export function updateTrackBpm(
  trackId: string,
  playlistId: string,
  bpm: number
): FilepathChange | null {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    const oldFilepath = track.filepath
    track.bpm = bpm
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

export function updateTrackDownloadFailed(
  trackId: string,
  playlistId: string,
  downloadFailed: boolean
): void {
  const track = dbData.tracks.find((t) => t.id === trackId && t.playlistId === playlistId)
  if (track) {
    track.downloadFailed = downloadFailed
    saveDb()
  }
}

// Settings managers
export function getSettings(): AppSettings {
  return (
    dbData.settings || {
      theme: 'dark',
      downloadPath: defaultDownloadsDir,
      sidebarWidth: 256,
      maxWorkers: 3,
      language: 'de',
      historyLimit: 50
    }
  )
}

function sanitizeForFilename(str: string): string {
  return str
    .replace(/[\\/:*?"<>|]/g, '') // remove invalid filename chars
    .trim()
}

export function getTrackFilename(
  playlistId: string,
  trackId: string,
  artist: string,
  title: string,
  position: number,
  bpm: number,
  template: 'default' | 'custom'
): string {
  if (template === 'custom') {
    const cleanArtist = sanitizeForFilename(artist) || 'Unknown Artist'
    const cleanTitle = sanitizeForFilename(title) || 'Unknown Title'
    const trackPos = position.toString().padStart(2, '0')
    return `${trackPos}-${cleanArtist}-${cleanTitle}-${bpm}bpm-${trackId}.mp3`
  }
  return `${playlistId}_${trackId}.mp3`
}

export function updateSettings(settings: Partial<AppSettings>): void {
  if (dbData.settings) {
    dbData.settings = { ...dbData.settings, ...settings }
    saveDb()
  }
}

export async function renameAllTracksFilenameAsync(
  newTemplate: 'default' | 'custom',
  onProgress: (current: number, total: number) => void
): Promise<void> {
  const tracksToRename = dbData.tracks.filter((t) => t.filepath && existsSync(t.filepath))
  const total = tracksToRename.length

  if (total === 0) {
    onProgress(0, 0)
    return
  }

  let current = 0
  for (const track of tracksToRename) {
    try {
      const playlist = dbData.playlists.find((p) => p.id === track.playlistId)
      const playlistFolder = playlist ? getPlaylistFolderName(playlist) : ''
      const targetDir = playlistFolder
        ? join(getDownloadsDir(), playlistFolder)
        : dirname(track.filepath)

      if (playlistFolder && !existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      const newFilename = getTrackFilename(
        track.playlistId,
        track.id,
        track.artist,
        track.title,
        track.position || 0,
        track.bpm || 0,
        newTemplate
      )
      const newFilepath = join(targetDir, newFilename)
      if (track.filepath !== newFilepath) {
        renameSync(track.filepath, newFilepath)
        track.filepath = newFilepath
      }
    } catch (err) {
      console.error(`Failed to rename track ${track.id} on settings template change:`, err)
    }

    current++
    onProgress(current, total)

    // Yield execution to the event loop every 10 tracks to keep event loop responsive
    if (current % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
  }

  saveDb()
}

// Folder migration logic
export async function migrateDownloadsFolder(newPath: string, moveFiles: boolean): Promise<void> {
  if (!existsSync(newPath)) {
    mkdirSync(newPath, { recursive: true })
  }

  if (moveFiles) {
    for (const track of dbData.tracks) {
      const playlist = dbData.playlists.find((p) => p.id === track.playlistId)
      const playlistFolder = playlist ? getPlaylistFolderName(playlist) : ''
      const targetDir = playlistFolder ? join(newPath, playlistFolder) : newPath

      if (playlistFolder && !existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      if (existsSync(track.filepath)) {
        const file = basename(track.filepath)
        const targetPath = join(targetDir, file)

        try {
          copyFileSync(track.filepath, targetPath)
          unlinkSync(track.filepath)
          track.filepath = targetPath
        } catch (e) {
          console.error(`Failed to move file ${track.filepath} to ${targetPath}:`, e)
        }
      } else {
        // Just update path mapping anyway
        track.filepath = join(targetDir, basename(track.filepath))
      }
    }
  } else {
    // Just update db path mappings without moving
    for (const track of dbData.tracks) {
      const playlist = dbData.playlists.find((p) => p.id === track.playlistId)
      const playlistFolder = playlist ? getPlaylistFolderName(playlist) : ''
      const targetDir = playlistFolder ? join(newPath, playlistFolder) : newPath
      track.filepath = join(targetDir, basename(track.filepath))
    }
  }

  if (dbData.settings) {
    dbData.settings.downloadPath = newPath
  }

  saveDb()
}
