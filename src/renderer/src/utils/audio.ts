import MusicTempo from 'music-tempo'

// Convert a file path to the custom media URL. Some Track objects (e.g. a Discover preview
// that streams from YouTube rather than a downloaded file) already carry a directly-usable
// media://... URL in `filepath` — pass those through unchanged instead of treating them as a
// raw filesystem path.
export function getMediaUrl(filepath: string): string {
  if (/^(https?:|media:)/i.test(filepath)) return filepath

  const normalizedPath = filepath.replace(/\\/g, '/')
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath
  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/')
  return `media://local/${encodedPath}`
}

// Build the URL for previewing a YouTube video's audio directly, without downloading it first —
// the main process resolves and proxies the actual stream (see media.ts).
export function getYoutubeStreamUrl(videoId: string): string {
  return `media://youtube/${encodeURIComponent(videoId)}`
}

// Decode audio file and compute BPM using music-tempo
export async function calculateBpm(filepath: string): Promise<number> {
  const url = getMediaUrl(filepath)

  // 1. Fetch the file data
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch audio for BPM analysis: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()

  // 2. Decode the audio data using OfflineAudioContext (bypasses autoplay policy and hardware limits)
  const offlineCtx = new OfflineAudioContext(1, 44100 * 30, 44100)
  const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer)

  // We only need one channel for beat detection (mono is fine)
  const channelData = audioBuffer.getChannelData(0)

  // Slice to first 60 seconds to speed up analysis and prevent thread blocking
  const sliceLength = Math.min(channelData.length, 44100 * 60)
  const slicedData = channelData.slice(0, sliceLength)

  // Run music-tempo beat detection
  const mt = new MusicTempo(slicedData)

  // Return rounded tempo
  return Math.round(mt.tempo)
}

// Format duration from seconds to MM:SS
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}
