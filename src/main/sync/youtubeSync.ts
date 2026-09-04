import { BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, statSync } from 'fs'
import nodeId3 from 'node-id3'
import {
  Playlist,
  Track,
  addPlaylist,
  addTrack,
  getTracksForPlaylist,
  getPlaylists,
  updatePlaylistStatus,
  recordTrackDownloadFailure,
  recordTrackDownloadSuccess,
  isDownloadAbandoned,
  clearPlaylistDirty,
  setPlaylistLinkState,
  getSettings,
  getDownloadsDir,
  getCoversDir,
  getTrackFilename,
  getPlaylistFolderName,
  linkPlaylistToOauthAccount,
  linkTrackToYoutubePlaylistItem,
  getOAuthAccounts
} from '../db'
import { downloadTrack } from '../media/downloader'
import { analyzeAndNotifyBpm, analyzeAndNotifyKey } from '../analysis/trackAnalysis'
import { parseTitleAndArtist, beginPlaylistSync, endPlaylistSync, syncLocalPlaylist } from './sync'
import { getYoutubeClientForAccount, isAuthError, isQuotaError } from '../auth/youtubeOAuth'

// Playlists whose link is healthy enough to talk to YouTube. Orphaned (account removed) and
// needs-reauth (token revoked) playlists must never hit the API — the caller surfaces a clear,
// actionable error instead of a raw "account not found" / 401.
function isLinkUsable(playlist: Playlist): boolean {
  return (
    playlist.source === 'youtube-oauth' &&
    !!playlist.oauthAccountId &&
    (playlist.linkState === undefined || playlist.linkState === 'linked')
  )
}

// Classifies an API failure and records it on the playlist so the UI can react: a revoked token
// flips it to 'needs-reauth', anything else is left as-is (transient/quota — retry later).
function noteApiFailure(playlistId: string, err: unknown): void {
  if (isAuthError(err)) {
    setPlaylistLinkState(playlistId, 'needs-reauth')
  }
}

function parseIsoDuration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

export interface RemotePlaylistSummary {
  id: string
  title: string
  itemCount: number
  thumbnailUrl?: string
}

export async function listMyRemotePlaylists(accountId: string): Promise<RemotePlaylistSummary[]> {
  const youtube = getYoutubeClientForAccount(accountId)
  const results: RemotePlaylistSummary[] = []
  let pageToken: string | undefined

  do {
    const res = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50,
      pageToken
    })
    for (const item of res.data.items || []) {
      if (!item.id) continue
      results.push({
        id: item.id,
        title: item.snippet?.title || 'Untitled Playlist',
        itemCount: item.contentDetails?.itemCount || 0,
        thumbnailUrl: item.snippet?.thumbnails?.default?.url || undefined
      })
    }
    pageToken = res.data.nextPageToken || undefined
  } while (pageToken)

  return results
}

interface RemotePlaylistItem {
  videoId: string
  playlistItemId: string
  title: string
  channelTitle: string
  position: number
}

async function fetchAllPlaylistItems(
  youtube: ReturnType<typeof getYoutubeClientForAccount>,
  remotePlaylistId: string
): Promise<RemotePlaylistItem[]> {
  const items: RemotePlaylistItem[] = []
  let pageToken: string | undefined

  do {
    const res = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: remotePlaylistId,
      maxResults: 50,
      pageToken
    })
    for (const item of res.data.items || []) {
      const videoId = item.contentDetails?.videoId
      if (!videoId || !item.id) continue
      items.push({
        videoId,
        playlistItemId: item.id,
        title: item.snippet?.title || 'Unknown Title',
        channelTitle:
          item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || 'Unknown Artist',
        position: item.snippet?.position ?? items.length
      })
    }
    pageToken = res.data.nextPageToken || undefined
  } while (pageToken)

  return items
}

