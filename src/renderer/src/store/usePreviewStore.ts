import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '@main/db'
import {
  buildSmartQueueOrder,
  isTrackPlayable,
  DEFAULT_SMART_MODE_OPTIONS,
  type SmartModeOptions
} from '@renderer/utils/harmonicChaining'

export interface QueueEntry {
  queueId: string
  track: Track
}

export interface HistoryEntry {
  historyId: string
  track: Track
}

interface OriginContext {
  tracks: Track[]
  lastPlayedIndex: number
}

const DEFAULT_HISTORY_LIMIT = 50

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export type PreviewDockMode = 'floating' | 'sidebar'

interface PreviewState {
  previewTrack: Track | null
  isPlaying: boolean
  manualQueue: QueueEntry[]
  originContext: OriginContext | null
  history: HistoryEntry[]
  historyLimit: number
  isQueuePanelOpen: boolean
  dockMode: PreviewDockMode
  smartMode: boolean
  smartModeOptions: SmartModeOptions
  resumePosition: number

  setHistoryLimit: (limit: number) => void
  playTrack: (track: Track) => void
  playNow: (track: Track, contextTracks?: Track[]) => void
  playStreamPreview: (track: Track) => void
  stopTrack: () => void
  setIsPlaying: (isPlaying: boolean) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (queueId: string) => void
  reorderQueue: (draggedQueueId: string, targetQueueId: string, position: 'above' | 'below') => void
  insertIntoQueueAt: (track: Track, atIndex: number) => void
  toggleQueuePanel: () => void
  toggleSmartMode: () => void
  updateSmartModeOptions: (options: Partial<SmartModeOptions>) => void
  advance: () => void
  previous: () => void
  removeUpcomingTrack: (trackId: string) => void
  toggleDockMode: () => void
  syncFilepaths: (changes: { id: string; filepath: string }[]) => void
  setResumePosition: (time: number) => void
}

