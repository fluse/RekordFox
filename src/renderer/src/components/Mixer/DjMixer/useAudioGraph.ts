import { useEffect } from 'react'
import { useMixerStore } from '@renderer/store/useMixerStore'

// Sets up the Web Audio graph once on mount: master gain + per-deck crossfader gains routed to
// the destination, seeded from the store with an equal-power crossfade curve. Tears the context
// down and clears the stored nodes on unmount.
export function useAudioGraph(): void {
  useEffect(() => {
    const ctx = new (
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    )()

    // Create nodes
    const masterGainNode = ctx.createGain()
    const crossfaderGainANode = ctx.createGain()
    const crossfaderGainBNode = ctx.createGain()

    // Route: Crossfaders -> Master Gain -> Destination
    crossfaderGainANode.connect(masterGainNode)
    crossfaderGainBNode.connect(masterGainNode)
    masterGainNode.connect(ctx.destination)

    // Set initial volumes
    const { masterVolume, crossfader, setAudioNodes } = useMixerStore.getState()
    masterGainNode.gain.value = masterVolume

    // Set initial crossfader gains based on the equal-power crossfade curve
    const x = (crossfader + 1.0) / 2.0
    const gainA = Math.cos((x * Math.PI) / 2)
    const gainB = Math.sin((x * Math.PI) / 2)
    crossfaderGainANode.gain.value = gainA
    crossfaderGainBNode.gain.value = gainB

    setAudioNodes(ctx, masterGainNode, crossfaderGainANode, crossfaderGainBNode)

    return () => {
      ctx.close()
      useMixerStore.getState().clearAudioNodes()
    }
  }, [])
}
