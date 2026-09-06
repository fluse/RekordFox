import type { Track } from './types'

// Number of consecutive failed download attempts after which a track is abandoned — excluded
// from further retries and hidden from track lists/counts.
export const MAX_DOWNLOAD_ATTEMPTS = 3

export function isDownloadAbandoned(track: Track): boolean {
  return (track.downloadAttempts ?? 0) >= MAX_DOWNLOAD_ATTEMPTS
}