export const usePreviewStore = create<PreviewState>()(
  persist(
    (set, get) => {
      const setNowPlaying = (track: Track): Partial<PreviewState> => {
        const history = [{ historyId: generateId(), track }, ...get().history].slice(
          0,
          get().historyLimit
        )
        return { previewTrack: track, isPlaying: true, history, resumePosition: 0 }
      }

      // Reorders the not-yet-played tracks of the current context into a
      // BPM/key-flowing sequence, starting from the track that's playing now.
      const applySmartOrder = (): void => {
        const { originContext, smartModeOptions } = get()
        if (!originContext) return
        const { tracks, lastPlayedIndex } = originContext
        const current = tracks[lastPlayedIndex]
        const upcoming = tracks.slice(lastPlayedIndex + 1).filter(isTrackPlayable)
        if (!current || upcoming.length < 2) return
        const reordered = buildSmartQueueOrder(current, upcoming, smartModeOptions)
        set({
          originContext: {
            ...originContext,
            tracks: [...tracks.slice(0, lastPlayedIndex + 1), ...reordered]
          }
        })
      }

      return {
        previewTrack: null,
        isPlaying: false,
        manualQueue: [],
        originContext: null,
        history: [],
        historyLimit: DEFAULT_HISTORY_LIMIT,
        isQueuePanelOpen: false,
        dockMode: 'floating',
        smartMode: false,
        smartModeOptions: DEFAULT_SMART_MODE_OPTIONS,
        resumePosition: 0,

        setHistoryLimit: (limit) =>
          set((state) => ({
            historyLimit: limit,
            history: state.history.slice(0, limit)
          })),

        // Kept for backwards compatibility with existing callers; behaves like playNow without a context.
        playTrack: (track) => get().playNow(track),

        playNow: (track, contextTracks) => {
          const originContext = contextTracks
            ? {
                tracks: contextTracks,
                lastPlayedIndex: contextTracks.findIndex((t) => t.id === track.id)
              }
            : null
          set({ ...setNowPlaying(track), originContext })
          if (get().smartMode) applySmartOrder()
        },

        // Plays a track that isn't part of the library (e.g. a Discover recommendation
        // streamed directly from YouTube before it's been downloaded) through the same
        // player/UI as everything else, but deliberately skips history and any queue
        // context — it's a standalone audition, not something to resume/skip through or
        // drag into a Deck.
        playStreamPreview: (track) =>
          set({
            previewTrack: track,
            isPlaying: true,
            originContext: null,
            resumePosition: 0
          }),

        stopTrack: () => set({ previewTrack: null, isPlaying: false, resumePosition: 0 }),

        setIsPlaying: (isPlaying) => set({ isPlaying }),

        addToQueue: (track) => {
          if (!get().previewTrack) {
            get().playNow(track)
            return
          }
          set((state) => ({
            manualQueue: [...state.manualQueue, { queueId: generateId(), track }]
          }))
        },

        removeFromQueue: (queueId) =>
          set((state) => ({
            manualQueue: state.manualQueue.filter((entry) => entry.queueId !== queueId)
          })),

        reorderQueue: (draggedQueueId, targetQueueId, position) => {
          const queue = [...get().manualQueue]
          const dragIndex = queue.findIndex((entry) => entry.queueId === draggedQueueId)
          if (dragIndex === -1) return
          const [dragged] = queue.splice(dragIndex, 1)

          const targetIndex = queue.findIndex((entry) => entry.queueId === targetQueueId)
          if (targetIndex === -1) return
          const insertIndex = position === 'above' ? targetIndex : targetIndex + 1
          queue.splice(insertIndex, 0, dragged)
          set({ manualQueue: queue })
        },

        insertIntoQueueAt: (track, atIndex) => {
          const queue = [...get().manualQueue]
          const clampedIndex = Math.max(0, Math.min(atIndex, queue.length))
          queue.splice(clampedIndex, 0, { queueId: generateId(), track })
          set({ manualQueue: queue })
        },

        toggleQueuePanel: () => set((state) => ({ isQueuePanelOpen: !state.isQueuePanelOpen })),

        toggleSmartMode: () => {
          const smartMode = !get().smartMode
          set({ smartMode })
          if (smartMode) applySmartOrder()
        },

        updateSmartModeOptions: (options) => {
          set((state) => ({ smartModeOptions: { ...state.smartModeOptions, ...options } }))
          if (get().smartMode) applySmartOrder()
        },

        advance: () => {
          const { manualQueue, originContext } = get()

          if (manualQueue.length > 0) {
            const [next, ...rest] = manualQueue
            set({ ...setNowPlaying(next.track), manualQueue: rest })
            return
          }

          if (originContext) {
            let nextIndex = originContext.lastPlayedIndex + 1
            while (
              originContext.tracks[nextIndex] &&
              !isTrackPlayable(originContext.tracks[nextIndex])
            ) {
              nextIndex++
            }
            const nextTrack = originContext.tracks[nextIndex]
            if (nextTrack) {
              set({
                ...setNowPlaying(nextTrack),
                originContext: { ...originContext, lastPlayedIndex: nextIndex }
              })
              return
            }
          }

          set({ isPlaying: false })
        },

        previous: () => {
          const { history } = get()
          if (history.length < 2) return
          const [, previousEntry, ...rest] = history
          set({
            previewTrack: previousEntry.track,
            isPlaying: true,
            history: [previousEntry, ...rest]
          })
        },

        removeUpcomingTrack: (trackId) => {
          const { originContext } = get()
          if (!originContext) return
          const removeIndex = originContext.tracks.findIndex(
            (track, index) => index > originContext.lastPlayedIndex && track.id === trackId
          )
          if (removeIndex === -1) return
          const tracks = [...originContext.tracks]
          tracks.splice(removeIndex, 1)
          set({ originContext: { ...originContext, tracks } })
        },

        toggleDockMode: () =>
          set((state) => ({
            dockMode: state.dockMode === 'floating' ? 'sidebar' : 'floating'
          })),

        // Patches stale filepaths in every cached Track snapshot after the main
        // process renames a file on disk (e.g. reorder or BPM-driven rename),
        // so previously loaded tracks stay resolvable in the preview player.
        syncFilepaths: (changes) => {
          if (changes.length === 0) return
          const filepathById = new Map(changes.map((c) => [c.id, c.filepath]))
          const patchTrack = (track: Track): Track => {
            const filepath = filepathById.get(track.id)
            return filepath && filepath !== track.filepath ? { ...track, filepath } : track
          }

          set((state) => ({
            previewTrack: state.previewTrack ? patchTrack(state.previewTrack) : state.previewTrack,
            manualQueue: state.manualQueue.map((entry) => ({
              ...entry,
              track: patchTrack(entry.track)
            })),
            originContext: state.originContext
              ? { ...state.originContext, tracks: state.originContext.tracks.map(patchTrack) }
              : state.originContext,
            history: state.history.map((entry) => ({ ...entry, track: patchTrack(entry.track) }))
          }))
        },

        setResumePosition: (time) => set({ resumePosition: time })
      }
    },
    {
      name: 'rekordfox-history-storage',
      partialize: (state) => ({
        history: state.history,
        dockMode: state.dockMode,
        smartMode: state.smartMode,
        smartModeOptions: state.smartModeOptions,
        previewTrack: state.previewTrack,
        manualQueue: state.manualQueue,
        originContext: state.originContext,
        resumePosition: state.resumePosition
      })
    }
  )
)
