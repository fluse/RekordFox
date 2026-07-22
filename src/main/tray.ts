import { app, ipcMain, Menu, nativeImage, Tray } from 'electron'
import trayIconAsset from '../../resources/trayIconTemplate.png?asset'
import { sendToRenderer, withMainWindow } from './window'

interface TrayPlayerState {
  title: string
  artist: string
  isPlaying: boolean
  hasTrack: boolean
}

let tray: Tray | null = null

let trayPlayerState: TrayPlayerState = {
  title: '',
  artist: '',
  isPlaying: false,
  hasTrack: false
}

function sendTrayControl(action: 'play-pause' | 'next' | 'previous'): void {
  sendToRenderer('tray:control', action)
}

function updateTrayMenu(): void {
  if (!tray) return
  const { title, artist, isPlaying, hasTrack } = trayPlayerState

  const menu = Menu.buildFromTemplate([
    {
      label: hasTrack ? `${title} — ${artist}` : 'Kein Track wird abgespielt',
      enabled: false
    },
    { type: 'separator' },
    {
      label: isPlaying ? 'Pause' : 'Abspielen',
      enabled: hasTrack,
      click: () => sendTrayControl('play-pause')
    },
    {
      label: 'Zurück',
      enabled: hasTrack,
      click: () => sendTrayControl('previous')
    },
    {
      label: 'Weiter',
      enabled: hasTrack,
      click: () => sendTrayControl('next')
    },
    { type: 'separator' },
    {
      label: 'RekordFox anzeigen',
      click: () => {
        withMainWindow((win) => {
          win.show()
          win.focus()
        })
      }
    },
    { label: 'Beenden', click: () => app.quit() }
  ])

  tray.setContextMenu(menu)
  tray.setToolTip(hasTrack ? `${title} — ${artist}` : 'RekordFox')
}

// Creates the tray icon and wires up the ipc listener that keeps its menu in
// sync with player state — kept together so the two can't drift apart.
export function createTray(): void {
  const trayIcon = nativeImage.createFromPath(trayIconAsset).resize({ width: 18, height: 18 })
  trayIcon.setTemplateImage(true)
  tray = new Tray(trayIcon)
  tray.on('click', () => {
    withMainWindow((win) => {
      if (win.isVisible()) {
        win.focus()
      } else {
        win.show()
      }
    })
  })
  updateTrayMenu()

  ipcMain.on('player:state-changed', (_, state: TrayPlayerState) => {
    trayPlayerState = state
    updateTrayMenu()
  })
}
