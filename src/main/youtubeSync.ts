import { BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, statSync } from 'fs'
import nodeId3 from 'node-id3'
import {
  Playlist,
  addPlaylist,
  addTrack,
  getTracksForPlaylist,
  getPlaylists,
  updatePlaylistStatus,
  clearPlaylistDirty,
  getSettings,
  getDownloadsDir,
  getCoversDir,
  getTrackFilename,
  getPlaylistFolderName,
  linkPlaylistToOauthAccount,
  linkTrackToYoutubePlaylistItem,
  getOAuthAccounts
} from './db'
import { downloadTrack } from './downloader'
import { analyzeAndNotifyBpm, analyzeAndNotifyKey } from './trackAnalysis'
import { parseTitleAndArtist } from './sync'
import { getYoutubeClientForAccount } from './youtubeOAuth'

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

// Runs once right after an account connects: existing 'local' playlists (added earlier via a
// pasted public URL, download-only) may in fact be playlists the now-connected account owns —
// e.g. the user pasted their own YouTube playlist link before ever setting up OAuth. For each
// local playlist whose ID matches one of the account's own remote playlists, upgrade it in place
// to 'youtube-oauth' and attach each track's playlistItem ID, unlocking write-back sync without
// re-downloading anything. Playlists that don't match stay 'local' — they belong to someone else.
export async function reconcileLocalPlaylistsWithAccount(accountId: string): Promise<Playlist[]> {
  const remotePlaylists = await listMyRemotePlaylists(accountId)
  const ownRemoteIds = new Set(remotePlaylists.map((p) => p.id))

  const candidates = getPlaylists().filter((p) => p.source === 'local' && ownRemoteIds.has(p.id))
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
    linked.push({ ...playlist, source: 'youtube-oauth', oauthAccountId: accountId })
  }

  return linked
}

// Runs once at app startup for every already-connected account, covering the case where a
// 'local' playlist was added (or the account connected) in a previous session — reconciliation
// on connect alone only ever catches playlists that already existed at that moment. Broadcasts
// any newly-linked playlists to the given window so the renderer can pick them up without a
// manual refresh.
export async function reconcileAllConnectedAccounts(win: BrowserWindow): Promise<void> {
  for (const account of getOAuthAccounts()) {
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
    oauthAccountId: accountId
  }
  addPlaylist(newPlaylist)
  win.webContents.send('sync-status-changed', newPlaylist.id, 'syncing')

  try {
    const items = await fetchAllPlaylistItems(youtube, remotePlaylistId)
    const durations = await fetchDurations(
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

    const settings = getSettings()
    const maxWorkers = Math.max(1, Math.min(12, settings.maxWorkers || 1))
    const downloadsDir = getDownloadsDir()
    const coversDir = getCoversDir()
    const targetDir = join(downloadsDir, getPlaylistFolderName(newPlaylist))
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
          settings.filenameTemplate || 'default'
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
            position: item.position + 1,
            source: 'youtube-oauth',
            youtubePlaylistItemId: item.playlistItemId
          })

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

    const now = new Date().toISOString()
    updatePlaylistStatus(remotePlaylistId, 'idle', now)
    win.webContents.send('sync-status-changed', remotePlaylistId, 'idle', now)

    return { ...newPlaylist, syncStatus: 'idle', lastSync: now }
  } catch (err) {
    updatePlaylistStatus(remotePlaylistId, 'error')
    win.webContents.send('sync-status-changed', remotePlaylistId, 'error')
    throw err
  }
}

// Pushes the given local track order back to the real YouTube playlist via playlistItems.update.
// Never inserts or deletes items — only reorders existing ones — so it's safe to call repeatedly
// and never touches the remote playlist's actual membership.
export async function pushPlaylistOrderToYoutube(
  playlistId: string,
  orderedTrackIds: string[]
): Promise<void> {
  const playlist = getPlaylists().find((p) => p.id === playlistId)
  if (!playlist || playlist.source !== 'youtube-oauth' || !playlist.oauthAccountId) {
    throw new Error('Playlist is not linked to a YouTube account.')
  }
  const youtube = getYoutubeClientForAccount(playlist.oauthAccountId)
  const tracks = getTracksForPlaylist(playlistId)
  const trackById = new Map(tracks.map((t) => [t.id, t]))

  for (let index = 0; index < orderedTrackIds.length; index++) {
    const track = trackById.get(orderedTrackIds[index])
    if (!track || !track.youtubePlaylistItemId) continue
    await youtube.playlistItems.update({
      part: ['snippet'],
      requestBody: {
        id: track.youtubePlaylistItemId,
        snippet: {
          playlistId,
          position: index,
          resourceId: { kind: 'youtube#video', videoId: track.id }
        }
      }
    })
  }

  clearPlaylistDirty(playlistId, new Date().toISOString())
}
