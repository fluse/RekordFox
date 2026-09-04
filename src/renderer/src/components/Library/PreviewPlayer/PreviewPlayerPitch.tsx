import React from 'react'
import { RotateCcw } from 'lucide-react'
import type { Track } from '@main/db'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import {
  PITCH_MIN,
  PITCH_MAX,
  formatPitchPercent,
  formatAdjustedBpm,
  computePitchFillRange
} from './pitchUtils'

interface PreviewPlayerPitchProps {
  track: Track | null
  pitch: number
  onPitchChange: (pitch: number) => void
  label: string
  resetLabel: string
}

export const PreviewPlayerPitch: React.FC<PreviewPlayerPitchProps> = ({
  track,
  pitch,
  onPitchChange,
  label,
  resetLabel
}) => {
  const pitchDisplay = formatPitchPercent(pitch)
  const displayBpm = track ? formatAdjustedBpm(track.bpm, pitch) : null
  const isReset = pitch === 1.0
  const [fillStart, fillEnd] = computePitchFillRange(pitch)

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="relative flex-1">
        {/* Dead-center tick — the slider also magnetically snaps here while dragging */}
        <div className="absolute left-1/2 top-1/2 h-2 w-[1px] -translate-x-1/2 -translate-y-1/2 bg-zinc-600 pointer-events-none" />
        <input
          type="range"
          min={PITCH_MIN}
          max={PITCH_MAX}
          step={0.001}
          value={pitch}
          onChange={(e) => onPitchChange(parseFloat(e.target.value))}
          onDoubleClick={() => onPitchChange(1.0)}
          className="h-1 w-full rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-primary focus:outline-none"
          style={{
            background: `linear-gradient(to right, hsl(var(--secondary)) 0%, hsl(var(--secondary)) ${fillStart}%, hsl(var(--primary)) ${fillStart}%, hsl(var(--primary)) ${fillEnd}%, hsl(var(--secondary)) ${fillEnd}%, hsl(var(--secondary)) 100%)`
          }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-[10px] font-mono text-zinc-400">
        {displayBpm ? `${displayBpm} BPM` : pitchDisplay}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onPitchChange(1.0)}
            disabled={isReset}
            className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 hover:text-zinc-100 disabled:opacity-20 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{resetLabel}</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default PreviewPlayerPitch
