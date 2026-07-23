import { ipcMain } from 'electron'
import { getOAuthAccounts, OAuthAccount } from '../db'
import { startYoutubeOAuthFlow, disconnectYoutubeAccount } from '../youtubeOAuth'
import {
  listMyRemotePlaylists,
  importYoutubePlaylist,
  pushPlaylistOrderToYoutube,
  reconcileLocalPlaylistsWithAccount
} from '../youtubeSync'
import { ipcTry } from '../errors'
import { getMainWindow } from '../window'

// Accounts are only ever exposed to the renderer stripped of their encrypted tokens.
function toPublicAccount(
  account: OAuthAccount
): Omit<OAuthAccount, 'accessTokenEnc' | 'refreshTokenEnc'> {
  const { accessTokenEnc, refreshTokenEnc, ...rest } = account
  void accessTokenEnc
  void refreshTokenEnc
  return rest
}

// Reconciliation is a bonus on top of whatever triggered it (a fresh connect, a manual re-check,
// app startup) — never let an API error from the ownership check itself fail that caller.
async function safeReconcile(
  accountId: string
): Promise<Awaited<ReturnType<typeof reconcileLocalPlaylistsWithAccount>>> {
  try {
    return await reconcileLocalPlaylistsWithAccount(accountId)
  } catch (err) {
    console.error(`Failed to reconcile local playlists for account ${accountId}:`, err)
    return []
  }
}

export function registerYoutubeAuthIpc(): void {
  ipcMain.handle('youtube-oauth:get-accounts', () => getOAuthAccounts().map(toPublicAccount))

  ipcMain.handle('youtube-oauth:connect', (_, openBrowser?: boolean) =>
    ipcTry(async () => {
      const account = await startYoutubeOAuthFlow(openBrowser !== false)
      const linkedPlaylists = await safeReconcile(account.id)
      return { account: toPublicAccount(account), linkedPlaylists }
    })
  )

  // Lets the user (or the app on startup) re-run the local-playlist ownership check for an
  // account that was already connected before — e.g. a playlist added via pasted URL after the
  // account connected, or one that predates this reconciliation feature entirely.
  ipcMain.handle('youtube-oauth:reconcile-playlists', (_, accountId: string) =>
    ipcTry(async () => {
      const linkedPlaylists = await safeReconcile(accountId)
      return { linkedPlaylists }
    })
  )

  ipcMain.handle('youtube-oauth:disconnect', (_, accountId: string) =>
    ipcTry(async () => {
      const unlinkedPlaylists = await disconnectYoutubeAccount(accountId)
      return { unlinkedPlaylists }
    })
  )

  ipcMain.handle('youtube-oauth:list-my-playlists', (_, accountId: string) =>
    ipcTry(async () => {
      const playlists = await listMyRemotePlaylists(accountId)
      return { playlists }
    })
  )

  ipcMain.handle(
    'youtube-oauth:import-playlist',
    (_, accountId: string, remotePlaylistId: string) =>
      ipcTry(async () => {
        const mainWindow = getMainWindow()
        if (!mainWindow) throw new Error('Main window not available')
        const playlist = await importYoutubePlaylist(accountId, remotePlaylistId, mainWindow)
        return { playlist }
      })
  )

  ipcMain.handle('youtube-oauth:sync-order', (_, playlistId: string, orderedTrackIds: string[]) =>
    ipcTry(async () => {
      await pushPlaylistOrderToYoutube(playlistId, orderedTrackIds)
      return {}
    })
  )
}
