import React from 'react'

interface VolumeFaderProps {
  label: string
  value: number
  onChange: (value: number) => void
  accentClassName: string
  labelClassName: string
  containerClassName?: string
}

// A single vertical volume fader (channel A/B or master). Visual accent is supplied by the caller.
export function VolumeFader({
  label,
  value,
  onChange,
  accentClassName,
  labelClassName,
  containerClassName = ''
}: VolumeFaderProps): React.JSX.Element {
  return (
    <div
      className={`flex flex-col items-center relative h-[90px] justify-between ${containerClassName}`}
    >
      <span className={`text-[9px] font-bold ${labelClassName}`}>{label}</span>
      <input
        type="range"
        min="0"
        max="1.0"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`${accentClassName} h-1.5 w-14 cursor-pointer bg-zinc-900 rounded-lg outline-none rotate-270`}
      />
      <span className="text-[9px] font-mono text-zinc-500">{Math.round(value * 100)}%</span>
    </div>
  )
}
