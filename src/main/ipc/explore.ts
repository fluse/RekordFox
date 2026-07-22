import { ipcMain } from 'electron'
import {
  getPlaylists,
  getTracks,
  getTracksForPlaylist,
  addTrack,
  Track,
  getDiscoverBlacklist,
  addToDiscoverBlacklist,
  removeFromDiscoverBlacklist
} from '../db'
import {
  getRecommendationsForTrack,
  getRecommendationsForPlaylist,
  downloadDiscoverTrack,
  RecommendedTrack
} from '../explore'
import { getStreamUrl } from '../downloader'
import { ipcTry } from '../errors'
import { getMainWindow } from '../window'

// How many seed tracks to use when no single track is specified — more seeds gives broader,
// better-ranked recommendations at the cost of extra requests.
const SEED_TRACK_COUNT = 6

// Picks seed tracks that represent the playlist's actual artist mix, rather than just whatever
// was added most recently (which can be a handful of tracks from a single binge and gives
// recommendations that don't reflect the rest of the playlist at all). One track per distinct
// artist, prioritizing artists with the most tracks in the playlist — they define its "core"
// sound — and picking each artist's most recently added track as that artist's representative.
function pickSeedTracks(tracks: Track[], count: number): Track[] {
  const tracksByArtist = new Map<string, Track[]>()
  for (const track of tracks) {
    const artistKey = track.artist.trim().toLowerCase()
    if (!artistKey) continue
    const group = tracksByArtist.get(artistKey)
    if (group) group.push(track)
    else tracksByArtist.set(artistKey, [track])
  }

  const artistsByFrequency = [...tracksByArtist.values()].sort((a, b) => b.length - a.length)

  return artistsByFrequency.slice(0, count).map(
    (artistTracks) =>
      [...artistTracks].sort((a, b) => {
        const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0
        const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0
        return dateB - dateA
      })[0]
  )
}

// How many recommended tracks to eagerly pre-resolve a stream URL for once a Discover result
// set loads, so clicking play on one of these starts instantly instead of waiting on yt-dlp.
const PREFETCH_COUNT = 8
const PREFETCH_CONCURRENCY = 3

async function prefetchStreamUrls(videoIds: string[]): Promise<void> {
  const queue = videoIds.slice(0, PREFETCH_COUNT)
  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const videoId = queue.shift()
      if (!videoId) break
      await getStreamUrl(videoId).catch(() => {
        // Ignore — this is a best-effort warm-up, a real error surfaces when the user presses play.
      })
    }
  }
  await Promise.all(Array.from({ length: PREFETCH_CONCURRENCY }, () => worker()))
}

export function registerExploreIpc(): void {
  ipcMain.handle(
    'explore:get-recommendations',
    (_, params: { playlistId: string; seedTrackId?: string; limit?: number }) =>
      ipcTry(
        async () => {
          const { playlistId, seedTrackId, limit = 12 } = params
          const excludedVideoIds = new Set([
            ...getTracks().map((t) => t.id),
            ...getDiscoverBlacklist()
          ])

          if (seedTrackId) {
            const recommendations = (await getRecommendationsForTrack(seedTrackId, limit)).filter(
              (r) => !excludedVideoIds.has(r.videoId)
            )
            return { recommendations }
          }

          const seedIds = pickSeedTracks(getTracksForPlaylist(playlistId), SEED_TRACK_COUNT).map(
            (t) => t.id
          )

          if (seedIds.length === 0) {
            return { recommendations: [] }
          }

          const recommendations = await getRecommendationsForPlaylist(
            seedIds,
            limit,
            excludedVideoIds
          )
          return { recommendations }
        },
        { onError: (e) => console.error('Error fetching Discover recommendations:', e) }
      )
  )

  ipcMain.handle('explore:add-track', (_, playlistId: string, track: RecommendedTrack) =>
    ipcTry(
      async () => {
        const playlist = getPlaylists().find((p) => p.id === playlistId)
        if (!playlist) {
          throw new Error('Playlist nicht gefunden.')
        }

        const alreadyExists = getTracksForPlaylist(playlistId).some((t) => t.id === track.videoId)
        if (alreadyExists) {
          return {}
        }

        const placeholder: Track = {
          id: track.videoId,
          playlistId,
          title: track.title,
          artist: track.artist,
          bpm: 0,
          key: '',
          duration: Math.round((track.durationMs || 0) / 1000),
          filepath: '',
          coverPath: '',
          filesize: 0,
          format: 'MP3',
          rating: 0,
          bitrate: 0,
          source: 'discover'
        }
        addTrack(placeholder)

        const mainWindow = getMainWindow()
        if (mainWindow) {
          mainWindow.webContents.send('tracks-updated')
          const savedTrack = getTracksForPlaylist(playlistId).find((t) => t.id === track.videoId)
          if (savedTrack) {
            downloadDiscoverTrack(playlist, savedTrack, mainWindow).catch((err) =>
              console.error('Failed to download discovered track:', err)
            )
          }
        }

        return {}
      },
      { onError: (e) => console.error('Error adding Discover track:', e) }
    )
  )

  ipcMain.handle('explore:blacklist-track', (_, videoId: string) =>
    ipcTry(() => {
      addToDiscoverBlacklist(videoId)
      return {}
    })
  )

  ipcMain.handle('explore:unblacklist-track', (_, videoId: string) =>
    ipcTry(() => {
      removeFromDiscoverBlacklist(videoId)
      return {}
    })
  )

  ipcMain.on('explore:prefetch-streams', (_, videoIds: string[]) => {
    prefetchStreamUrls(videoIds).catch((err) =>
      console.error('Error prefetching Discover stream URLs:', err)
    )
  })
}
