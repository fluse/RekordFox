import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Track } from '@main/db'
import { useLanguage } from '@renderer/i18n'

interface TrackTrashZoneProps {
  // True while a track is being dragged (native HTML5 drag) somewhere in the app.
  visible: boolean
  onRemoveTrack: (track: Track) => void
}

// A drop target that springs up from the bottom-centre of the window while a track is being
// dragged, then gently bobs to invite a drop. Releasing a track onto it removes that track from
// its playlist. Positioning, entrance and idle-float are split across nested layers (see
// main.css) so their transforms never conflict; hover emphasis is pure colour/scale on the
// non-transformed inner card.
export default function TrackTrashZone({
  visible,
  onRemoveTrack
}: TrackTrashZoneProps): React.JSX.Element | null {
  const { t } = useLanguage()
  const [isOver, setIsOver] = useState(false)

  if (!visible) return null

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsOver(false)
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const track = JSON.parse(raw) as Track
      onRemoveTrack(track)
    } catch {
      // Not a track payload — ignore.
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      <div className="trash-zone-enter">
        <div className={`trash-zone-bob relative ${isOver ? 'is-over' : ''}`}>
          {/* Soft glow that intensifies on hover */}
          <div
            className={`pointer-events-none absolute -inset-3 rounded-[28px] blur-2xl transition-all duration-300 ${
              isOver ? 'bg-red-500/30 opacity-100' : 'bg-red-500/10 opacity-70'
            }`}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setIsOver(true)
            }}
            onDragLeave={() => setIsOver(false)}
            onDrop={handleDrop}
            className={`pointer-events-auto relative flex items-center gap-3.5 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl transition-colors duration-200 ${
              isOver ? 'border-red-500/80 bg-red-950/95' : 'border-zinc-700/80 bg-zinc-900/98'
            }`}
          >
            {/* Icon badge with a pulsing ring while hovering */}
            <div
              className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                isOver ? 'scale-110 bg-red-500/25' : 'bg-zinc-800/80'
              }`}
            >
              {isOver && (
                <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
              )}
              <Trash2
                className={`relative h-5 w-5 transition-all duration-200 ${
                  isOver ? 'rotate-6 text-red-300' : 'text-zinc-400'
                }`}
              />
            </div>

            <div className="flex flex-col pr-1">
              <span
                className={`text-sm font-semibold leading-tight transition-colors duration-200 ${
                  isOver ? 'text-red-200' : 'text-zinc-200'
                }`}
              >
                {isOver ? t('tracklist.trashDropActive') : t('tracklist.trashDropLabel')}
              </span>
              <span
                className={`text-[11px] leading-tight transition-colors duration-200 ${
                  isOver ? 'text-red-300/70' : 'text-zinc-500'
                }`}
              >
                {t('tracklist.trashDropHint')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
