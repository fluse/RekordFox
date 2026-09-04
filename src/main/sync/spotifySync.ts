import { BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync, statSync, mkdirSync, readFileSync } from 'fs'
import {
  Playlist,
  Track,
  addTrack,
  updatePlaylistStatus,
  getDownloadsDir,
  getCoversDir,
  getTracksForPlaylist,
  recordTrackDownloadFailure,
  recordTrackDownloadSuccess,
  isDownloadAbandoned,
  getSettings,
  getTrackFilename,
  getPlaylistFolderName
} from '../db'
import { getPlaylistInfo, downloadTrack, YtVideo } from '../media/downloader'
import { getSpotifyPlaylistInfo, SpotifyTrackInfo } from '../auth/spotifyApi'
import { hasSpotifyAccount } from '../auth/spotifyOAuth'
import { beginPlaylistSync, endPlaylistSync } from './sync'
import { analyzeAndNotifyBpm, analyzeAndNotifyKey } from '../analysis/trackAnalysis'
import nodeId3 from 'node-id3'

// How many YouTube search results to consider per track when picking the closest duration match.
const SEARCH_CANDIDATES = 5
// A match further than this from the Spotify track's duration is still used (best effort), but
// logged as low-confidence — no perfect metadata match exists on YouTube for every track.
const DURATION_CONFIDENCE_THRESHOLD_SEC = 10

// Searches YouTube for a Spotify track and picks the candidate whose duration is closest to
// Spotify's — the same duration-matching heuristic every "Spotify to MP3" tool relies on, since
// Spotify's API never exposes full-track audio itself.
async function matchYoutubeTrack(spotifyTrack: SpotifyTrackInfo): Promise<YtVideo | null> {
  const query = `ytsearch${SEARCH_CANDIDATES}:${spotifyTrack.artist} - ${spotifyTrack.title}`
  let candidates
  try {
    candidates = await getPlaylistInfo(query)
  } catch (e) {
    console.error(`YouTube search failed for "${spotifyTrack.artist} - ${spotifyTrack.title}":`, e)
    return null
  }
  if (!candidates.entries.length) return null

  let best = candidates.entries[0]
  let bestDiff = Math.abs((best.duration || 0) - spotifyTrack.duration)
  for (const entry of candidates.entries.slice(1)) {
    const diff = Math.abs((entry.duration || 0) - spotifyTrack.duration)
    if (diff < bestDiff) {
      best = entry
      bestDiff = diff
    }
  }
  if (bestDiff > DURATION_CONFIDENCE_THRESHOLD_SEC) {
    console.warn(
      `Low-confidence YouTube match for "${spotifyTrack.artist} - ${spotifyTrack.title}" ` +
        `(closest candidate is ${bestDiff}s off).`
    )
  }
  return best
}

