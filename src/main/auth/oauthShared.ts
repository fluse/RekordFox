import { BrowserWindow } from 'electron'

// How long the loopback HTTP server started by an OAuth flow (spotifyOAuth.ts / youtubeOAuth.ts)
// waits for the browser redirect to arrive before giving up.
export const OAUTH_TIMEOUT_MS = 5 * 60 * 1000

// Broadcasts directly via BrowserWindow rather than importing the sendToRenderer helper from
// '../app/window' — that module also pulls in the app icon asset (a Vite-only `?asset` import),
// which the renderer's separate tsconfig can't resolve once anything under src/renderer
// transitively imports a type from a file that imports it (as RemotePlaylistSummary does for
// youtubeOAuth.ts).
export function broadcastToAllWindows(channel: string, ...args: unknown[]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  }
}

// Electron doesn't automatically bring the app back to the foreground once the browser finishes
// the OAuth redirect — without this, the user has no obvious signal that the flow completed and
// has to remember to alt-tab back manually.
export function focusMainWindow(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  }
}