// Runs once right after an account connects: existing playlists may in fact be playlists the
// now-connected account owns — either a 'local' one added earlier via a pasted public URL
// (download-only, before OAuth was ever set up), or a 'youtube-oauth' one still pointing at a
// stale oauthAccountId. The latter happens because every OAuth connection mints a brand-new random
// account ID (see startYoutubeOAuthFlow) — disconnecting and reconnecting the very same Google
// account, or removing an account and then reconnecting it later, leaves any playlist that was
// linked to the old ID orphaned: it keeps 'youtube-oauth' as its source, so sync push-back throws
// "account not found" against an ID that no longer exists, and it's silently excluded from ever
// being re-checked since only 'local' playlists were re-examined here before. For each playlist
// whose ID matches one of the account's own remote playlists and whose oauthAccountId isn't
// already this account, (re-)link it: attach each track's current playlistItem ID and point the
// playlist at this account, unlocking (or restoring) write-back sync without re-downloading
// anything. Playlists that don't match stay as they are — they belong to someone else.
export async function reconcileLocalPlaylistsWithAccount(accountId: string): Promise<Playlist[]> {
  const remotePlaylists = await listMyRemotePlaylists(accountId)
  const ownRemoteIds = new Set(remotePlaylists.map((p) => p.id))
  const connectedAccountIds = new Set(getOAuthAccounts().map((a) => a.id))

  // Only (re-)claim a playlist for this account when doing so can't "steal" it from another,
  // still-connected account. A YouTube playlist ID is owned by exactly one channel, so a match
  // here is either: a 'local' one we can adopt, an 'orphaned' one whose account is gone, or one
  // pointing at an oauthAccountId that no longer exists. A playlist already linked to a *different
  // but still-connected* account is left alone — that's the same channel connected twice, and
  // relinking it on every reconcile would ping-pong it between the two account IDs.
  const candidates = getPlaylists().filter((p) => {
    if (!ownRemoteIds.has(p.id) || p.oauthAccountId === accountId) return false
    if (p.source === 'local') return true
    if (p.linkState === 'orphaned' || p.linkState === 'needs-reauth') return true
    return !p.oauthAccountId || !connectedAccountIds.has(p.oauthAccountId)
  })
  if (candidates.length === 0) return []

  const youtube = getYoutubeClientForAccount(accountId)
  const linked: Playlist[] = []

  for (const playlist of candidates) {
    const remoteItems = await fetchAllPlaylistItems(youtube, playlist.id)
    const itemIdByVideoId = new Map(remoteItems.map((item) => [item.videoId, item.playlistItemId]))

    const localTracks = getTracksForPlaylist(playlist.id)
    for (const track of localTracks) {
      const playlistItemId = itemIdByVideoId.get(track.id)
      if (playlistItemId) {
        linkTrackToYoutubePlaylistItem(track.id, playlist.id, playlistItemId)
      }
    }

    linkPlaylistToOauthAccount(playlist.id, accountId)
    linked.push({
      ...playlist,
      source: 'youtube-oauth',
      oauthAccountId: accountId,
      linkState: 'linked'
    })
  }

  return linked
}

// Self-heals link state that drifted while the app was closed: any 'youtube-oauth' playlist whose
// oauthAccountId no longer belongs to a connected account is marked 'orphaned'. This covers the
// case where the account file was edited/removed out-of-band, or an older build never orphaned on
// disconnect. Returns the playlists it changed so the caller can notify the renderer.
export function reconcilePlaylistLinkStates(): Playlist[] {
  const connectedAccountIds = new Set(getOAuthAccounts().map((a) => a.id))
  const orphaned: Playlist[] = []
  for (const p of getPlaylists()) {
    if (p.source !== 'youtube-oauth') continue
    const healthy = !!p.oauthAccountId && connectedAccountIds.has(p.oauthAccountId)
    if (!healthy && p.linkState !== 'orphaned') {
      setPlaylistLinkState(p.id, 'orphaned')
      orphaned.push({ ...p, linkState: 'orphaned' })
    }
  }
  return orphaned
}

