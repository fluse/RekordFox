import { ipcMain } from 'electron'
import { testSpotifyCredentials } from '../spotifyApi'
import { startSpotifyOAuthFlow, disconnectSpotifyAccount } from '../spotifyOAuth'
import { getOAuthAccounts, toPublicOAuthAccount } from '../db'
import { ipcTry } from '../errors'

export function registerSpotifyIpc(): void {
  ipcMain.handle('spotify:test-connection', (_, clientId: string, clientSecret: string) =>
    ipcTry(async () => {
      await testSpotifyCredentials(clientId, clientSecret)
      return {}
    })
  )

  ipcMain.handle('spotify-oauth:get-account', () => {
    const account = getOAuthAccounts().find((a) => a.provider === 'spotify')
    return account ? toPublicOAuthAccount(account) : null
  })

  ipcMain.handle('spotify-oauth:connect', (_, openBrowser?: boolean) =>
    ipcTry(async () => {
      const account = await startSpotifyOAuthFlow(openBrowser !== false)
      return { account: toPublicOAuthAccount(account) }
    })
  )

  ipcMain.handle('spotify-oauth:disconnect', () =>
    ipcTry(async () => {
      await disconnectSpotifyAccount()
      return {}
    })
  )
}
