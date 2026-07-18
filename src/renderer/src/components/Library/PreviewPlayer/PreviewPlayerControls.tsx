import React from 'react'
import { Pause, Play, SkipBack, SkipForward, Sparkles, Volume2, VolumeX } from 'lucide-react'

interface PreviewPlayerControlsProps {
  isPlaying: boolean
  onTogglePlay: () => void
  onPrevious: () => void
  onNext: () => void
  previousLabel: string
  nextLabel: string
  volume: number
  isMuted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  smartMode: boolean
  onToggleSmartMode: () => void
  smartModeEnableLabel: string
  smartModeDisableLabel: string
}

export const PreviewPlayerControls: React.FC<PreviewPlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  smartMode,
  onToggleSmartMode,
  smartModeEnableLabel,
  smartModeDisableLabel
}) => {
  const displayVolume = isMuted ? 0 : volume

  return (
    <div className="flex items-center justify-between mt-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleSmartMode}
          title={smartMode ? smartModeDisableLabel : smartModeEnableLabel}
          aria-pressed={smartMode}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition active:scale-95 cursor-pointer ${
            smartMode
              ? 'bg-primary/20 text-primary hover:bg-primary/30'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onPrevious}
          title={previousLabel}
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 active:scale-95 transition cursor-pointer"
        >
          <SkipBack className="h-3.5 w-3.5 fill-current" />
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 active:scale-95 transition cursor-pointer shadow-lg shadow-primary/20"
        >
          {isPlaying ? (
            <Pause className="h-4.5 w-4.5 fill-current" />
          ) : (
            <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onNext}
          title={nextLabel}
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 active:scale-95 transition cursor-pointer"
        >
          <SkipForward className="h-3.5 w-3.5 fill-current" />
        </button>
      </div>

      <div className="flex items-center gap-2 group/volume w-32">
        <button
          type="button"
          onClick={onToggleMute}
          className="text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={displayVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="h-1 w-full rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-primary focus:outline-none"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${displayVolume * 100}%, hsl(var(--secondary)) ${displayVolume * 100}%, hsl(var(--secondary)) 100%)`
          }}
        />
      </div>
    </div>
  )
}

export default PreviewPlayerControls
