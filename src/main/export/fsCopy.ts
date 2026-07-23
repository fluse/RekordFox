import { createReadStream, createWriteStream } from 'fs'
import { open, unlink } from 'fs/promises'
import { join } from 'path'
import { pipeline } from 'stream/promises'

/**
 * Copy a file's *data only* from src to dst.
 *
 * Unlike fs.copyFile — which on macOS uses fcopyfile() with COPYFILE_ALL and
 * tries to replicate metadata, extended attributes and ACLs onto the target —
 * a plain stream copy writes just the bytes. Copying that metadata fails with
 * EPERM ("operation not permitted") on USB/exFAT/FAT32/network volumes, which
 * broke exports to CDJ sticks even though writing the file itself is allowed.
 *
 * Streaming also yields the main-process event loop between chunks, so a slow
 * USB write doesn't freeze the window ("Keine Rückmeldung").
 */
export async function copyFileData(src: string, dst: string): Promise<void> {
  await pipeline(createReadStream(src), createWriteStream(dst))
}

/**
 * Verify that the target volume can actually be written to before starting an
 * export, so we fail fast with an actionable message instead of crashing deep
 * inside the copy loop with a cryptic "EPERM: operation not permitted".
 *
 * A write is refused with EPERM/EACCES/EROFS in situations we cannot fix from
 * code but the user can. On recent macOS the most common one is that the OS
 * itself blocks writes to the USB volume even though the drive reports as
 * writable — either because the app hasn't been granted access to removable
 * volumes, or because the (FAT/exFAT) volume was mounted by a driver that
 * refuses writes until it is re-mounted. Less commonly the drive is formatted
 * with a filesystem macOS can only read (NTFS / Linux ext4).
 *
 * Throws an Error whose message explains the fixes, prefixed by the OS code.
 */
export async function ensureWritable(targetPath: string): Promise<void> {
  const probePath = join(targetPath, `.rekordfox-write-test-${process.pid}`)
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(probePath, 'w')
  } catch (err: unknown) {
    const code = err instanceof Error && 'code' in err ? String(err.code) : ''
    if (code === 'EPERM' || code === 'EACCES' || code === 'EROFS') {
      const volume = /^\/Volumes\/([^/]+)/.exec(targetPath)?.[1] || targetPath
      throw new Error(
        `Auf „${volume}" kann nicht geschrieben werden (${code}), ` +
          `obwohl das Laufwerk angeschlossen ist. Das ist eine Einschränkung von macOS, ` +
          `kein Fehler von RekordFox. Bitte versuche Folgendes:\n` +
          `• Erteile RekordFox Zugriff unter „Systemeinstellungen → Datenschutz & ` +
          `Sicherheit → Festplattenvollzugriff" und starte die App neu.\n` +
          `• Wirf den USB-Stick aus und stecke ihn erneut ein (oft löst ein Neu-Einstecken ` +
          `oder ein Neustart des Macs das Schreibproblem bei USB-Sticks).\n` +
          `• Falls es weiterhin fehlschlägt, formatiere den Stick neu als exFAT oder FAT32 ` +
          `(mit dem Festplattendienstprogramm) – Laufwerke im Format NTFS oder Linux/ext4 ` +
          `kann macOS nur lesen.`
      )
    }
    throw err
  } finally {
    if (handle) {
      await handle.close()
      await unlink(probePath).catch(() => {})
    }
  }
}