// Syncs a 'spotify' playlist: pulls track metadata from the Spotify Web API, matches each track to
// a YouTube video (closest-duration search result) and downloads it through the same yt-dlp engine
// used for 'local' playlists (downloadTrack in downloader.ts). Add-only and order-preserving like
// syncLocalPlaylist — a track removed on Spotify's side is never deleted locally, and existing
// tracks never get repositioned.
export async function syncSpotifyPlaylist(playlist: Playlist, win: BrowserWindow): Promise<void> {
  // Checked before beginPlaylistSync/the try-block below (which reduces any thrown error to a
  // bare 'error' status) so a missing connection surfaces as this actionable message on the
  // manual "Sync now" button instead of the generic "Sync failed. Check the logs for details."
  if (!hasSpotifyAccount()) {
    throw new Error('Connect your Spotify account in Settings first, then sync again.')
  }

  if (!beginPlaylistSync(playlist.id)) {
    console.log(`Sync for playlist ${playlist.id} already running.`)
    return
  }

  updatePlaylistStatus(playlist.id, 'syncing')
  win.webContents.send('sync-status-changed', playlist.id, 'syncing')

  try {
    const spotifyPlaylist = await getSpotifyPlaylistInfo(playlist.url)
    const localTracks = getTracksForPlaylist(playlist.id)
    const localBySpotifyId = new Map(
      localTracks.filter((t) => t.spotifyTrackId).map((t) => [t.spotifyTrackId as string, t])
    )
    const spotifyById = new Map(spotifyPlaylist.tracks.map((s) => [s.id, s]))

    // Keep title/artist/duration in lockstep with Spotify for tracks already synced — the DJ's
    // local order/rating/bpm/etc. are left untouched, matching syncLocalPlaylist's philosophy.
    for (const track of localTracks) {
      if (!track.spotifyTrackId) continue
      const spotifyTrack = spotifyById.get(track.spotifyTrackId)
      if (!spotifyTrack) continue
      let trackUpdated = false
      if (track.title !== spotifyTrack.title) {
        track.title = spotifyTrack.title
        trackUpdated = true
      }
      if (track.artist !== spotifyTrack.artist) {
        track.artist = spotifyTrack.artist
        trackUpdated = true
      }
      if (track.duration !== spotifyTrack.duration) {
        track.duration = spotifyTrack.duration
        trackUpdated = true
      }
      if (trackUpdated) addTrack(track)
    }

    // Match every not-yet-synced Spotify track to a YouTube video and pre-create a placeholder
    // track row for it — mirrors syncLocalPlaylist's placeholder step, so download-failure/retry
    // tracking (recordTrackDownloadFailure/isDownloadAbandoned) works from the very first attempt.
    let addedPlaceholders = false
    for (const spotifyTrack of spotifyPlaylist.tracks) {
      if (localBySpotifyId.has(spotifyTrack.id)) continue
      const match = await matchYoutubeTrack(spotifyTrack)
      if (!match) {
        console.error(
          `No YouTube match found for "${spotifyTrack.artist} - ${spotifyTrack.title}", skipping.`
        )
        continue
      }
      const placeholderTrack: Track = {
        id: match.id,
        playlistId: playlist.id,
        title: spotifyTrack.title,
        artist: spotifyTrack.artist,
        bpm: 0,
        key: '',
        duration: spotifyTrack.duration,
        filepath: '',
        coverPath: '',
        filesize: 0,
        format: 'MP3',
        rating: 0,
        bitrate: 0,
        spotifyTrackId: spotifyTrack.id
      }
      addTrack(placeholderTrack)
      addedPlaceholders = true
    }

    const currentLocalTracks = addedPlaceholders ? getTracksForPlaylist(playlist.id) : localTracks

    const toDownload = currentLocalTracks.filter((t) => {
      if (!t.spotifyTrackId) return false
      if (isDownloadAbandoned(t)) return false
      return !existsSync(t.filepath) || !existsSync(t.coverPath)
    })

    if (addedPlaceholders) {
      // Let the frontend reload the track list immediately, before downloads finish.
      win.webContents.send('sync-status-changed', playlist.id, 'syncing')
    }

    const settings = getSettings()
    const maxWorkers = settings.maxWorkers || 1
    const downloadsDir = getDownloadsDir()
    const coversDir = getCoversDir()
    const playlistFolder = getPlaylistFolderName(playlist)
    const targetDir = join(downloadsDir, playlistFolder)
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    let downloadedCount = 0
    const queue = [...toDownload]

    const worker = async (): Promise<void> => {
      while (queue.length > 0) {
        const track = queue.shift()
        if (!track) break

        // The Spotify track may have dropped off the remote playlist since its placeholder was
        // created — still redownload using the track's own stored metadata rather than skipping it.
        const spotifyTrack = track.spotifyTrackId
          ? spotifyById.get(track.spotifyTrackId)
          : undefined
        const title = spotifyTrack?.title || track.title
        const artist = spotifyTrack?.artist || track.artist
        const album = spotifyTrack?.album || spotifyPlaylist.title
        const duration = spotifyTrack?.duration || track.duration
        const coverUrl = spotifyTrack?.coverUrl

        const filename = getTrackFilename(
          playlist.id,
          track.id,
          artist,
          title,
          track.position || 0,
          track.bpm || 0,
          settings.filenameTemplate || 'custom'
        )
        const filepath = join(targetDir, filename)
        const coverPath = join(coversDir, `${playlist.id}_${track.id}.jpg`)

        const currentDownloadIndex = ++downloadedCount

        win.webContents.send('download-progress', {
          playlistId: playlist.id,
          trackId: track.id,
          title,
          percent: 0,
          current: currentDownloadIndex,
          total: toDownload.length
        })

        try {
          await downloadTrack(
            track.id,
            filepath,
            coverPath,
            album,
            (percent) => {
              win.webContents.send('download-progress', {
                playlistId: playlist.id,
                trackId: track.id,
                title,
                percent,
                current: currentDownloadIndex,
                total: toDownload.length
              })
            },
            coverUrl
          )

          const tags: Parameters<typeof nodeId3.write>[0] = {
            title,
            artist,
            album,
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
          try {
            if (existsSync(filepath)) {
              filesize = statSync(filepath).size
              if (duration > 0) {
                bitrate = Math.round((filesize * 8) / (duration * 1000))
              }
            }
          } catch (e) {
            console.error('Failed to get track filesize:', e)
          }

          addTrack({
            ...track,
            title,
            artist,
            duration,
            filepath,
            coverPath,
            filesize,
            format: 'MP3',
            bitrate
          })
          recordTrackDownloadSuccess(track.id, playlist.id)

          win.webContents.send('download-progress', {
            playlistId: playlist.id,
            trackId: track.id,
            title,
            percent: 100,
            current: currentDownloadIndex,
            total: toDownload.length
          })

          analyzeAndNotifyBpm(track.id, playlist.id, filepath, win).catch((err) => {
            console.error(`BPM analysis failed for track ${track.id}:`, err)
          })
          analyzeAndNotifyKey(track.id, playlist.id, filepath, win).catch((err) => {
            console.error(`Key analysis failed for track ${track.id}:`, err)
          })
        } catch (err) {
          console.error(`Failed to download track ${track.id}:`, err)
          recordTrackDownloadFailure(track.id, playlist.id)
          win.webContents.send('download-progress', {
            playlistId: playlist.id,
            trackId: track.id,
            title,
            percent: 100,
            current: currentDownloadIndex,
            total: toDownload.length
          })
        }
      }
    }

    const workers: Promise<void>[] = []
    const numWorkers = Math.max(1, Math.min(12, maxWorkers))
    for (let i = 0; i < numWorkers; i++) {
      workers.push(worker())
    }
    await Promise.all(workers)

    const now = new Date().toISOString()
    updatePlaylistStatus(playlist.id, 'idle', now)
    win.webContents.send('sync-status-changed', playlist.id, 'idle', now)
  } catch (e) {
    console.error(`Sync failed for playlist ${playlist.id}:`, e)
    updatePlaylistStatus(playlist.id, 'error')
    win.webContents.send('sync-status-changed', playlist.id, 'error')
  } finally {
    endPlaylistSync(playlist.id)
  }
}
