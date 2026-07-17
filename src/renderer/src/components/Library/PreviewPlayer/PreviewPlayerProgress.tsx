import React from 'react'
import { formatDuration } from '@renderer/utils/audio'

interface PreviewPlayerProgressProps {
  currentTime: number
  duration: number
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const PreviewPlayerProgress: React.FC<PreviewPlayerProgressProps> = ({
  currentTime,
  duration,
  onSeek
}) => {
  const progressPercent = (currentTime / (duration || 1)) * 100

  return (
    <div className="flex flex-col gap-1">
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={onSeek}
        className="h-1 w-full rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-primary focus:outline-none"
        style={{
          background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progressPercent}%, #27272a ${progressPercent}%, #27272a 100%)`
        }}
      />
      <div className="flex justify-between text-[10px] font-mono text-zinc-500">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  )
}

export default PreviewPlayerProgress