// Runs once at app startup for every already-connected account, covering the case where a
// 'local' playlist was added (or the account connected) in a previous session — reconciliation
// on connect alone only ever catches playlists that already existed at that moment. Broadcasts
// any newly-linked playlists to the given window so the renderer can pick them up without a
// manual refresh.
export async function reconcileAllConnectedAccounts(win: BrowserWindow): Promise<void> {
  // First flag any playlist whose account vanished while closed, so the UI shows the right state
  // even if no account is currently connected to adopt it.
  const orphaned = reconcilePlaylistLinkStates()
  if (orphaned.length > 0) {
    win.webContents.send('youtube-oauth:playlists-unlinked', orphaned)
  }

  for (const account of getOAuthAccounts().filter((a) => a.provider === 'google')) {
    try {
      const linked = await reconcileLocalPlaylistsWithAccount(account.id)
      if (linked.length > 0) {
        win.webContents.send('youtube-oauth:playlists-linked', linked)
      }
    } catch (err) {
      console.error(`Startup reconciliation failed for account ${account.id}:`, err)
    }
  }
}

async function fetchDurations(
  youtube: ReturnType<typeof getYoutubeClientForAccount>,
  videoIds: string[]
): Promise<Map<string, number>> {
  const durations = new Map<string, number>()
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    if (batch.length === 0) continue
    const res = await youtube.videos.list({ part: ['contentDetails'], id: batch })
    for (const item of res.data.items || []) {
      if (item.id && item.contentDetails?.duration) {
        durations.set(item.id, parseIsoDuration(item.contentDetails.duration))
      }
    }
  }
  return durations
}

// Imports one of the user's own YouTube playlists (discovered via the authenticated Data API, so
// this works for private/unlisted playlists that yt-dlp's public scraping could never see) as a
// new local 'youtube-oauth' playlist, then downloads each track's audio individually via yt-dlp.
// yt-dlp can only fetch videos that are at least unlisted-public, so a genuinely private *video*
// inside an otherwise importable playlist simply fails to download — same as any other
// undownloadable track today (flagged, excluded from queue/shuffle relevance).
export async function importYoutubePlaylist(
  accountId: string,
  remotePlaylistId: string,
  win: BrowserWindow
): Promise<Playlist> {
  const youtube = getYoutubeClientForAccount(accountId)

  const playlistRes = await youtube.playlists.list({ part: ['snippet'], id: [remotePlaylistId] })
  const remoteTitle = playlistRes.data.items?.[0]?.snippet?.title || 'YouTube Playlist'

  const newPlaylist: Playlist = {
    id: remotePlaylistId,
    title: remoteTitle,
    url: `https://www.youtube.com/playlist?list=${remotePlaylistId}`,
    syncStatus: 'syncing',
    lastSync: '',
    source: 'youtube-oauth',
    oauthAccountId: accountId,
    linkState: 'linked'
  }
  // addPlaylist is a no-op when the ID already exists (e.g. it was added earlier as a 'local'
  // public-URL playlist, or is a stale orphaned OAuth one). In that case link it to this account
  // explicitly instead, so we upgrade in place rather than silently leaving a mismatched source.
  if (getPlaylists().some((p) => p.id === remotePlaylistId)) {
    linkPlaylistToOauthAccount(remotePlaylistId, accountId)
  } else {
    addPlaylist(newPlaylist)
  }
  win.webContents.send('sync-status-changed', newPlaylist.id, 'syncing')

  let items: RemotePlaylistItem[]
  let durations: Map<string, number>
  try {
    items = await fetchAllPlaylistItems(youtube, remotePlaylistId)
    durations = await fetchDurations(
      youtube,
      items.map((i) => i.videoId)
    )

    // Pre-create placeholder tracks so the UI can show the full tracklist immediately, mirroring
    // the existing yt-dlp sync flow in sync.ts.
    for (const item of items) {
      const { title, artist } = parseTitleAndArtist(item.title, item.channelTitle)
      addTrack({
        id: item.videoId,
        playlistId: remotePlaylistId,
        title,
        artist,
        bpm: 0,
        key: '',
        duration: durations.get(item.videoId) || 0,
        filepath: '',
        coverPath: '',
        filesize: 0,
        format: 'MP3',
        rating: 0,
        bitrate: 0,
        position: item.position + 1,
        source: 'youtube-oauth',
        youtubePlaylistItemId: item.playlistItemId
      })
    }
    win.webContents.send('sync-status-changed', newPlaylist.id, 'syncing')
  } catch (err) {
    updatePlaylistStatus(remotePlaylistId, 'error')
    win.webContents.send('sync-status-changed', remotePlaylistId, 'error')
    throw err
  }

  // The playlist and its full (placeholder) tracklist already exist — return now so the
  // renderer can show them immediately, same as the "add by URL" flow in ipc/playlists.ts.
  // Track audio downloads continue in the background and report via the same
  // sync-status-changed/download-progress events the renderer already listens for.
  downloadYoutubePlaylistTracks(newPlaylist, remoteTitle, items, durations, win).catch((err) => {
    console.error(`Failed to download tracks for YouTube OAuth playlist ${remotePlaylistId}:`, err)
  })

  return newPlaylist
}

