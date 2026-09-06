import { BrowserWindow, ipcMain } from 'electron'
import { existsSync, rmSync } from 'fs'
import { mkdir, readFile, writeFile, rename, copyFile } from 'fs/promises'
import { join, extname, dirname } from 'path'
import { getTracksForPlaylist, getPlaylists } from '../../db'
import { buildWavePreviewDat, buildWaveScrollExt } from './AnlzBuilder'
import { synthesizeBeatGrid } from './beatGrid'
import { copyFileData, ensureWritable } from '../fsCopy'
import { findPioneerPdb } from '../../media/usb'
import { mergePlaylist, MergeTrackInput } from './pdb/PdbMerger'

export interface WaveformPeak {
  low: number
  mid: number
  high: number
  all: number
}

export class ExportQueueManager {
  private cancelRequested = false
  private isRunning = false
  private activeFiles: string[] = []
  private pendingAnalysisResolve:
    | ((value: { peaks: WaveformPeak[]; rms: WaveformPeak[] }) => void)
    | null = null
  private pendingAnalysisReject: ((reason?: unknown) => void) | null = null
  private activeTrackId: string | null = null

  constructor() {
    // Listen for the analysis response from the Renderer
    ipcMain.on(
      'waveform:analysis-response',
      (_, trackId: string, result: { peaks: WaveformPeak[]; rms: WaveformPeak[] }) => {
        if (this.activeTrackId === trackId && this.pendingAnalysisResolve) {
          this.pendingAnalysisResolve(result)
          this.clearPendingAnalysis()
        }
      }
    )
  }

  private clearPendingAnalysis(): void {
    this.pendingAnalysisResolve = null
    this.pendingAnalysisReject = null
    this.activeTrackId = null
  }

  /**
   * Request the Renderer process to analyze a track file and return waveform data.
   */
  private async requestWaveformAnalysis(
    win: BrowserWindow,
    trackId: string,
    filepath: string
  ): Promise<{ peaks: WaveformPeak[]; rms: WaveformPeak[] }> {
    return new Promise((resolve, reject) => {
      if (this.cancelRequested) {
        reject(new Error('Export canceled'))
        return
      }

      this.activeTrackId = trackId
      this.pendingAnalysisResolve = resolve
      this.pendingAnalysisReject = reject

      win.webContents.send('waveform:analysis-request', { trackId, filepath })
    })
  }

  /**
   * Aborts the running export job.
   */
  public cancel(): void {
    if (this.isRunning) {
      this.cancelRequested = true
      if (this.pendingAnalysisReject) {
        this.pendingAnalysisReject(new Error('Export canceled by user'))
        this.clearPendingAnalysis()
      }
      console.log('[ExportQueueManager] Cancel request received.')
    }
  }

  /**
   * Cleans up any files created during the processing of the current track.
   */
  private cleanupCurrentTrackFiles(): void {
    console.log('[ExportQueueManager] Cleaning up current track files:', this.activeFiles)
    for (const file of this.activeFiles) {
      try {
        if (existsSync(file)) {
          rmSync(file, { force: true })
        }
      } catch (err) {
        console.error(`Failed to delete temporary file ${file}:`, err)
      }
    }
    this.activeFiles = []
  }

  /**
   * Runs the Pioneer export queue for a given playlist to a USB stick.
   */
  public async exportPlaylist(
    playlistId: string,
    usbPath: string,
    win: BrowserWindow
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isRunning) {
      return { success: false, error: 'Ein Export-Job läuft bereits.' }
    }

    this.isRunning = true
    this.cancelRequested = false
    this.activeFiles = []

