import React from 'react'
import Knob from '@renderer/components/Mixer/Knob'

interface EqColumnProps {
  deck: 'A' | 'B'
  color: string
  high: number
  mid: number
  low: number
  onChange: (deck: 'A' | 'B', band: 'low' | 'mid' | 'high', val: number) => void
  side: 'left' | 'right'
}

// One deck's EQ column: HI / MID / LOW gain knobs. The left column carries a divider border.
export function EqColumn({
  deck,
  color,
  high,
  mid,
  low,
  onChange,
  side
}: EqColumnProps): React.JSX.Element {
  return (
    <div
      className={`flex flex-col items-center gap-3 ${
        side === 'left' ? 'border-r border-zinc-900/60 pr-2' : 'pl-2'
      }`}
    >
      <Knob
        label="HI"
        min={-24}
        max={12}
        value={high}
        onChange={(val) => onChange(deck, 'high', val)}
        color={color}
      />
      <Knob
        label="MID"
        min={-24}
        max={12}
        value={mid}
        onChange={(val) => onChange(deck, 'mid', val)}
        color={color}
      />
      <Knob
        label="LOW"
        min={-24}
        max={12}
        value={low}
        onChange={(val) => onChange(deck, 'low', val)}
        color={color}
      />
    </div>
  )
}
