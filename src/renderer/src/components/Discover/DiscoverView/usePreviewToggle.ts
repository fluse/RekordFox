import type { Track } from '@main/db'
import type { RecommendedTrack } from '@main/explore'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { getYoutubeStreamUrl } from '@renderer/utils/audio'

export interface UsePreviewToggleResult {
  previewTrackId: string | undefined
  isAnyPreviewPlaying: boolean
  togglePreview: (track: RecommendedTrack) => void
}

// Preview playback is routed through the app's single shared PreviewPlayer, exactly like
// playing a regular library track — so it gets the same volume/seek/play-pause UI for free,
// and switching to a Discover preview naturally takes over the one shared <audio> element.
export function usePreviewToggle(activePlaylistId: string | null): UsePreviewToggleResult {
  const previewTrack = usePreviewStore((s) => s.previewTrack)
  const isAnyPreviewPlaying = usePreviewStore((s) => s.isPlaying)
  const setPreviewIsPlaying = usePreviewStore((s) => s.setIsPlaying)
  const playStreamPreview = usePreviewStore((s) => s.playStreamPreview)

  const togglePreview = (track: RecommendedTrack): void => {
    if (previewTrack?.id === track.videoId) {
      setPreviewIsPlaying(!isAnyPreviewPlaying)
      return
    }

    // A minimal virtual Track — deliberately not added to the real library (empty
    // playlistId, no bpm/key/rating) — just enough for the shared player to stream it.
    const virtualTrack: Track = {
      id: track.videoId,
      playlistId: activePlaylistId || '',
      title: track.title,
      artist: track.artist,
      bpm: 0,
      key: '',
      duration: Math.round((track.durationMs || 0) / 1000),
      filepath: getYoutubeStreamUrl(track.videoId),
      coverPath: track.thumbnailUrl,
      filesize: 0,
      format: 'MP3',
      rating: 0,
      bitrate: 0
    }
    playStreamPreview(virtualTrack)
  }

  return { previewTrackId: previewTrack?.id, isAnyPreviewPlaying, togglePreview }
}