    try {
      // 1. Resolve tracks in playlist
      const tracks = getTracksForPlaylist(playlistId).filter(
        (t) => t.filepath && existsSync(t.filepath)
      )

      if (tracks.length === 0) {
        this.isRunning = false
        return { success: false, error: 'Keine lokalen Tracks in dieser Playlist vorhanden.' }
      }

      const totalTracks = tracks.length
      console.log(`[ExportQueueManager] Starting export of ${totalTracks} tracks to ${usbPath}`)

      // Fail fast with a clear message if the volume isn't writable (read-only
      // filesystem / macOS privacy block) instead of crashing mid-copy on EPERM.
      await ensureWritable(usbPath)

      // 2. Locate the rekordbox DeviceSQL database (PIONEER/rekordbox/export.pdb,
      // legacy fallback PIONEER/export.pdb). If present, we merge the exported
      // playlist into it at the end so it appears in the CDJ playlist menu. If
      // absent, we still copy audio + waveforms but cannot register a playlist.
      const pdbPath = findPioneerPdb(usbPath)
      const pdbEnabled = pdbPath !== null
      if (!pdbEnabled) {
        console.warn(
          '[ExportQueueManager] No Pioneer export.pdb found on stick. Files will be copied but no playlist will be registered.'
        )
      }

      // Per-track metadata collected during the copy loop; merged into the pdb
      // in a single pass afterwards.
      const trackInputs: MergeTrackInput[] = []

      // 3. Process each track
      for (let i = 0; i < totalTracks; i++) {
        if (this.cancelRequested) {
          throw new Error('Export canceled')
        }

        const track = tracks[i]
        const currentTrackNum = i + 1
        const trackPercentStart = Math.round((i / totalTracks) * 100)

        // Notify progress: Web Audio analysis
        win.webContents.send('pioneer:export-progress', {
          currentTrack: currentTrackNum,
          totalTracks,
          statusText: `Analysiere Waveform: ${track.artist} - ${track.title}`,
          progressPercent: trackPercentStart + 2
        })

        // Request peaks from Renderer
        const analysis = await this.requestWaveformAnalysis(win, track.id, track.filepath)

        if (this.cancelRequested) throw new Error('Export canceled')

        // Notify progress: File copies and packers
        win.webContents.send('pioneer:export-progress', {
          currentTrack: currentTrackNum,
          totalTracks,
          statusText: `Kopiere und verpacke: ${track.artist} - ${track.title}`,
          progressPercent: trackPercentStart + 5
        })

        // Generate target directories and paths on USB
        const fileExt = extname(track.filepath) || '.mp3'
        const artistDir = sanitizePathPart(track.artist || 'Unknown Artist')
        const albumDir = 'Collection' // fallback folder
        const trackFilename = `${sanitizePathPart(track.title)}${fileExt}`

        const relAudioPath = join('CONTENTS', artistDir, albumDir, trackFilename)
        const absAudioPath = join(usbPath, relAudioPath)

        // Analysis files use rekordbox's own USBANLZ folder convention:
        // /PIONEER/USBANLZ/P<xxx>/<8-hex>/ANLZ0000.{DAT,EXT}. The 8-hex counter
        // starts high (0x10000000+) so it never collides with rekordbox's own
        // low-numbered analysis folders already present on the stick.
        const anlzHex = (0x10000000 + i).toString(16).toUpperCase().padStart(8, '0')
        const anlzP = `P${anlzHex.slice(0, 3)}`
        const relAnlzDir = join('PIONEER', 'USBANLZ', anlzP, anlzHex)
        const relAnlzPath = join(relAnlzDir, 'ANLZ0000.DAT')
        const relExtPath = join(relAnlzDir, 'ANLZ0000.EXT')

        const absAnlzPath = join(usbPath, relAnlzPath)
        const absExtPath = join(usbPath, relExtPath)

        // POSIX-style, slash-prefixed on-USB paths as stored in the pdb.
        const toUsbPath = (p: string): string => '/' + p.replace(/\\/g, '/')
        const pdbFilePath = toUsbPath(relAudioPath)
        const pdbAnalyzePath = toUsbPath(relAnlzPath)

        // Keep track of active files for this step so we can delete them if canceled
        this.activeFiles = [absAudioPath, absAnlzPath, absExtPath]

        // Create directories
        await mkdir(dirname(absAudioPath), { recursive: true })
        await mkdir(dirname(absAnlzPath), { recursive: true })

        // Copy audio file. Stream-copy (data only) so it works on exFAT/FAT32/
        // network USB volumes — fs.copyFile fails there with EPERM while trying
        // to replicate macOS metadata/ACLs. Streaming also yields the event loop
        // instead of freezing the window ("Keine Rückmeldung").
        await copyFileData(track.filepath, absAudioPath)

        // 4. Build standard DAT (PMAI + PQTZ beat grid + PWAV overview, per
        // Pioneer's ANLZ format). Downsample to exactly 400 overview bins,
        // one byte each (5-bit height, matching every Pioneer player's
        // expectations).
        const overviewPeaks = downsamplePeaks(analysis.peaks, 400)
        const overviewHeights = overviewPeaks.map((p) => scaleFloatToBits(p?.all || 0, 5))
        const beats = synthesizeBeatGrid(track.bpm || 0, track.gridOffset ?? 0, track.duration || 0)
        await writeFile(absAnlzPath, buildWavePreviewDat(overviewHeights, beats))

        // 5. Build EXT file (PMAI + PWV3 scrolling detail waveform).
        const detailHeights = analysis.peaks.map((p) => scaleFloatToBits(p.all, 5))
        await writeFile(absExtPath, buildWaveScrollExt(detailHeights))

        // 6. Collect this track's metadata for the pdb merge (done once, after
        // all files are on disk).
        trackInputs.push({
          title: track.title,
          artist: track.artist || '',
          key: track.key || undefined,
          filePath: pdbFilePath,
          filename: trackFilename,
          analyzePath: pdbAnalyzePath,
          tempo: Math.max(0, Math.round((track.bpm || 0) * 100)),
          durationSec: Math.max(0, Math.round(track.duration || 0)),
          bitrate: Math.max(0, Math.round(track.bitrate || 0)),
          sampleRate: 44100,
          sampleDepth: 16,
          fileSize: Math.max(0, Math.round(track.filesize || 0)),
          dateAdded: track.dateAdded || ''
        })

        // Active files successfully processed and registered
        this.activeFiles = []

        // Finalize track progress
        const trackPercentEnd = Math.round(((i + 1) / totalTracks) * 100)
        win.webContents.send('pioneer:export-progress', {
          currentTrack: currentTrackNum,
          totalTracks,
          statusText: `Titel erfolgreich exportiert: ${track.artist} - ${track.title}`,
          progressPercent: trackPercentEnd
        })
      }

      // 7. Merge the exported playlist into the rekordbox database so it shows
      // up in the CDJ playlist menu. Append-only: existing rows are preserved.
      if (pdbEnabled && pdbPath) {
        win.webContents.send('pioneer:export-progress', {
          currentTrack: totalTracks,
          totalTracks,
          statusText: 'Aktualisiere Rekordbox-Datenbank…',
          progressPercent: 99
        })

        const playlist = getPlaylists().find((p) => p.id === playlistId)
        const playlistName = playlist?.title || 'RekordFox Export'

        try {
          const original = await readFile(pdbPath)

          // One-time safety backup of the untouched database.
          const backupPath = `${pdbPath}.rffbak`
          if (!existsSync(backupPath)) {
            await copyFile(pdbPath, backupPath)
          }

          const result = mergePlaylist(original, playlistName, trackInputs)

          // Atomic write: temp file then rename over the original.
          const tmpPath = `${pdbPath}.tmp`
          await writeFile(tmpPath, result.buffer)
          await rename(tmpPath, pdbPath)

          console.log(
            `[ExportQueueManager] Merged playlist "${playlistName}" (id ${result.playlistId}): ` +
              `+${result.addedTracks} tracks, ${result.reusedTracks} reused, ` +
              `+${result.addedArtists} artists, +${result.addedAlbums} albums, +${result.addedKeys} keys.`
          )
        } catch (mergeErr) {
          const message = mergeErr instanceof Error ? mergeErr.message : String(mergeErr)
          console.error('[ExportQueueManager] Failed to update rekordbox database:', mergeErr)
          throw new Error(`Rekordbox-Datenbank konnte nicht aktualisiert werden: ${message}`)
        }
      }

      console.log('[ExportQueueManager] Export finished successfully.')
      return { success: true }
    } catch (err) {
      console.error('[ExportQueueManager] Export failed:', err)
      this.cleanupCurrentTrackFiles()

      // Notify final cancellation/failure progress
      if (this.cancelRequested) {
        win.webContents.send('pioneer:export-progress', {
          currentTrack: 0,
          totalTracks: 0,
          statusText: 'Export abgebrochen.',
          progressPercent: 0
        })
        return { success: false, error: 'Export abgebrochen' }
      }

      const message = err instanceof Error ? err.message : String(err)
      win.webContents.send('pioneer:export-progress', {
        currentTrack: 0,
        totalTracks: 0,
        statusText: `Fehler: ${message}`,
        progressPercent: 0
      })
      return { success: false, error: message }
    } finally {
      this.isRunning = false
      this.cancelRequested = false
    }
  }
}