// Thin status-managing wrapper around downloadItemsIntoPlaylist for the initial import: flips the
// playlist to 'idle' when all downloads finish, or 'error' if the batch throws.
async function downloadYoutubePlaylistTracks(
  newPlaylist: Playlist,
  remoteTitle: string,
  items: RemotePlaylistItem[],
  durations: Map<string, number>,
  win: BrowserWindow
): Promise<void> {
  try {
    await downloadItemsIntoPlaylist(newPlaylist, remoteTitle, items, durations, win)
    const now = new Date().toISOString()
    updatePlaylistStatus(newPlaylist.id, 'idle', now)
    win.webContents.send('sync-status-changed', newPlaylist.id, 'idle', now)
  } catch (err) {
    updatePlaylistStatus(newPlaylist.id, 'error')
    win.webContents.send('sync-status-changed', newPlaylist.id, 'error')
    throw err
  }
}

// Downloads the given remote items' audio into the playlist's folder via a worker pool, writes ID3
// tags, computes bitrate and kicks off BPM/key analysis. Pure download work with no playlist-status
// side effects, so both the initial import and an incremental pull reuse it.
async function downloadItemsIntoPlaylist(
  playlist: Playlist,
  remoteTitle: string,
  items: RemotePlaylistItem[],
  durations: Map<string, number>,
  win: BrowserWindow
): Promise<void> {
  if (items.length === 0) return
  const remotePlaylistId = playlist.id

  {
    const settings = getSettings()
    const maxWorkers = Math.max(1, Math.min(12, settings.maxWorkers || 1))
    const downloadsDir = getDownloadsDir()
    const coversDir = getCoversDir()
    const targetDir = join(downloadsDir, getPlaylistFolderName(playlist))
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true })

    const queue = [...items]
    let downloadedCount = 0

    const worker = async (): Promise<void> => {
      while (queue.length > 0) {
        const item = queue.shift()
        if (!item) break

        const { title, artist } = parseTitleAndArtist(item.title, item.channelTitle)
        const duration = durations.get(item.videoId) || 0
        const filename = getTrackFilename(
          remotePlaylistId,
          item.videoId,
          artist,
          title,
          item.position + 1,
          0,
          settings.filenameTemplate || 'custom'
        )
        const filepath = join(targetDir, filename)
        const coverPath = join(coversDir, `${remotePlaylistId}_${item.videoId}.jpg`)
        const currentIndex = ++downloadedCount

        win.webContents.send('download-progress', {
          playlistId: remotePlaylistId,
          trackId: item.videoId,
          title: item.title,
          percent: 0,
          current: currentIndex,
          total: items.length
        })

        try {
          await downloadTrack(item.videoId, filepath, coverPath, remoteTitle, (percent) => {
            win.webContents.send('download-progress', {
              playlistId: remotePlaylistId,
              trackId: item.videoId,
              title: item.title,
              percent,
              current: currentIndex,
              total: items.length
            })
          })

          const tags: Parameters<typeof nodeId3.write>[0] = {
            title,
            artist,
            album: remoteTitle,
            audioSourceUrl: `https://www.youtube.com/watch?v=${item.videoId}`
          }
          if (existsSync(coverPath)) {
            tags.image = {
              mime: 'image/jpeg',
              type: { id: 3, name: 'front cover' },
              description: 'Cover',
              imageBuffer: readFileSync(coverPath)
            }
          }
          nodeId3.write(tags, filepath)

          let filesize = 0
          let bitrate = 320
          if (existsSync(filepath)) {
            filesize = statSync(filepath).size
            if (duration > 0) bitrate = Math.round((filesize * 8) / (duration * 1000))
          }

          // No position here on purpose: the caller (import / pull) always creates the track's
          // placeholder first, so addTrack preserves that existing position. This keeps a
          // re-download during a pull from resetting a track to its remote position and clobbering
          // the DJ's local order.
          addTrack({
            id: item.videoId,
            playlistId: remotePlaylistId,
            title,
            artist,
            bpm: 0,
            key: '',
            duration,
            filepath,
            coverPath,
            filesize,
            format: 'MP3',
            rating: 0,
            bitrate,
            source: 'youtube-oauth',
            youtubePlaylistItemId: item.playlistItemId
          })
          // Clear any earlier failure flag now that this attempt succeeded.
          recordTrackDownloadSuccess(item.videoId, remotePlaylistId)

          win.webContents.send('download-progress', {
            playlistId: remotePlaylistId,
            trackId: item.videoId,
            title: item.title,
            percent: 100,
            current: currentIndex,
            total: items.length
          })

          analyzeAndNotifyBpm(item.videoId, remotePlaylistId, filepath, win).catch((err) => {
            console.error(`BPM analysis failed for track ${item.videoId}:`, err)
          })
          analyzeAndNotifyKey(item.videoId, remotePlaylistId, filepath, win).catch((err) => {
            console.error(`Key analysis failed for track ${item.videoId}:`, err)
          })
        } catch (err) {
          console.error(`Failed to download YouTube OAuth track ${item.videoId}:`, err)
          // Flag as undownloadable (mirrors sync.ts) so it's excluded from queue/shuffle relevance
          // instead of lingering as a silent placeholder with an empty filepath. After
          // MAX_DOWNLOAD_ATTEMPTS failures it's abandoned entirely (see isDownloadAbandoned).
          recordTrackDownloadFailure(item.videoId, remotePlaylistId)
          win.webContents.send('download-progress', {
            playlistId: remotePlaylistId,
            trackId: item.videoId,
            title: item.title,
            percent: 100,
            current: currentIndex,
            total: items.length
          })
        }
      }
    }

    const workers: Promise<void>[] = []
    for (let i = 0; i < maxWorkers; i++) workers.push(worker())
    await Promise.all(workers)
  }
}

