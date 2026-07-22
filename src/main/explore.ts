import { BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, statSync, readFileSync } from 'fs'
import nodeId3 from 'node-id3'
import { Innertube } from 'youtubei.js'
import {
  Playlist,
  Track,
  addTrack,
  getDownloadsDir,
  getCoversDir,
  getSettings,
  getTrackFilename,
  getPlaylistFolderName,
  updateTrackDownloadFailed
} from './db'
import { downloadTrack } from './downloader'
import { analyzeAndNotifyBpm, analyzeAndNotifyKey } from './trackAnalysis'
import { getErrorMessage } from './errors'

export interface RecommendedTrack {
  videoId: string
  title: string
  artist: string
  thumbnailUrl: string
  durationMs: number
}

// Minimal shape we rely on from youtubei.js's PlaylistPanelVideo / PlaylistPanelVideoWrapper
// classes. Kept as a local duck-typed interface instead of importing the parser classes
// directly, since the "Up Next" panel also contains wrapper/automix items we don't care about.
interface PlaylistPanelVideoLike {
  video_id: string
  title?: { text?: string; toString?: () => string } | string
  author?: string
  artists?: { name: string }[]
  thumbnail?: { url: string; width: number; height: number }[]
  duration?: { seconds: number }
  primary?: PlaylistPanelVideoLike | null
}

let innertubeClient: Innertube | null = null
let innertubeClientPromise: Promise<Innertube> | null = null

// Lazily instantiate a single shared Innertube client for the app's lifetime, so recommendation
// lookups don't pay the session-setup cost on every call.
async function getInnertubeClient(): Promise<Innertube> {
  if (innertubeClient) return innertubeClient
  if (!innertubeClientPromise) {
    innertubeClientPromise = Innertube.create({ generate_session_locally: true })
  }
  innertubeClient = await innertubeClientPromise
  return innertubeClient
}

function textToString(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  const withText = value as { text?: string; toString?: () => string }
  if (withText.text) return withText.text
  if (typeof withText.toString === 'function') {
    const str = withText.toString()
    if (str && str !== '[object Object]') return str
  }
  return ''
}

function pickBestThumbnail(thumbnails?: { url: string; width: number; height: number }[]): string {
  if (!thumbnails || thumbnails.length === 0) return ''
  return [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))[0].url
}

function unwrapPanelVideo(item: unknown): PlaylistPanelVideoLike | null {
  const candidate = (item as PlaylistPanelVideoLike)?.primary ?? (item as PlaylistPanelVideoLike)
  if (candidate && typeof candidate.video_id === 'string') {
    return candidate
  }
  return null
}

function mapToRecommendedTrack(item: PlaylistPanelVideoLike): RecommendedTrack | null {
  const title = textToString(item.title)
  if (!title) return null

  const artist =
    item.artists && item.artists.length > 0
      ? item.artists.map((a) => a.name).join(', ')
      : item.author || 'Unknown Artist'

  return {
    videoId: item.video_id,
    title,
    artist,
    thumbnailUrl: pickBestThumbnail(item.thumbnail),
    durationMs: (item.duration?.seconds || 0) * 1000
  }
}

/**
 * Fetches YouTube Music's "Up Next" queue for a given video and maps it to a clean,
 * UI-ready track list. Throws a descriptive error if the video can't be found or has no
 * associated music metadata.
 */
export async function getRecommendationsForTrack(
  videoId: string,
  limit = 10
): Promise<RecommendedTrack[]> {
  if (!videoId) {
    throw new Error('Keine Video-ID angegeben.')
  }

  const yt = await getInnertubeClient()

  const trackInfo = await yt.music.getInfo(videoId).catch((err) => {
    throw new Error(
      `Video ${videoId} wurde nicht gefunden oder ist kein gültiges Musik-Video: ${getErrorMessage(err)}`
    )
  })

  if (!trackInfo) {
    throw new Error(`Für Video ${videoId} sind keine YouTube-Music-Daten verfügbar.`)
  }

  const upNext = await trackInfo.getUpNext().catch((err) => {
    throw new Error(
      `Konnte "Up Next"-Empfehlungen für ${videoId} nicht laden: ${getErrorMessage(err)}`
    )
  })

  const items = (upNext?.contents || [])
    .map((item) => unwrapPanelVideo(item))
    .filter((item): item is PlaylistPanelVideoLike => item !== null)

  const mapped: RecommendedTrack[] = []
  for (const item of items) {
    const track = mapToRecommendedTrack(item)
    if (track) mapped.push(track)
    if (mapped.length >= limit) break
  }

  return mapped
}