// Helpers

function sanitizePathPart(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim()
}

function scaleFloatToBits(value: number, maxBits: number): number {
  const maxVal = (1 << maxBits) - 1
  const scaled = Math.round(value * maxVal)
  return scaled < 0 ? 0 : scaled > maxVal ? maxVal : scaled
}

function downsamplePeaks(peaks: WaveformPeak[], targetLength: number): WaveformPeak[] {
  const N = peaks.length
  const result: WaveformPeak[] = new Array(targetLength)
  if (N === 0) {
    for (let i = 0; i < targetLength; i++) {
      result[i] = { low: 0, mid: 0, high: 0, all: 0 }
    }
    return result
  }
  for (let t = 0; t < targetLength; t++) {
    const start = Math.floor((t / targetLength) * N)
    const end = Math.max(start + 1, Math.floor(((t + 1) / targetLength) * N))
    let maxLow = 0,
      maxMid = 0,
      maxHigh = 0,
      maxAll = 0
    const limit = end < N ? end : N
    for (let i = start; i < limit; i++) {
      const p = peaks[i]
      if (p.low > maxLow) maxLow = p.low
      if (p.mid > maxMid) maxMid = p.mid
      if (p.high > maxHigh) maxHigh = p.high
      if (p.all > maxAll) maxAll = p.all
    }
    result[t] = { low: maxLow, mid: maxMid, high: maxHigh, all: maxAll }
  }
  return result
}