// Pulls the current state of a 'youtube-oauth' playlist from the authenticated Data API and
// reconciles it into the local db. This is the ONLY correct way to fully refresh an OAuth
// playlist — the yt-dlp path (syncLocalPlaylist) can't see private/unlisted items. When the
// account link itself isn't usable (orphaned/needs-reauth), this falls back to that same yt-dlp
// path anyway — best-effort membership updates (new tracks only) instead of no updates at all
// until the DJ reconnects the account.
//
// Reconciliation rules: YouTube is authoritative for adding new tracks and refreshing each
// track's own metadata, but never for removing tracks or for local order — so a pull never fights
// the DJ's local edits there:
//  - Add-only, order-preserving: never reorders existing local tracks (local order is the DJ's,
//    pushed *to* YouTube), and never removes a track just because it's no longer on the remote —
//    the DJ may still want it, or the remote view may simply be incomplete (see syncLocalPlaylist).
//  - Adds remote tracks that aren't local yet and downloads their audio.
//  - Refreshes each surviving track's youtubePlaylistItemId in case it changed, re-downloads any
//    track whose local file went missing, and overwrites title/artist/duration from the remote
//    item even when the file is already local (a YouTube-side rename shouldn't leave a stale
//    local title forever).
export async function pullYoutubeOAuthPlaylist(
  playlist: Playlist,
  win: BrowserWindow
): Promise<void> {
  if (!isLinkUsable(playlist)) {
    // Orphaned / needs-reauth / not actually OAuth-backed: the Data API is off-limits, but the
    // playlist may still be publicly reachable, so fall back to the same yt-dlp scrape 'local'
    // playlists use. This way new tracks keep flowing in even while the account link is broken.
    await syncLocalPlaylist(playlist, win)
    const afterFallback = getPlaylists().find((p) => p.id === playlist.id)
    if (afterFallback?.syncStatus !== 'error') return

    // The fallback failed too (e.g. the playlist is actually private) — surface the real,
    // actionable fix instead of the fallback's generic yt-dlp failure.
    if (playlist.linkState === 'needs-reauth') {
      throw new Error(
        'YouTube authorization expired. Reconnect the account in Settings, then sync again.'
      )
    }
    throw new Error(
      'This playlist is no longer linked to a YouTube account. Reconnect the account in Settings to sync it again.'
    )
  }
  if (!beginPlaylistSync(playlist.id)) return

  updatePlaylistStatus(playlist.id, 'syncing')
  win.webContents.send('sync-status-changed', playlist.id, 'syncing')

  try {
    const youtube = getYoutubeClientForAccount(playlist.oauthAccountId!)
    const items = await fetchAllPlaylistItems(youtube, playlist.id)
    const localTracks = getTracksForPlaylist(playlist.id)
    const localById = new Map(localTracks.map((t) => [t.id, t]))

    // Fetched up front (not just for toDownload) so already-downloaded tracks' title/artist/
    // duration can also be refreshed below — YouTube is the source of truth for a track's own
    // metadata even when its audio file is already local.
    const durations = await fetchDurations(
      youtube,
      items.map((i) => i.videoId)
    )

    // Attach/refresh item IDs, create placeholders for new tracks, collect what needs downloading.
    const toDownload: RemotePlaylistItem[] = []
    for (const item of items) {
      const existing = localById.get(item.videoId)
      if (existing) {
        if (existing.youtubePlaylistItemId !== item.playlistItemId) {
          linkTrackToYoutubePlaylistItem(item.videoId, playlist.id, item.playlistItemId)
        }
        const missingFiles =
          !existing.filepath || !existsSync(existing.filepath) || !existsSync(existing.coverPath)
        if (missingFiles && !isDownloadAbandoned(existing)) {
          toDownload.push(item)
        } else {
          // Not (re-)downloading, but the video's title/duration may have changed since the last
          // pull — keep local metadata in lockstep without touching position/rating/bpm/etc.
          const { title, artist } = parseTitleAndArtist(item.title, item.channelTitle)
          const duration = durations.get(item.videoId) ?? existing.duration
          if (
            existing.title !== title ||
            existing.artist !== artist ||
            existing.duration !== duration
          ) {
            addTrack({ ...existing, title, artist, duration })
          }
        }
      } else {
        const { title, artist } = parseTitleAndArtist(item.title, item.channelTitle)
        // No position: addTrack appends new tracks after the current max, so tracks that appeared
        // on YouTube since the last pull land at the end of the DJ's local order rather than
        // shuffling existing tracks around.
        const placeholder: Track = {
          id: item.videoId,
          playlistId: playlist.id,
          title,
          artist,
          bpm: 0,
          key: '',
          duration: durations.get(item.videoId) || 0,
          filepath: '',
          coverPath: '',
          filesize: 0,
          format: 'MP3',
          rating: 0,
          bitrate: 0,
          source: 'youtube-oauth',
          youtubePlaylistItemId: item.playlistItemId
        }
        addTrack(placeholder)
        toDownload.push(item)
      }
    }

    // Let the renderer refresh the tracklist with the new membership before downloads finish.
    win.webContents.send('sync-status-changed', playlist.id, 'syncing')

    await downloadItemsIntoPlaylist(playlist, playlist.title, toDownload, durations, win)

    const now = new Date().toISOString()
    updatePlaylistStatus(playlist.id, 'idle', now)
    win.webContents.send('sync-status-changed', playlist.id, 'idle', now)
  } catch (err) {
    console.error(`Failed to pull YouTube OAuth playlist ${playlist.id}:`, err)
    noteApiFailure(playlist.id, err)
    updatePlaylistStatus(playlist.id, 'error')
    win.webContents.send('sync-status-changed', playlist.id, 'error')
  } finally {
    endPlaylistSync(playlist.id)
  }
}

