import { app, protocol } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDb } from './db'
import { ensureYtdlp } from './downloader'
import { startBackgroundSync, stopBackgroundSync } from './sync'
import { handleMediaRequest, handleYoutubeStreamRequest } from './media'
import { ExportQueueManager } from './export/pioneer/ExportQueueManager'
import { createWindow, getMainWindow, setupActivateHandler } from './window'
import { createTray } from './tray'
import { registerIpcHandlers } from './ipc'
import { scheduleStartupAnalysis } from './backgroundAnalysis'
import { reconcileAllConnectedAccounts } from './youtubeSync'

app.setName('RekordFox')

const exportQueueManager = new ExportQueueManager()

// Register custom media protocol to serve local MP3 files securely and support audio streaming/seeking
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      stream: true,
      corsEnabled: true,
      supportFetchAPI: true
    }
  }
])

app.whenReady().then(async () => {
  // Initialize Database and folders
  initDb()

  // Ensure yt-dlp binary is downloaded/present
  try {
    await ensureYtdlp()
  } catch (err) {
    console.error('Failed to ensure yt-dlp at startup:', err)
  }

  // Register custom media protocol (serves local files with byte-range support for seeking)
  protocol.handle('media', (request) =>
    request.url.startsWith('media://youtube/')
      ? handleYoutubeStreamRequest(request)
      : handleMediaRequest(request)
  )

  electronApp.setAppUserModelId('com.electron')

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers(exportQueueManager)

  createWindow()
  createTray()

  // Start Background Sync Scheduler
  const mainWindow = getMainWindow()
  if (mainWindow) {
    startBackgroundSync(mainWindow)

    // Fire-and-forget: don't block startup on YouTube API round trips. Catches accounts that
    // connected in a previous session and any 'local' playlists reconciliation on connect never
    // saw at the time.
    reconcileAllConnectedAccounts(mainWindow).catch((err) => {
      console.error('Failed to reconcile YouTube playlists on startup:', err)
    })
  }

  scheduleStartupAnalysis()

  setupActivateHandler()
})

app.on('window-all-closed', () => {
  stopBackgroundSync()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
