import Database from 'better-sqlite3'
import { existsSync } from 'fs'

/**
 * PioneerDbUpdater handles SQLite database connections and write operations for Rekordbox's
 * export.pdb file on USB sticks.
 */
export class PioneerDbUpdater {
  private dbPath: string
  private db: Database.Database | null = null

  /**
   * Constructs the DB updater.
   * @param dbPath Absolute file path to the export.pdb database file (e.g. on the USB drive).
   */
  constructor(dbPath: string) {
    this.dbPath = dbPath
  }

  /**
   * Initializes the database connection and runs defensive filesystem checks.
   * Throws if the PDB file does not exist.
   */
  public init(): void {
    if (!existsSync(this.dbPath)) {
      throw new Error(`Pioneer PDB database file not found at path: ${this.dbPath}`)
    }

    try {
      this.db = new Database(this.dbPath, { fileMustExist: true })
      // Enable WAL mode for better concurrency and stability on USB drives
      this.db.pragma('journal_mode = WAL')
    } catch (err: any) {
      this.close()
      throw new Error(`Failed to open Pioneer SQLite database at ${this.dbPath}: ${err.message}`)
    }
  }

  /**
   * Updates the waveform paths for a track in the djmdSong table.
   * Executes the updates inside a SQLite transaction to prevent corruption.
   * Handles USB unplug issues defensively.
   *
   * @param trackId The primary key ID of the track in the Pioneer database.
   * @param anlzRelativePath Relative path to the standard overview/detail ANLZ file.
   * @param extRelativePath Optional relative path to the color waveform EXT file.
   */
  public linkWaveformToTrack(
    trackId: string | number,
    anlzRelativePath: string,
    extRelativePath?: string
  ): void {
    if (!this.db) {
      throw new Error('Database connection is not initialized. Call init() first.')
    }

    // Defensive check: Verify if the database file still exists on disk.
    // If the USB drive is unplugged, existsSync will return false.
    if (!existsSync(this.dbPath)) {
      this.close()
      throw new Error(
        `Database write aborted: PDB file at ${this.dbPath} no longer exists. The USB drive might have been disconnected.`
      )
    }

    try {
      // Execute the database updates inside a secure atomic transaction.
      const runTransaction = this.db.transaction(() => {
        if (extRelativePath) {
          const stmt = this.db!.prepare(`
            UPDATE djmdSong
            SET strAnlzPath = ?, strExtPath = ?
            WHERE ID = ?
          `)
          const result = stmt.run(anlzRelativePath, extRelativePath, trackId)
          if (result.changes === 0) {
            throw new Error(`Track ID ${trackId} not found in the djmdSong table.`)
          }
        } else {
          const stmt = this.db!.prepare(`
            UPDATE djmdSong
            SET strAnlzPath = ?
            WHERE ID = ?
          `)
          const result = stmt.run(anlzRelativePath, trackId)
          if (result.changes === 0) {
            throw new Error(`Track ID ${trackId} not found in the djmdSong table.`)
          }
        }
      })

      runTransaction()
      console.log(`[PioneerDbUpdater] Successfully linked waveforms to track ID: ${trackId}`)
    } catch (err: any) {
      console.error(
        `[PioneerDbUpdater] Failed to write waveform links for track ID ${trackId}:`,
        err
      )
      // Check if the USB was disconnected during the query execution
      if (!existsSync(this.dbPath)) {
        this.close()
        throw new Error(
          `Database transaction failed due to connection loss (USB disconnected): ${err.message}`
        )
      }
      throw new Error(`Pioneer PDB update failed: ${err.message}`)
    }
  }

  /**
   * Closes the database connection.
   */
  public close(): void {
    if (this.db) {
      try {
        this.db.close()
        console.log(`[PioneerDbUpdater] Closed database connection for ${this.dbPath}`)
      } catch (err) {
        console.error('[PioneerDbUpdater] Error closing SQLite database connection:', err)
      } finally {
        this.db = null
      }
    }
  }
}
