import React from 'react'
import { Lock, Unlock } from 'lucide-react'
import type { Track } from '@main/db'
import { useLanguage } from '@renderer/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'

interface PitchControllerProps {
  track: Track | null
  filterLowNode: BiquadFilterNode | null
  pitch: number
  keyLock: boolean
  keyShift: number
  handlePitchChange: (value: number) => void
  toggleKeyLock: () => void
  handleKeyShiftChange: (semitones: number) => void
  startNudge: (direction: 'up' | 'down') => void
  stopNudge: () => void
}

export const PitchController: React.FC<PitchControllerProps> = ({
  track,
  filterLowNode,
  pitch,
  keyLock,
  keyShift,
  handlePitchChange,
  toggleKeyLock,
  handleKeyShiftChange,
  startNudge,
  stopNudge
}) => {
  const { t } = useLanguage()
  const pitchPercent = ((pitch - 1.0) * 100).toFixed(2)
  const pitchDisplay = pitchPercent.startsWith('-') ? `${pitchPercent}%` : `+${pitchPercent}%`

  return (
    <div className="col-span-4 flex flex-col items-center border-l border-zinc-900 pl-3 select-none">
      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">PITCH</div>

      {/* Pitch Slider & Nudge Buttons */}
      <div className="flex-1 flex flex-col items-center justify-between w-full relative min-h-[150px] py-1 bg-zinc-950/40 rounded-lg border border-zinc-900/50">
        {/* Nudge Up Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onMouseDown={() => startNudge('up')}
              onMouseUp={stopNudge}
              onMouseLeave={stopNudge}
              onTouchStart={() => startNudge('up')}
              onTouchEnd={stopNudge}
              disabled={!track || !filterLowNode}
              className="relative z-10 w-7 h-6 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 active:bg-primary active:text-white text-zinc-400 text-xs font-bold transition disabled:opacity-20 cursor-pointer shadow-sm border border-zinc-800/40"
            >
              +
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('deck.pitchBendUpTooltip')}</TooltipContent>
        </Tooltip>

        {/* Pitch Slider with center detent notch */}
        <div className="relative flex-1 flex items-center justify-center w-full h-[90px]">
          {/* Zero/Center line indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 w-3 h-[1px] bg-zinc-700/60 pointer-events-none" />

          <input
            type="range"
            min="0.84"
            max="1.16"
            step="0.001"
            value={pitch}
            onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
            disabled={!track || !filterLowNode}
            className="absolute accent-primary h-2 w-[80px] cursor-pointer rotate-270 bg-zinc-900 rounded-lg outline-none"
          />
        </div>

        {/* Nudge Down Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onMouseDown={() => startNudge('down')}
              onMouseUp={stopNudge}
              onMouseLeave={stopNudge}
              onTouchStart={() => startNudge('down')}
              onTouchEnd={stopNudge}
              disabled={!track || !filterLowNode}
              className="relative z-10 w-7 h-6 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 active:bg-primary active:text-white text-zinc-400 text-xs font-bold transition disabled:opacity-20 cursor-pointer shadow-sm border border-zinc-800/40"
            >
              -
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('deck.pitchBendDownTooltip')}</TooltipContent>
        </Tooltip>
      </div>

      {/* Pitch percentage text */}
      <div className="text-[10px] font-mono font-bold text-zinc-400 mt-2 mb-1">
        {track ? pitchDisplay : '±0.00%'}
      </div>

      {/* Key Lock toggle */}
      <button
        onClick={toggleKeyLock}
        disabled={!track || !filterLowNode}
        className={`w-full flex items-center justify-center gap-1 rounded py-1 text-[9px] font-bold transition ${
          keyLock
            ? 'bg-zinc-900 text-primary border border-primary/30 shadow-[0_0_10px_rgba(234,88,12,0.05)]'
            : 'bg-zinc-950 text-zinc-500 border border-zinc-900'
        } disabled:opacity-30`}
      >
        {keyLock ? (
          <>
            <Lock className="h-2.5 w-2.5 animate-pulse" /> KeyLock
          </>
        ) : (
          <>
            <Unlock className="h-2.5 w-2.5" /> KeyLock
          </>
        )}
      </button>

      {/* Key Shift Transpose Widget */}
      <div className="w-full flex items-center justify-between mt-1.5 px-1 bg-zinc-950 rounded border border-zinc-900 text-[9px] h-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleKeyShiftChange(keyShift - 1)}
              disabled={!track || !filterLowNode || keyShift <= -12}
              className="w-4 h-4 flex items-center justify-center rounded text-zinc-500 hover:text-white disabled:opacity-20 font-bold transition"
            >
              ◀
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('deck.keyShiftDownTooltip')}</TooltipContent>
        </Tooltip>
        <span className="font-mono text-[9px] text-zinc-400 font-bold">
          KEY: {keyShift > 0 ? `+${keyShift}` : keyShift}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleKeyShiftChange(keyShift + 1)}
              disabled={!track || !filterLowNode || keyShift >= 12}
              className="w-4 h-4 flex items-center justify-center rounded text-zinc-500 hover:text-white disabled:opacity-20 font-bold transition"
            >
              ▶
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('deck.keyShiftUpTooltip')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default PitchController
