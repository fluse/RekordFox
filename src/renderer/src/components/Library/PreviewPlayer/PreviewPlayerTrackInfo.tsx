import React from 'react'
import { Music } from 'lucide-react'
import type { Track } from '@main/db'

interface PreviewPlayerTrackInfoProps {
  track: Track
  coverUrl: string
}

export const PreviewPlayerTrackInfo: React.FC<PreviewPlayerTrackInfoProps> = ({
  track,
  coverUrl
}) => {
  return (
    <div className="flex items-center gap-3">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt="Cover"
          className="h-12 w-12 rounded object-cover border border-zinc-800 flex-shrink-0"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded border border-zinc-800 bg-zinc-900/60 text-zinc-500 flex-shrink-0">
          <Music className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm text-zinc-100 truncate" title={track.title}>
          {track.title}
        </div>
        <div className="text-xs text-zinc-400 truncate" title={track.artist}>
          {track.artist}
        </div>
      </div>
    </div>
  )
}

export default PreviewPlayerTrackInfo
