import { create } from 'zustand'
import type { Track } from '@main/db'

interface PreviewState {
  previewTrack: Track | null
  isPlaying: boolean
  playTrack: (track: Track) => void
  stopTrack: () => void
  setIsPlaying: (isPlaying: boolean) => void
}

export const usePreviewStore = create<PreviewState>((set) => ({
  previewTrack: null,
  isPlaying: false,
  playTrack: (track) => set({ previewTrack: track, isPlaying: true }),
  stopTrack: () => set({ previewTrack: null, isPlaying: false }),
  setIsPlaying: (isPlaying) => set({ isPlaying })
}))
