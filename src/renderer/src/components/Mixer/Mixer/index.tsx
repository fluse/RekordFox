import React from 'react'
import { useMixerStore } from '@renderer/store/useMixerStore'
import { EqColumn } from './components/EqColumn'
import { VolumeFader } from './components/VolumeFader'
import { Crossfader } from './components/Crossfader'

export default function Mixer(): React.JSX.Element {
  const eqLowA = useMixerStore((state) => state.eqLowA)
  const eqMidA = useMixerStore((state) => state.eqMidA)
  const eqHighA = useMixerStore((state) => state.eqHighA)
  const volumeA = useMixerStore((state) => state.volumeA)

  const eqLowB = useMixerStore((state) => state.eqLowB)
  const eqMidB = useMixerStore((state) => state.eqMidB)
  const eqHighB = useMixerStore((state) => state.eqHighB)
  const volumeB = useMixerStore((state) => state.volumeB)

  const crossfader = useMixerStore((state) => state.crossfader)
  const masterVolume = useMixerStore((state) => state.masterVolume)

  const setEq = useMixerStore((state) => state.setEq)
  const setVolume = useMixerStore((state) => state.setVolume)
  const setCrossfader = useMixerStore((state) => state.setCrossfader)
  const setMasterVolume = useMixerStore((state) => state.setMasterVolume)

  return (
    <div className="flex flex-col items-center justify-between border border-zinc-900 bg-zinc-950 px-4 py-4 rounded-xl shadow-lg w-[260px] select-none">
      {/* EQ Knobs Area */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full py-2">
        <EqColumn
          deck="A"
          color="#a855f7"
          high={eqHighA}
          mid={eqMidA}
          low={eqLowA}
          onChange={setEq}
          side="left"
        />
        <EqColumn
          deck="B"
          color="#9333ea"
          high={eqHighB}
          mid={eqMidB}
          low={eqLowB}
          onChange={setEq}
          side="right"
        />
      </div>

      {/* Channel Faders (Volume) */}
      <div className="flex items-center justify-center gap-10 py-1 w-full flex-1">
        <VolumeFader
          label="VOL A"
          value={volumeA}
          onChange={(val) => setVolume('A', val)}
          accentClassName="accent-primary"
          labelClassName="text-zinc-500"
        />
        <VolumeFader
          label="MASTER"
          value={masterVolume}
          onChange={setMasterVolume}
          accentClassName="accent-amber-500"
          labelClassName="text-amber-500"
          containerClassName="border-x border-zinc-900 px-3"
        />
        <VolumeFader
          label="VOL B"
          value={volumeB}
          onChange={(val) => setVolume('B', val)}
          accentClassName="accent-primary"
          labelClassName="text-zinc-500"
        />
      </div>

      <Crossfader value={crossfader} onChange={setCrossfader} />
    </div>
  )
}
