import React from 'react'
import { Music } from 'lucide-react'
import type { Track } from '@main/db'

interface PreviewPlayerTrackInfoProps {
  track: Track
  coverUrl: string
}

// Camelot wheel color – maps the number (1–12) to a hue on the color wheel
function camelotColor(camelot: string): string {
  const num = parseInt(camelot)
  if (isNaN(num)) return '#52525b'
  const hue = ((num - 1) / 12) * 360
  return `hsl(${hue}, 65%, 52%)`
}

// Picks black or white text depending on the perceived brightness of the camelot color,
// so hues like blue/purple (dark) stay readable next to yellow/green (light).
function camelotTextColor(camelot: string): string {
  const num = parseInt(camelot)
  if (isNaN(num)) return '#fafafa'
  const hue = ((num - 1) / 12) * 360
  const [r, g, b] = hslToRgb(hue, 0.65, 0.52)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 150 ? '#09090b' : '#fafafa'
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const hNorm = h / 360
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hue2rgb(p, q, hNorm + 1 / 3) * 255,
    hue2rgb(p, q, hNorm) * 255,
    hue2rgb(p, q, hNorm - 1 / 3) * 255
  ]
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
        {(track.bpm > 0 || track.key) && (
          <div className="flex items-center gap-2 mt-0.5">
            {track.bpm > 0 && (
              <span className="text-xs font-mono font-bold text-primary">
                {Math.round(track.bpm)} BPM
              </span>
            )}
            {track.key && (
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none"
                style={{
                  backgroundColor: camelotColor(track.key),
                  color: camelotTextColor(track.key)
                }}
              >
                {track.key}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PreviewPlayerTrackInfo
