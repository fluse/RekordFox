import type { Track } from '@main/db'

export interface HistoryViewProps {
  onFindSimilarTrack?: (track: Track) => void
}
