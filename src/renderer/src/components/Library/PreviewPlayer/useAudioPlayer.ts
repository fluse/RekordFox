import { useEffect, useRef, useState } from 'react'
import type { Track } from '@main/db'
import { getMediaUrl } from '@renderer/utils/audio'
import { clampAndSnapPitch } from './pitchUtils'

const VOLUME_STORAGE_KEY = 'rekordfox_preview_volume'
const PITCH_STORAGE_KEY = 'rekordfox_preview_pitch'

interface UseAudioPlayerResult {
  audioRef: React.RefObject<HTMLAudioElement | null>
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  pitch: number
  handleVolumeChange: (volume: number) => void
  toggleMute: () => void
  handleTimeUpdate: () => void
  handleLoadedMetadata: () => void
  handleAudioEnded: () => void
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void
  seekTo: (time: number) => void
  handlePitchChange: (pitch: number) => void
}

export function useAudioPlayer(
  previewTrack: Track | null,
  isPlaying: boolean,
  setIsPlaying: (isPlaying: boolean) => void,
  onEnded?: () => void,
  initialPosition = 0,
  onPositionChange?: (time: number) => void
): UseAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastTrackId = useRef<string | null>(null)
  // Only the very first loaded track (restored from a previous session) may
  // seek to initialPosition — every track played afterwards starts at 0.
  const initialPositionConsumed = useRef(false)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState<number>(() => {
    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY)
    return savedVolume ? parseFloat(savedVolume) : 0.8
  })
  const [isMuted, setIsMuted] = useState(false)
  const [pitch, setPitch] = useState<number>(() => {
    const savedPitch = localStorage.getItem(PITCH_STORAGE_KEY)
    const parsed = savedPitch ? parseFloat(savedPitch) : 1.0
    return Number.isFinite(parsed) ? clampAndSnapPitch(parsed) : 1.0
  })

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
      // Managed imperatively only — the <audio> element has no src prop, so
      // there's no competing React-driven reassignment that would abort this
      // load/play (setting <audio src> mid-flight restarts resource selection).
      audioRef.current.src = getMediaUrl(previewTrack.filepath)
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

  // Persists the current playback position right before the app closes, so a
  // preview player left open can resume from where it left off next launch.
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      if (audioRef.current && previewTrack) {
        onPositionChange?.(audioRef.current.currentTime)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [previewTrack, onPositionChange])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume))
  }, [volume, isMuted])

  // Handle pitch/tempo changes. Applied here (not just after load()) so
  // dragging the slider updates a currently playing track immediately.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = pitch
    }
    localStorage.setItem(PITCH_STORAGE_KEY, String(pitch))
  }, [pitch])

  const handleTimeUpdate = (): void => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = (): void => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      if (!initialPositionConsumed.current && initialPosition > 0) {
        audioRef.current.currentTime = initialPosition
        setCurrentTime(initialPosition)
      }
      initialPositionConsumed.current = true
      // load() resets playbackRate to defaultPlaybackRate (1.0) internally,
      // so the pitch slider's value must be re-applied on every new track.
      audioRef.current.playbackRate = pitch
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

  const handlePitchChange = (newPitch: number): void => {
    setPitch(clampAndSnapPitch(newPitch))
  }

  return {
    audioRef,
    currentTime,
    duration,
    volume,
    isMuted,
    pitch,
    handleVolumeChange,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleAudioEnded,
    handleSeek,
    seekTo,
    handlePitchChange
  }
}
