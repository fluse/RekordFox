import React from 'react'

interface CrossfaderProps {
  value: number
  onChange: (value: number) => void
}

// Horizontal A↔B crossfader.
export function Crossfader({ value, onChange }: CrossfaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center w-full pt-4 pb-2 border-t border-zinc-900/60 mt-1">
      <div className="flex justify-between w-full text-[8px] font-bold text-zinc-600 px-4">
        <span>A</span>
        <span>CENTER</span>
        <span>B</span>
      </div>
      <input
        type="range"
        min="-1.0"
        max="1.0"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-zinc-400 h-2 w-full cursor-pointer bg-zinc-900 rounded-lg outline-none mt-1"
      />
    </div>
  )
}
