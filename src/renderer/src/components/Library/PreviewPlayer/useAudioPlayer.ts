import { useEffect, useRef, useState } from 'react'
import type { Track } from '@main/db'
import { getMediaUrl } from '@renderer/utils/audio'

const VOLUME_STORAGE_KEY = 'rekordfox_preview_volume'

interface UseAudioPlayerResult {
  audioRef: React.RefObject<HTMLAudioElement | null>
  mediaSrc: string
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  handleVolumeChange: (volume: number) => void
  toggleMute: () => void
  handleTimeUpdate: () => void
  handleLoadedMetadata: () => void
  handleAudioEnded: () => void
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
  seekTo: (time: number) => void
}

export function useAudioPlayer(
  previewTrack: Track | null,
  isPlaying: boolean,
  setIsPlaying: (isPlaying: boolean) => void,
  onEnded?: () => void
): UseAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastTrackId = useRef<string | null>(null)

  // Pinned to the track's filepath at the moment it became the active track.
  // A later filepath correction on the same track (e.g. a background rename)
  // must not change this while it's loaded/playing — reassigning <audio src>
  // makes the browser abort playback and restart from 0.
  const [mediaSrc, setMediaSrc] = useState('')

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState<number>(() => {
    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY)
    return savedVolume ? parseFloat(savedVolume) : 0.8
  })
  const [isMuted, setIsMuted] = useState(false)

  // Load and play/pause preview track sync
  useEffect(() => {
    if (!audioRef.current || !previewTrack) return

    const trackChanged = lastTrackId.current !== previewTrack.id
    if (trackChanged) {
      lastTrackId.current = previewTrack.id
      // Reset display state immediately so the timeline doesn't show stale
      // values from the previous track while metadata for the new one loads.
      setCurrentTime(0)
      setDuration(0)
      const newSrc = getMediaUrl(previewTrack.filepath)
      // Set the DOM property directly — React hasn't committed the mediaSrc
      // state update yet, so the src attribute still reflects the old track.
      audioRef.current.src = newSrc
      setMediaSrc(newSrc)
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
    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume))
  }, [volume, isMuted])

  const handleTimeUpdate = (): void => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = (): void => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleAudioEnded = (): void => {
    setCurrentTime(0)
    onEnded?.()
  }

  // Seeks immediately on every slider change (drag, click, or arrow key) so the
  // displayed time always mirrors the audio element's actual position — no
  // separate "commit on release" step that can desync from a stray trailing event.
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const time = parseFloat(e.target.value)
    if (audioRef.current && audioRef.current.readyState >= 1) {
      audioRef.current.currentTime = time
    }
    setCurrentTime(time)
  }

  const handleVolumeChange = (newVolume: number): void => {
    setVolume(newVolume)
    if (isMuted) setIsMuted(false)
  }

  const toggleMute = (): void => setIsMuted((prev) => !prev)

  const seekTo = (time: number): void => {
    if (audioRef.current && audioRef.current.readyState >= 1) {
      audioRef.current.currentTime = time
    }
    setCurrentTime(time)
  }

  return {
    audioRef,
    mediaSrc,
    currentTime,
    duration,
    volume,
    isMuted,
    handleVolumeChange,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleAudioEnded,
    handleSeek,
    seekTo
  }
}
