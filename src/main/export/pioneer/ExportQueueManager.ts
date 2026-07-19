import { BrowserWindow, ipcMain } from 'electron'
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import { join, extname, dirname } from 'path'
import { getTracksForPlaylist } from '../../db'
import { AnlzBuilder } from './AnlzBuilder'
import { PioneerDbUpdater } from './PioneerDbUpdater'

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
    let dbUpdater: PioneerDbUpdater | null = null

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

      // 2. Open SQLite database on the USB stick
      const pdbPath = join(usbPath, 'PIONEER', 'export.pdb')
      dbUpdater = new PioneerDbUpdater(pdbPath)

      // Note: If export.pdb doesn't exist, we skip updating PDB but still write files.
      // Usually, Rekordbox USB sticks have export.pdb.
      let pdbEnabled = false
      try {
        dbUpdater.init()
        pdbEnabled = true
        console.log('[ExportQueueManager] Successfully connected to export.pdb')
      } catch (dbErr) {
        const message = dbErr instanceof Error ? dbErr.message : String(dbErr)
        console.warn(
          `[ExportQueueManager] Pioneer export.pdb not found or could not be opened: ${message}. Skipping database updates.`
        )
      }

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

        const relAnlzDir = join('PIONEER', 'USBANLZ', artistDir, albumDir)
        const relAnlzPath = join(relAnlzDir, `${track.id}.DAT`)
        const relExtPath = join(relAnlzDir, `${track.id}.EXT`)

        const absAnlzPath = join(usbPath, relAnlzPath)
        const absExtPath = join(usbPath, relExtPath)

        // Keep track of active files for this step so we can delete them if canceled
        this.activeFiles = [absAudioPath, absAnlzPath, absExtPath]

        // Create directories
        mkdirSync(dirname(absAudioPath), { recursive: true })
        mkdirSync(dirname(absAnlzPath), { recursive: true })

        // Copy audio file
        copyFileSync(track.filepath, absAudioPath)

        // 4. Build standard DAT (PMAI + PWV3 overview)
        const datBuilder = new AnlzBuilder(512)
        // PMAI Header Block (24 bytes)
        datBuilder.writeString('PMAI', 4)
        datBuilder.writeUInt32(0) // placeholder for total file size (offset 4)
        for (let k = 0; k < 16; k++) datBuilder.writeUInt8(0) // zero padded remaining header

        // PWV3 Overview Block (424 bytes)
        datBuilder.writeString('PWV3', 4)
        datBuilder.writeUInt32(424) // block size
        for (let k = 0; k < 16; k++) datBuilder.writeUInt8(0) // subheader

        // Downsample analysis peaks to exactly 400 overview bins
        const overviewPeaks = downsamplePeaks(analysis.peaks, 400)
        // Write 400 bytes (each byte represents 'all' peak scaled to 5 bits)
        for (let k = 0; k < 400; k++) {
          const val = scaleFloatToBits(overviewPeaks[k]?.all || 0, 5)
          datBuilder.writeUInt8(val)
        }

        // Complete size retroactively
        const totalDatSize = datBuilder.getOffset()
        datBuilder.setUInt32(4, totalDatSize)
        await datBuilder.saveToFile(absAnlzPath)

        // 5. Build EXT file (PMAI + PWV6 scrolling detail)
        const extBuilder = new AnlzBuilder(1024)
        // PMAI Header
        extBuilder.writeString('PMAI', 4)
        extBuilder.writeUInt32(0) // size placeholder (offset 4)
        for (let k = 0; k < 16; k++) extBuilder.writeUInt8(0)

        // PWV6 Block
        const numDetailBins = analysis.peaks.length
        const pwv6Size = 24 + numDetailBins * 4
        extBuilder.writeString('PWV6', 4)
        extBuilder.writeUInt32(pwv6Size)
        for (let k = 0; k < 16; k++) extBuilder.writeUInt8(0)

        // Write detail scrolling peaks (each entry is 4 bytes: low, mid, high, all - each 5 bits)
        for (let k = 0; k < numDetailBins; k++) {
          const p = analysis.peaks[k]
          extBuilder.writeUInt8(scaleFloatToBits(p.low, 5))
          extBuilder.writeUInt8(scaleFloatToBits(p.mid, 5))
          extBuilder.writeUInt8(scaleFloatToBits(p.high, 5))
          extBuilder.writeUInt8(scaleFloatToBits(p.all, 5))
        }

        const totalExtSize = extBuilder.getOffset()
        extBuilder.setUInt32(4, totalExtSize)
        await extBuilder.saveToFile(absExtPath)

        // 6. Database Update
        if (pdbEnabled && dbUpdater) {
          // Relativize paths for SQLite (usually starts with a slash, e.g. /PIONEER/USBANLZ/...)
          // Normalize paths to use forward slashes for Pioneer compatibility
          const sqlAnlz = '/' + relAnlzPath.replace(/\\/g, '/')
          const sqlExt = '/' + relExtPath.replace(/\\/g, '/')

          // Execute database update. If it throws (e.g. trackId mismatch), we catch it
          try {
            dbUpdater.linkWaveformToTrack(track.id, sqlAnlz, sqlExt)
          } catch (dbUpdateErr) {
            console.error(
              `[ExportQueueManager] Failed to link database entry for track ${track.id}:`,
              dbUpdateErr
            )
          }
        }

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
      if (dbUpdater) {
        dbUpdater.close()
      }
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
