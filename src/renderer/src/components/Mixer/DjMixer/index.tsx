import React from 'react'
import Deck from '@renderer/components/Deck'
import Mixer from '@renderer/components/Mixer/Mixer'
import type { Track } from '@main/db'
import { useAudioGraph } from './useAudioGraph'

interface DjMixerProps {
  trackA: Track | null
  trackB: Track | null
  onLoadTrack: (track: Track, deck: 'A' | 'B') => void
}

export default function DjMixer({ trackA, trackB, onLoadTrack }: DjMixerProps): React.JSX.Element {
  // Initialize the Web Audio graph (master + crossfader gains) once on mount.
  useAudioGraph()

  return (
    <div className="flex items-center justify-center gap-6 p-6">
      {/* DECK A */}
      <Deck
        deckId="A"
        track={trackA}
        opponentBpm={trackB && trackB.bpm > 0 ? trackB.bpm : null}
        onLoadTrack={(t) => onLoadTrack(t, 'A')}
      />

      {/* CENTER MIXER */}
      <Mixer />

      {/* DECK B */}
      <Deck
        deckId="B"
        track={trackB}
        opponentBpm={trackA && trackA.bpm > 0 ? trackA.bpm : null}
        onLoadTrack={(t) => onLoadTrack(t, 'B')}
      />
    </div>
  )
}