// Pushes the local track order/membership of a 'youtube-oauth' playlist back to the real YouTube
// playlist. To keep write quota sane (each write costs ~50 units against a 10k/day default), it
// first reads the current remote order (1 unit) and only writes the items that actually need to
// move: an unbroken correct prefix is skipped, and everything from the first divergence onward is
// (re)positioned in order — which is exactly correct regardless of how YouTube shifts siblings.
// Tracks without a remote item ID are inserted; the returned ID is linked back immediately so a
// retry never double-inserts. Never removes remote items — a locally deleted track just stops
// being pushed. On quota/auth failure it stops, leaves the pending flag set (so the user can retry
// later), and throws an actionable message; the dirty flag is only cleared on full success.
export async function pushPlaylistOrderToYoutube(
  playlistId: string,
  orderedTrackIds: string[]
): Promise<void> {
  const playlist = getPlaylists().find((p) => p.id === playlistId)
  if (!playlist || playlist.source !== 'youtube-oauth') {
    throw new Error('Playlist is not linked to a YouTube account.')
  }
  if (playlist.linkState === 'orphaned' || !playlist.oauthAccountId) {
    throw new Error(
      'This playlist is no longer linked to a YouTube account. Reconnect the account in Settings to sync it again.'
    )
  }
  if (playlist.linkState === 'needs-reauth') {
    throw new Error(
      'YouTube authorization expired. Reconnect the account in Settings, then sync again.'
    )
  }

  const youtube = getYoutubeClientForAccount(playlist.oauthAccountId)
  const tracks = getTracksForPlaylist(playlistId)
  const trackById = new Map(tracks.map((t) => [t.id, t]))
  const desired = orderedTrackIds
    .map((id) => trackById.get(id))
    .filter((t): t is Track => t !== undefined)

  let remoteByVideoId: Map<string, RemotePlaylistItem>
  try {
    const remoteItems = await fetchAllPlaylistItems(youtube, playlistId)
    remoteByVideoId = new Map(remoteItems.map((r) => [r.videoId, r]))
  } catch (err) {
    noteApiFailure(playlistId, err)
    throw toActionableError(err)
  }

  let diverged = false
  for (let index = 0; index < desired.length; index++) {
    const track = desired[index]
    const remote = track.youtubePlaylistItemId ? remoteByVideoId.get(track.id) : undefined

    // Skip while the prefix is still exactly right — no write needed for already-correct items.
    if (!diverged && remote && remote.position === index) continue
    diverged = true

    try {
      if (!remote) {
        const inserted = await youtube.playlistItems.insert({
          part: ['snippet'],
          requestBody: {
            snippet: {
              playlistId,
              position: index,
              resourceId: { kind: 'youtube#video', videoId: track.id }
            }
          }
        })
        if (!inserted.data.id) {
          // Bail rather than continue: without the returned ID we can't link it, and a retry would
          // insert the same video a second time.
          throw new Error('YouTube did not return an item ID for the inserted track.')
        }
        linkTrackToYoutubePlaylistItem(track.id, playlistId, inserted.data.id)
      } else {
        await youtube.playlistItems.update({
          part: ['snippet'],
          requestBody: {
            id: remote.playlistItemId,
            snippet: {
              playlistId,
              position: index,
              resourceId: { kind: 'youtube#video', videoId: track.id }
            }
          }
        })
      }
    } catch (err) {
      noteApiFailure(playlistId, err)
      throw toActionableError(err)
    }
  }

  clearPlaylistDirty(playlistId, new Date().toISOString())
}

// Turns a raw googleapis error into a message that tells the user what to do, mapping the two
// cases they can act on (quota, expired auth) and passing anything else through.
function toActionableError(err: unknown): Error {
  if (isQuotaError(err)) {
    return new Error(
      'YouTube API quota exceeded. Your changes are saved locally — try syncing again later.'
    )
  }
  if (isAuthError(err)) {
    return new Error(
      'YouTube authorization expired. Reconnect the account in Settings, then sync again.'
    )
  }
  return err instanceof Error ? err : new Error(String(err))
}
