import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, X, GripHorizontal, Volume2, VolumeX, Music } from 'lucide-react'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { getMediaUrl, formatDuration } from '@renderer/utils/audio'
import { useLanguage } from '@renderer/i18n'

export default function PreviewPlayer(): React.JSX.Element | null {
  const { previewTrack, isPlaying, stopTrack, setIsPlaying } = usePreviewStore()
  const { t } = useLanguage()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastTrackId = useRef<string | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState<number>(() => {
    const savedVolume = localStorage.getItem('rekordfox_preview_volume')
    return savedVolume ? parseFloat(savedVolume) : 0.8
  })
  const [isMuted, setIsMuted] = useState(false)
  const [sliderTime, setSliderTime] = useState<number | null>(null)

  // Position state (starts at bottom right of the screen)
  const [position, setPosition] = useState({
    x: window.innerWidth - 340,
    y: window.innerHeight - 200
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const playerStart = useRef({ x: 0, y: 0 })

  // Adjust initial position when window resizes or on first load to prevent floating outside
  useEffect(() => {
    const handleResize = (): void => {
      setPosition((prev) => {
        const nextX = Math.max(20, Math.min(window.innerWidth - 340, prev.x))
        const nextY = Math.max(20, Math.min(window.innerHeight - 200, prev.y))
        return { x: nextX, y: nextY }
      })
    }
    window.addEventListener('resize', handleResize)
    return (): void => window.removeEventListener('resize', handleResize)
  }, [])

  // Load and play/pause preview track sync
  useEffect(() => {
    if (!audioRef.current || !previewTrack) return

    const trackChanged = lastTrackId.current !== previewTrack.id
    if (trackChanged) {
      lastTrackId.current = previewTrack.id
      audioRef.current.load()
    }

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Failed to play preview audio:', err)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [previewTrack, isPlaying, setIsPlaying])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
    localStorage.setItem('rekordfox_preview_volume', String(volume))
  }, [volume, isMuted])

  // Handle Drag logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Only drag on left click and not on interactive buttons
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) return

    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    playerStart.current = { x: position.x, y: position.y }
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent): void => {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y

      const newX = Math.max(10, Math.min(window.innerWidth - 340, playerStart.current.x + dx))
      const newY = Math.max(10, Math.min(window.innerHeight - 200, playerStart.current.y + dy))

      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = (): void => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return (): void => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  if (!previewTrack) return null

  const handleTimeUpdate = (): void => {
    if (audioRef.current && sliderTime === null) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = (): void => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleAudioEnded = (): void => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const time = parseFloat(e.target.value)
    setSliderTime(time)
  }

  const handleProgressEnd = (
    e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>
  ): void => {
    const time = parseFloat((e.target as HTMLInputElement).value)
    if (audioRef.current && audioRef.current.readyState >= 1) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
    setSliderTime(null)
  }

  const toggleMute = (): void => {
    setIsMuted(!isMuted)
  }

  const coverUrl = previewTrack.coverPath ? getMediaUrl(previewTrack.coverPath) : ''

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 w-[320px] select-none rounded-xl border border-zinc-800/80 bg-zinc-950/95 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 fade-in duration-150"
    >
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={getMediaUrl(previewTrack.filepath)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Header (Drag Handle) */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 px-3 py-2 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
          <GripHorizontal className="h-3.5 w-3.5" />
          <span>{t('preview.title')}</span>
        </div>
        <button
          type="button"
          onClick={stopTrack}
          className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Track Details */}
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
            <div
              className="font-semibold text-sm text-zinc-100 truncate"
              title={previewTrack.title}
            >
              {previewTrack.title}
            </div>
            <div className="text-xs text-zinc-400 truncate" title={previewTrack.artist}>
              {previewTrack.artist}
            </div>
          </div>
        </div>

        {/* Custom Progress Slider */}
        <div className="flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={duration || previewTrack.duration || 100}
            value={sliderTime !== null ? sliderTime : currentTime}
            onChange={handleProgressChange}
            onMouseUp={handleProgressEnd}
            onTouchEnd={handleProgressEnd}
            className="h-1 w-full rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-primary focus:outline-none"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((sliderTime !== null ? sliderTime : currentTime) / (duration || previewTrack.duration || 1)) * 100}%, #27272a ${((sliderTime !== null ? sliderTime : currentTime) / (duration || previewTrack.duration || 1)) * 100}%, #27272a 100%)`
            }}
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>{formatDuration(sliderTime !== null ? sliderTime : currentTime)}</span>
            <span>{formatDuration(duration || previewTrack.duration || 0)}</span>
          </div>
        </div>

        {/* Controls Layout */}
        <div className="flex items-center justify-between mt-1">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 active:scale-95 transition cursor-pointer shadow-lg shadow-primary/20"
          >
            {isPlaying ? (
              <Pause className="h-4.5 w-4.5 fill-current" />
            ) : (
              <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 group/volume w-32">
            <button
              type="button"
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const newVol = parseFloat(e.target.value)
                setVolume(newVol)
                if (isMuted) setIsMuted(false)
              }}
              className="h-1 w-full rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-primary focus:outline-none"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(isMuted ? 0 : volume) * 100}%, #27272a ${(isMuted ? 0 : volume) * 100}%, #27272a 100%)`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
