import { useEffect } from 'react'
import type { Track } from '@main/db'

interface UseTraySyncOptions {
  previewTrack: Track | null
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  advance: () => void
  previous: () => void
}

export function useTraySync({
  previewTrack,
  isPlaying,
  setIsPlaying,
  advance,
  previous
}: UseTraySyncOptions): void {
  useEffect(() => {
    window.api.sendPlayerState({
      title: previewTrack?.title ?? '',
      artist: previewTrack?.artist ?? '',
      isPlaying,
      hasTrack: !!previewTrack
    })
  }, [previewTrack, isPlaying])

  useEffect(() => {
    return window.api.onTrayControl((action) => {
      switch (action) {
        case 'play-pause':
          setIsPlaying(!isPlaying)
          break
        case 'next':
          advance()
          break
        case 'previous':
          previous()
          break
      }
    })
  }, [isPlaying, setIsPlaying, advance, previous])
}
