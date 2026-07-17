import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '@main/db'

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

const HISTORY_LIMIT = 50

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

interface PreviewState {
  previewTrack: Track | null
  isPlaying: boolean
  manualQueue: QueueEntry[]
  originContext: OriginContext | null
  history: HistoryEntry[]
  isQueuePanelOpen: boolean

  playTrack: (track: Track) => void
  playNow: (track: Track, contextTracks?: Track[]) => void
  stopTrack: () => void
  setIsPlaying: (isPlaying: boolean) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (queueId: string) => void
  reorderQueue: (draggedQueueId: string, targetQueueId: string, position: 'above' | 'below') => void
  insertIntoQueueAt: (track: Track, atIndex: number) => void
  toggleQueuePanel: () => void
  advance: () => void
  previous: () => void
  removeUpcomingTrack: (trackId: string) => void
}

export const usePreviewStore = create<PreviewState>()(
  persist(
    (set, get) => {
      const setNowPlaying = (track: Track): Partial<PreviewState> => {
        const history = [{ historyId: generateId(), track }, ...get().history].slice(
          0,
          HISTORY_LIMIT
        )
        return { previewTrack: track, isPlaying: true, history }
      }

      return {
        previewTrack: null,
        isPlaying: false,
        manualQueue: [],
        originContext: null,
        history: [],
        isQueuePanelOpen: false,

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
        },

        stopTrack: () => set({ previewTrack: null, isPlaying: false }),

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

        advance: () => {
          const { manualQueue, originContext } = get()

          if (manualQueue.length > 0) {
            const [next, ...rest] = manualQueue
            set({ ...setNowPlaying(next.track), manualQueue: rest })
            return
          }

          if (originContext) {
            const nextIndex = originContext.lastPlayedIndex + 1
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
        }
      }
    },
    {
      name: 'rekordfox-history-storage',
      partialize: (state) => ({ history: state.history })
    }
  )
)
