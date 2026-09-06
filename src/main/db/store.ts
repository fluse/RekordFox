import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { writeRekordboxXml } from '../export/rekordbox/rekordboxXmlExporter'
import type { DatabaseSchema, StorageStats } from './types'
import {
  assignTrackPositions,
  embedId3TagsForTracks,
  healTrackMetadata,
  migrateLegacyPlaylistSource,
  migrateTrackSubfolders
} from './migrations'

let dbPath = ''
let defaultDownloadsDir = ''
let coversDir = ''

export let dbData: DatabaseSchema = {
  playlists: [],
  tracks: [],
  discoverBlacklist: [],
  settings: {
    theme: 'dark',
    colorScheme: 'purple',
    downloadPath: '',
    sidebarWidth: 256,
    maxWorkers: 1,
    language: 'de',
    filenameTemplate: 'custom',
    historyLimit: 50,
    tooltipsEnabled: true,
    tooltipDelay: 600
  }
}

export function saveDb(): void {
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

export function getStorageStats(): StorageStats {
  let downloadsSize = 0
  let downloadsCount = 0
  for (const track of dbData.tracks) {
    if (track.filesize) {
      downloadsSize += track.filesize
      downloadsCount++
    }
  }

  let cacheSize = 0
  let cacheCount = 0
  try {
    if (existsSync(coversDir)) {
      for (const file of readdirSync(coversDir)) {
        try {
          cacheSize += statSync(join(coversDir, file)).size
          cacheCount++
        } catch {
          // skip unreadable file
        }
      }
    }
  } catch (e) {
    console.error('Failed to compute cache size:', e)
  }

  return { downloadsSize, downloadsCount, cacheSize, cacheCount }
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
      colorScheme: 'purple',
      downloadPath: defaultDownloadsDir,
      sidebarWidth: 256,
      maxWorkers: 3,
      language: 'de',
      filenameTemplate: 'custom',
      rekordboxXmlPath: '',
      historyLimit: 50,
      tooltipsEnabled: true,
      tooltipDelay: 600
    }
    saveDb()
  } else {
    try {
      const content = readFileSync(dbPath, 'utf-8')
      dbData = JSON.parse(content)
      // Ensure arrays exist
      if (!dbData.playlists) dbData.playlists = []
      if (!dbData.tracks) dbData.tracks = []
      if (!dbData.discoverBlacklist) dbData.discoverBlacklist = []
      if (!dbData.oauthAccounts) dbData.oauthAccounts = []

      // Ensure settings exist with defaults
      if (!dbData.settings) {
        dbData.settings = {
          theme: 'dark',
          colorScheme: 'purple',
          downloadPath: defaultDownloadsDir,
          sidebarWidth: 256,
          maxWorkers: 3,
          language: 'de',
          filenameTemplate: 'custom',
          rekordboxXmlPath: '',
          tooltipsEnabled: true,
          tooltipDelay: 600
        }
      } else {
        if (!dbData.settings.theme) dbData.settings.theme = 'dark'
        if (!dbData.settings.colorScheme) dbData.settings.colorScheme = 'purple'
        if (!dbData.settings.downloadPath) dbData.settings.downloadPath = defaultDownloadsDir
        if (!dbData.settings.sidebarWidth) dbData.settings.sidebarWidth = 256
        if (!dbData.settings.maxWorkers) dbData.settings.maxWorkers = 3
        if (!dbData.settings.language) dbData.settings.language = 'de'
        if (!dbData.settings.filenameTemplate) dbData.settings.filenameTemplate = 'custom'
        if (dbData.settings.rekordboxXmlPath === undefined) dbData.settings.rekordboxXmlPath = ''
        if (dbData.settings.tooltipsEnabled === undefined) dbData.settings.tooltipsEnabled = true
        if (dbData.settings.tooltipDelay === undefined) dbData.settings.tooltipDelay = 600
      }

      // Self-healing migrations, run in order every startup
      let dbUpdated = false
      if (migrateLegacyPlaylistSource(dbData.playlists)) dbUpdated = true
      if (assignTrackPositions(dbData.tracks)) dbUpdated = true
      if (migrateTrackSubfolders(dbData.tracks, dbData.playlists, getDownloadsDir())) {
        dbUpdated = true
      }
      if (healTrackMetadata(dbData.tracks)) dbUpdated = true
      embedId3TagsForTracks(dbData.tracks, dbData.playlists)

      if (dbUpdated) {
        saveDb()
      }
    } catch (e) {
      console.error('Error reading database file, recreating:', e)
      dbData.settings = {
        theme: 'dark',
        colorScheme: 'purple',
        downloadPath: defaultDownloadsDir,
        sidebarWidth: 256,
        maxWorkers: 3
      }
      saveDb()
    }
  }
}