/**
 * Fetches recommendations for several seed tracks in parallel and merges them into a single
 * ranked list: tracks recommended by more than one seed are considered a better fit for the
 * playlist as a whole and are ranked first. Individual seed failures don't fail the whole
 * call — only if every seed fails is an error thrown.
 */
export async function getRecommendationsForPlaylist(
  seedVideoIds: string[],
  limit = 12,
  excludeVideoIds: Set<string> = new Set()
): Promise<RecommendedTrack[]> {
  const perSeedLimit = Math.max(limit, 15)
  const results = await Promise.allSettled(
    seedVideoIds.map((id) => getRecommendationsForTrack(id, perSeedLimit))
  )

  const excluded = new Set([...excludeVideoIds, ...seedVideoIds])
  const scoreByVideoId = new Map<string, number>()
  const trackByVideoId = new Map<string, RecommendedTrack>()

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const track of result.value) {
      if (excluded.has(track.videoId)) continue
      scoreByVideoId.set(track.videoId, (scoreByVideoId.get(track.videoId) || 0) + 1)
      if (!trackByVideoId.has(track.videoId)) {
        trackByVideoId.set(track.videoId, track)
      }
    }
  }

  const allFailed = results.every((r) => r.status === 'rejected')
  if (allFailed && results.length > 0) {
    const firstRejection = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
    throw new Error(getErrorMessage(firstRejection?.reason))
  }

  return [...trackByVideoId.values()]
    .sort((a, b) => (scoreByVideoId.get(b.videoId) || 0) - (scoreByVideoId.get(a.videoId) || 0))
    .slice(0, limit)
}

/**
 * Downloads a single track discovered via the Discover feature and registers it in the
 * database, mirroring the per-track logic in sync.ts's worker but for exactly one video
 * outside of a full playlist sync. Emits the same 'download-progress' IPC events as the
 * regular sync flow so the existing Tracklist/Sidebar progress UI updates without changes.
 */
export async function downloadDiscoverTrack(
  playlist: Playlist,
  track: Track,
  win: BrowserWindow
): Promise<void> {
  const settings = getSettings()
  const downloadsDir = getDownloadsDir()
  const coversDir = getCoversDir()

  const playlistFolder = getPlaylistFolderName(playlist)
  const targetDir = join(downloadsDir, playlistFolder)
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  const filename = getTrackFilename(
    playlist.id,
    track.id,
    track.artist,
    track.title,
    track.position || 0,
    0,
    settings.filenameTemplate || 'default'
  )
  const filepath = join(targetDir, filename)
  const coverPath = join(coversDir, `${playlist.id}_${track.id}.jpg`)

  const sendProgress = (percent: number): void => {
    win.webContents.send('download-progress', {
      playlistId: playlist.id,
      trackId: track.id,
      title: track.title,
      percent,
      current: 1,
      total: 1
    })
  }

  sendProgress(0)

  try {
    await downloadTrack(track.id, filepath, coverPath, playlist.title, sendProgress)

    const tags: Parameters<typeof nodeId3.write>[0] = {
      title: track.title,
      artist: track.artist,
      album: playlist.title,
      audioSourceUrl: `https://www.youtube.com/watch?v=${track.id}`
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
      if (track.duration > 0) {
        bitrate = Math.round((filesize * 8) / (track.duration * 1000))
      }
    }

    addTrack({
      ...track,
      filepath,
      coverPath,
      filesize,
      bitrate,
      downloadFailed: false
    })

    sendProgress(100)

    analyzeAndNotifyBpm(track.id, playlist.id, filepath, win).catch((err) => {
      console.error(`BPM analysis failed for discovered track ${track.id}:`, err)
    })
    analyzeAndNotifyKey(track.id, playlist.id, filepath, win).catch((err) => {
      console.error(`Key analysis failed for discovered track ${track.id}:`, err)
    })
  } catch (err) {
    console.error(`Failed to download discovered track ${track.id}:`, err)
    updateTrackDownloadFailed(track.id, playlist.id, true)
    sendProgress(100)
  }
}
