import { copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'fs'
import { basename, dirname, join } from 'path'
import { dbData, getDownloadsDir, saveDb } from './store'
import { getPlaylistFolderName, getTrackFilename } from './filenameUtils'
import type { AppSettings, FilepathChange } from './types'

export function getSettings(): AppSettings {
  return (
    dbData.settings || {
      theme: 'dark',
      colorScheme: 'purple',
      downloadPath: getDownloadsDir(),
      sidebarWidth: 256,
      maxWorkers: 3,
      language: 'en',
      historyLimit: 50,
      tooltipsEnabled: true,
      tooltipDelay: 600
    }
  )
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
export async function migrateDownloadsFolder(
  newPath: string,
  moveFiles: boolean
): Promise<FilepathChange[]> {
  if (!existsSync(newPath)) {
    mkdirSync(newPath, { recursive: true })
  }

  const changes: FilepathChange[] = []

  if (moveFiles) {
    for (const track of dbData.tracks) {
      // A track still downloading (placeholder with no filepath yet) has nothing to move or
      // remap — join(targetDir, basename('')) collapses to targetDir itself, which would
      // corrupt the track's filepath into its own playlist folder path.
      if (!track.filepath) continue

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
          if (track.filepath !== targetPath) {
            track.filepath = targetPath
            changes.push({ id: track.id, filepath: targetPath })
          }
        } catch (e) {
          console.error(`Failed to move file ${track.filepath} to ${targetPath}:`, e)
        }
      } else {
        // Just update path mapping anyway
        const targetPath = join(targetDir, basename(track.filepath))
        if (track.filepath !== targetPath) {
          track.filepath = targetPath
          changes.push({ id: track.id, filepath: targetPath })
        }
      }
    }
  } else {
    // Just update db path mappings without moving
    for (const track of dbData.tracks) {
      if (!track.filepath) continue

      const playlist = dbData.playlists.find((p) => p.id === track.playlistId)
      const playlistFolder = playlist ? getPlaylistFolderName(playlist) : ''
      const targetDir = playlistFolder ? join(newPath, playlistFolder) : newPath
      const targetPath = join(targetDir, basename(track.filepath))
      if (track.filepath !== targetPath) {
        track.filepath = targetPath
        changes.push({ id: track.id, filepath: targetPath })
      }
    }
  }

  if (dbData.settings) {
    dbData.settings.downloadPath = newPath
  }

  saveDb()
  return changes
}
