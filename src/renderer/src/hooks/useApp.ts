import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import type { Playlist, Track, AppSettings, PlaylistStats } from '@main/db'
import { de } from '../i18n/locales/de'
import { en } from '../i18n/locales/en'
import { fr } from '../i18n/locales/fr'
import { es } from '../i18n/locales/es'
import type { TranslationKey } from '../i18n'
import { usePreviewStore } from '../store/usePreviewStore'
import { applyColorScheme } from '../lib/colorSchemes'

const translations = { de, en, fr, es }

export interface ActiveSync {
  status: string
  total?: number
  completedTrackIds?: string[]
  activeDownloads?: Record<string, { trackId: string; title: string; percent: number }>
}

export type ActiveSyncsMap = Record<string, ActiveSync>

export interface UseAppReturn {
  playlists: Playlist[]
  playlistStats: Record<string, PlaylistStats>
  selectedPlaylistId: string | null
  setSelectedPlaylistId: (id: string | null) => void
  tracks: Track[]
  loadedTrackA: Track | null
  loadedTrackB: Track | null
  settings: AppSettings
  sidebarWidth: number
  activeSyncs: ActiveSyncsMap
  handleAddPlaylist: (url: string, platform?: 'youtube' | 'spotify') => Promise<void>
  handleCreateEmptyPlaylist: (title: string) => Promise<void>
  handleDeletePlaylist: (id: string) => Promise<void>
  handleSyncPlaylist: (id: string) => Promise<void>
  handleRenamePlaylist: (id: string, newTitle: string) => Promise<void>
  handleLoadTrack: (track: Track, deck: 'A' | 'B') => void
  handleUpdateBpmInState: (trackId: string, bpm: number) => void
  handleUpdateKeyInState: (trackId: string, key: string) => void
  handleUpdateRatingInState: (trackId: string, rating: number) => void
  handleReorderTracks: (playlistId: string, trackIds: string[]) => Promise<void>
  handleDropTrackToPlaylist: (track: Track, targetPlaylistId: string) => Promise<void>
  handleMoveTrackToPlaylist: (track: Track, targetPlaylistId: string) => Promise<void>
  handleRemoveTrack: (track: Track) => Promise<void>
  handlePlaylistImported: (playlist: Playlist) => void
  handleSyncToYoutube: (playlistId: string, trackIds: string[]) => Promise<void>
  syncingToYoutubeId: string | null
  handleUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>
  handleMigrate: (newPath: string, moveFiles: boolean) => Promise<void>
  handleMouseDownSplitter: (e: React.MouseEvent) => void
  renamingStatus: {
    active: boolean
    current: number
    total: number
  }
}

export function useApp(): UseAppReturn {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [playlistStats, setPlaylistStats] = useState<Record<string, PlaylistStats>>({})
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])

  // Refreshes the per-playlist track counts shown in the sidebar. Cheap (counts only, no track
  // payloads) so it's safe to call after any mutation that changes playlist membership or a
  // track's downloaded state.
  const refreshPlaylistStats = useCallback((): void => {
    window.api.getPlaylistStats().then(setPlaylistStats).catch(console.error)
  }, [])

  // Track loaded on Deck A / Deck B
  const [loadedTrackA, setLoadedTrackA] = useState<Track | null>(null)
  const [loadedTrackB, setLoadedTrackB] = useState<Track | null>(null)

  // App settings state
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    colorScheme: 'purple',
    downloadPath: '',
    sidebarWidth: 256,
    maxWorkers: 3,
    language: 'en'
  })
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const sidebarWidthRef = useRef<number>(sidebarWidth)

  useEffect(() => {
    usePreviewStore.getState().setHistoryLimit(settings.historyLimit ?? 50)
  }, [settings.historyLimit])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const lang = settings.language || 'en'
      const langDict = translations[lang] || de
      let text = langDict[key] || de[key] || String(key)

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value))
        })
      }
      return text
    },
    [settings.language]
  )

  useEffect((): void => {
    sidebarWidthRef.current = sidebarWidth
  }, [sidebarWidth])

  // Real-time synchronization state map
  const [activeSyncs, setActiveSyncs] = useState<ActiveSyncsMap>({})

  const [renamingStatus, setRenamingStatus] = useState<{
    active: boolean
    current: number
    total: number
  }>({
    active: false,
    current: 0,
    total: 0
  })

  // Called when a track's BPM is calculated in the background
  const handleUpdateBpmInState = useCallback((trackId: string, bpm: number): void => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, bpm } : t)))
    setLoadedTrackA((prev) => (prev && prev.id === trackId ? { ...prev, bpm } : prev))
    setLoadedTrackB((prev) => (prev && prev.id === trackId ? { ...prev, bpm } : prev))
  }, [])

  // Called when a track's key is analyzed in the background
  const handleUpdateKeyInState = useCallback((trackId: string, key: string): void => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, key } : t)))
    setLoadedTrackA((prev) => (prev && prev.id === trackId ? { ...prev, key } : prev))
    setLoadedTrackB((prev) => (prev && prev.id === trackId ? { ...prev, key } : prev))
  }, [])

  const handleUpdateRatingInState = useCallback((trackId: string, rating: number): void => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, rating } : t)))
    setLoadedTrackA((prev) => (prev && prev.id === trackId ? { ...prev, rating } : prev))
    setLoadedTrackB((prev) => (prev && prev.id === trackId ? { ...prev, rating } : prev))
  }, [])

  // Called when the main process renames track file(s) on disk (reorder, BPM
  // rename). Keeps every cached Track snapshot's filepath in sync so already
  // loaded/queued tracks don't point at a file that no longer exists.
  const handleUpdateFilepathsInState = useCallback(
    (changes: { id: string; filepath: string }[]): void => {
      const filepathById = new Map(changes.map((c) => [c.id, c.filepath]))
      setTracks((prev) =>
        prev.map((t) => (filepathById.has(t.id) ? { ...t, filepath: filepathById.get(t.id)! } : t))
      )
      setLoadedTrackA((prev) =>
        prev && filepathById.has(prev.id) ? { ...prev, filepath: filepathById.get(prev.id)! } : prev
      )
      setLoadedTrackB((prev) =>
        prev && filepathById.has(prev.id) ? { ...prev, filepath: filepathById.get(prev.id)! } : prev
      )
      usePreviewStore.getState().syncFilepaths(changes)
    },
    []
  )

  const handleReorderTracks = useCallback(
    async (playlistId: string, trackIds: string[]): Promise<void> => {
      // Optimistic update
      setTracks((prev) => {
        const trackMap = new Map(prev.map((t) => [t.id, t]))
        return trackIds
          .map((id, index) => {
            const track = trackMap.get(id)
            if (track) {
              return { ...track, position: index + 1 }
            }
            return null
          })
          .filter(Boolean) as Track[]
      })

      try {
        const res = await window.api.reorderTracks(playlistId, trackIds)
        if (res.success) {
          // The reordered playlist may be a 'youtube-oauth' one — the main process already marked
          // it dirty in the DB, so reflect that locally to enable the "Sync to YouTube" button
          // without a full playlists refetch.
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlistId && p.source === 'youtube-oauth'
                ? { ...p, pendingRemoteChanges: true }
                : p
            )
          )
        } else {
          alert(t('actions.errorReorderTracks', { error: res.error || '' }))
          // Re-fetch to revert to actual db state
          const list = await window.api.getTracks(playlistId)
          setTracks(list)
        }
      } catch (err) {
        console.error('Failed to reorder tracks:', err)
        alert(t('actions.errorReorderTracks', { error: String(err) }))
        const list = await window.api.getTracks(playlistId)
        setTracks(list)
      }
    },
    [t]
  )

  const [syncingToYoutubeId, setSyncingToYoutubeId] = useState<string | null>(null)

  const handleSyncToYoutube = useCallback(
    async (playlistId: string, trackIds: string[]): Promise<void> => {
      setSyncingToYoutubeId(playlistId)
      try {
        const res = await window.api.syncPlaylistOrderToYoutube(playlistId, trackIds)
        if (res.success) {
          const now = new Date().toISOString()
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlistId
                ? { ...p, pendingRemoteChanges: false, lastPushToYoutube: now }
                : p
            )
          )
          toast.success(t('tracklist.syncToYoutubeSuccess'))
        } else {
          toast.error(t('tracklist.syncToYoutubeError', { error: res.error || '' }))
        }
      } catch (err) {
        console.error('Failed to sync playlist order to YouTube:', err)
        toast.error(t('tracklist.syncToYoutubeError', { error: String(err) }))
      } finally {
        setSyncingToYoutubeId(null)
      }
    },
    [t]
  )

  const handleDropTrackToPlaylist = useCallback(
    async (track: Track, targetPlaylistId: string): Promise<void> => {
      try {
        const res = await window.api.addTrackToPlaylist(track.id, targetPlaylistId)
        if (res.success && res.track) {
          toast.success(t('sidebar.trackAddedToPlaylist'))
          // The main process already marked a 'youtube-oauth' target playlist dirty in the DB —
          // reflect that locally to enable the "Sync to YouTube" button without a full refetch.
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === targetPlaylistId && p.source === 'youtube-oauth'
                ? { ...p, pendingRemoteChanges: true }
                : p
            )
          )
          setSelectedPlaylistId((currentId) => {
            if (currentId === targetPlaylistId) {
              window.api.getTracks(targetPlaylistId).then(setTracks).catch(console.error)
            }
            return currentId
          })
          refreshPlaylistStats()
        } else if (res.success && !res.track) {
          toast.error(t('sidebar.trackAlreadyInPlaylist'))
        } else {
          toast.error(t('sidebar.trackAddFailed', { error: res.error || '' }))
        }
      } catch (err) {
        console.error('Failed to add track to playlist:', err)
        toast.error(t('sidebar.trackAddFailed', { error: String(err) }))
      }
    },
    [t, refreshPlaylistStats]
  )

  // Applies a track removal to the local UI state: drops it from the visible list, unloads it
  // from either deck if it was loaded, and flags an OAuth-backed source playlist as dirty. Shared
  // by the direct "remove" action and the "move to playlist" flow (copy-then-remove).
  const applyLocalTrackRemoval = useCallback((track: Track): void => {
    setTracks((prev) =>
      prev.filter((t) => !(t.id === track.id && t.playlistId === track.playlistId))
    )
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === track.playlistId && p.source === 'youtube-oauth'
          ? { ...p, pendingRemoteChanges: true }
          : p
      )
    )
    setLoadedTrackA((prev) => {
      if (prev && prev.id === track.id && prev.playlistId === track.playlistId) {
        localStorage.removeItem('loadedTrackAId')
        return null
      }
      return prev
    })
    setLoadedTrackB((prev) => {
      if (prev && prev.id === track.id && prev.playlistId === track.playlistId) {
        localStorage.removeItem('loadedTrackBId')
        return null
      }
      return prev
    })
  }, [])

  const handleRemoveTrack = useCallback(
    async (track: Track): Promise<void> => {
      try {
        const res = await window.api.removeTrackFromPlaylist(track.id, track.playlistId)
        if (res.success) {
          applyLocalTrackRemoval(track)
          refreshPlaylistStats()
          toast.success(t('tracklist.trackRemoved'))
        } else {
          toast.error(t('tracklist.trackRemoveFailed', { error: res.error || '' }))
        }
      } catch (err) {
        console.error('Failed to remove track from playlist:', err)
        toast.error(t('tracklist.trackRemoveFailed', { error: String(err) }))
      }
    },
    [t, applyLocalTrackRemoval, refreshPlaylistStats]
  )

  const handleMoveTrackToPlaylist = useCallback(
    async (track: Track, targetPlaylistId: string): Promise<void> => {
      if (track.playlistId === targetPlaylistId) return
      try {
        const addRes = await window.api.addTrackToPlaylist(track.id, targetPlaylistId)
        if (!addRes.success) {
          toast.error(t('sidebar.trackAddFailed', { error: addRes.error || '' }))
          return
        }

        // The main process already marked a 'youtube-oauth' target playlist dirty in the DB —
        // reflect that locally to enable the "Sync to YouTube" button without a full refetch.
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === targetPlaylistId && p.source === 'youtube-oauth'
              ? { ...p, pendingRemoteChanges: true }
              : p
          )
        )

        const removeRes = await window.api.removeTrackFromPlaylist(track.id, track.playlistId)
        if (removeRes.success) {
          applyLocalTrackRemoval(track)
        }
        refreshPlaylistStats()

        toast.success(t('sidebar.trackMovedToPlaylist'))

        // Refresh the target playlist's tracks if it's the one currently displayed.
        setSelectedPlaylistId((currentId) => {
          if (currentId === targetPlaylistId) {
            window.api.getTracks(targetPlaylistId).then(setTracks).catch(console.error)
          }
          return currentId
        })
      } catch (err) {
        console.error('Failed to move track to playlist:', err)
        toast.error(t('sidebar.trackAddFailed', { error: String(err) }))
      }
    },
    [t, applyLocalTrackRemoval, refreshPlaylistStats]
  )

  // Clears the "NEW" label for a track by persisting played=true and patching
  // it in the visible tracks state. Shared by deck-loading and preview-player
  // playback so a track counts as heard however it was auditioned.
  const markTrackPlayed = useCallback((trackId: string, playlistId: string): void => {
    window.api
      .updateTrackPlayed(trackId, playlistId, true)
      .then((res) => {
        if (res.success) {
          setTracks((prev) =>
            prev.map((t) =>
              t.id === trackId && t.playlistId === playlistId ? { ...t, played: true } : t
            )
          )
        }
      })
      .catch((err) => console.error('Failed to update track played status:', err))
  }, [])

  const handleLoadTrack = useCallback(
    (track: Track, deck: 'A' | 'B'): void => {
      if (deck === 'A') {
        setLoadedTrackA(track)
        localStorage.setItem('loadedTrackAId', track.id)
      } else {
        setLoadedTrackB(track)
        localStorage.setItem('loadedTrackBId', track.id)
      }

      if (!track.played) {
        markTrackPlayed(track.id, track.playlistId)
      }
    },
    [markTrackPlayed]
  )

  // Mark a track as played once it starts in the Preview Player. Subscribing to
  // the store covers every entry path (playNow, advance to next, previous) in
  // one place. Stream-only previews (Discover, not yet in the library) carry no
  // real playlistId and are skipped.
  useEffect(() => {
    return usePreviewStore.subscribe((state, prevState) => {
      const track = state.previewTrack
      if (!track || track.id === prevState.previewTrack?.id) return
      if (!track.playlistId || track.played) return
      markTrackPlayed(track.id, track.playlistId)
    })
  }, [markTrackPlayed])

  const handleAddPlaylist = useCallback(
    async (url: string, platform: 'youtube' | 'spotify' = 'youtube'): Promise<void> => {
      const res = await window.api.addPlaylist(url, platform)
      if (res.success && res.playlist) {
        setPlaylists((prev) => [...prev, res.playlist!])
        setSelectedPlaylistId(res.playlist.id)
        refreshPlaylistStats()
      } else {
        throw new Error(res.error || 'Failed to add playlist')
      }
    },
    [refreshPlaylistStats]
  )

  const handleCreateEmptyPlaylist = useCallback(
    async (title: string): Promise<void> => {
      const res = await window.api.createEmptyPlaylist(title)
      if (res.success && res.playlist) {
        setPlaylists((prev) => [...prev, res.playlist!])
        setSelectedPlaylistId(res.playlist.id)
        refreshPlaylistStats()
      } else {
        throw new Error(res.error || 'Failed to create playlist')
      }
    },
    [refreshPlaylistStats]
  )

  const handlePlaylistImported = useCallback(
    (playlist: Playlist): void => {
      setPlaylists((prev) => [...prev.filter((p) => p.id !== playlist.id), playlist])
      setSelectedPlaylistId(playlist.id)
      refreshPlaylistStats()
    },
    [refreshPlaylistStats]
  )

  const handleDeletePlaylist = useCallback(
    async (id: string): Promise<void> => {
      if (!confirm(t('actions.confirmDeletePlaylist'))) {
        return
      }

      const res = await window.api.deletePlaylist(id)
      if (res.success) {
        setPlaylists((prev) => prev.filter((p) => p.id !== id))
        setSelectedPlaylistId((prevSelected) => (prevSelected === id ? null : prevSelected))
        refreshPlaylistStats()

        // Unload deleted tracks from DJ decks if active
        setLoadedTrackA((prev) => {
          if (prev?.playlistId === id) {
            localStorage.removeItem('loadedTrackAId')
            return null
          }
          return prev
        })
        setLoadedTrackB((prev) => {
          if (prev?.playlistId === id) {
            localStorage.removeItem('loadedTrackBId')
            return null
          }
          return prev
        })
      } else {
        alert(t('actions.errorDeletePlaylist', { error: res.error || '' }))
      }
    },
    [t, refreshPlaylistStats]
  )

  const handleSyncPlaylist = useCallback(
    async (id: string): Promise<void> => {
      const res = await window.api.syncPlaylist(id)
      if (res.success) {
        toast.success(t('tracklist.syncPlaylistSuccess'))
      } else {
        toast.error(t('actions.errorSyncPlaylist', { error: res.error || '' }))
      }
    },
    [t]
  )

  const handleRenamePlaylist = useCallback(
    async (id: string, newTitle: string): Promise<void> => {
      const res = await window.api.renamePlaylist(id, newTitle)
      if (res.success) {
        setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, title: newTitle } : p)))
      } else {
        alert(t('actions.errorRenamePlaylist', { error: res.error || '' }))
      }
    },
    [t]
  )

  const handleUpdateSettings = useCallback(
    async (newSettings: Partial<AppSettings>): Promise<void> => {
      try {
        const res = await window.api.updateSettings(newSettings)
        if (res.success) {
          setSettings((prev) => ({ ...prev, ...newSettings }))
          toast.success(t('settings.saved'))
        } else {
          throw new Error(res.error || '')
        }
      } catch (err) {
        console.error(err)
        throw err
      }
    },
    [t]
  )

  const handleMigrate = useCallback(
    async (newPath: string, moveFiles: boolean): Promise<void> => {
      try {
        const res = await window.api.migrateSettings(newPath, moveFiles)
        if (res.success) {
          setSettings((prev) => ({ ...prev, downloadPath: newPath }))
          // Refresh tracks to get the updated local filepaths
          setSelectedPlaylistId((currentPlaylistId) => {
            if (currentPlaylistId) {
              window.api.getTracks(currentPlaylistId).then(setTracks).catch(console.error)
            }
            return currentPlaylistId
          })
          toast.success(t('actions.successMigrate'))
        } else {
          toast.error(t('actions.errorMigrate', { error: res.error || '' }))
        }
      } catch (err) {
        console.error(err)
        toast.error(t('actions.errorMigrateGeneral'))
      }
    },
    [t]
  )

  const handleMouseDownSplitter = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidthRef.current

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const deltaX = moveEvent.clientX - startX
      const newWidth = Math.max(180, Math.min(480, startWidth + deltaX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = async (): Promise<void> => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      try {
        await window.api.updateSettings({ sidebarWidth: sidebarWidthRef.current })
      } catch (err) {
        console.error('Failed to save sidebar width settings:', err)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  // 1. Fetch playlists on startup and load settings
  useEffect((): void => {
    const fetchPlaylists = async (): Promise<void> => {
      try {
        const list = await window.api.getPlaylists()
        setPlaylists(list)
        if (list.length > 0) {
          setSelectedPlaylistId(list[0].id)
        }
        refreshPlaylistStats()
      } catch (e) {
        console.error('Failed to load playlists:', e)
      }
    }
    const loadSettings = async (): Promise<void> => {
      try {
        const currentSettings = await window.api.getSettings()
        setSettings(currentSettings)
        if (currentSettings.sidebarWidth) {
          setSidebarWidth(currentSettings.sidebarWidth)
        }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
    const loadLastTracks = async (): Promise<void> => {
      try {
        const trackAId = localStorage.getItem('loadedTrackAId')
        const trackBId = localStorage.getItem('loadedTrackBId')
        if (trackAId || trackBId) {
          const allTracks = await window.api.getTracks()
          if (trackAId) {
            const trackA = allTracks.find((t) => t.id === trackAId)
            if (trackA) setLoadedTrackA(trackA)
          }
          if (trackBId) {
            const trackB = allTracks.find((t) => t.id === trackBId)
            if (trackB) setLoadedTrackB(trackB)
          }
        }
      } catch (e) {
        console.error('Failed to load last tracks:', e)
      }
    }
    fetchPlaylists()
    loadSettings()
    loadLastTracks()
  }, [refreshPlaylistStats])

  // 2. Inject theme class into HTML document root
  useEffect((): void => {
    const root = document.documentElement
    if (settings.theme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
    }
  }, [settings.theme])

  // 2b. Apply the selected accent color scheme (independent of light/dark mode)
  useEffect((): void => {
    applyColorScheme(
      document.documentElement,
      settings.colorScheme || 'purple',
      settings.customAccentColor
    )
  }, [settings.colorScheme, settings.customAccentColor])

  // 3. Fetch tracks when selected playlist changes
  useEffect((): (() => void) => {
    let cancelled = false

    if (!selectedPlaylistId) {
      Promise.resolve().then(() => {
        if (cancelled) return
        setTracks((prev) => (prev.length > 0 ? [] : prev))
      })
      return () => {
        cancelled = true
      }
    }

    const fetchTracks = async (): Promise<void> => {
      try {
        const list = await window.api.getTracks(selectedPlaylistId)
        // The user may have already switched to a different playlist by the time this
        // resolves — ignore a stale response instead of overwriting the current selection's
        // tracks with the previous playlist's.
        if (cancelled) return
        setTracks(list)
      } catch (e) {
        console.error(`Failed to load tracks for playlist ${selectedPlaylistId}:`, e)
      }
    }

    fetchTracks()
    return () => {
      cancelled = true
    }
  }, [selectedPlaylistId])

  // 4. Register IPC event listeners
  useEffect((): (() => void) => {
    // Listen for sync status changes
    const cleanupSyncStatus = window.api.onSyncStatusChanged((playlistId, status, lastSync) => {
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === playlistId) {
            return {
              ...p,
              syncStatus: status as Playlist['syncStatus'],
              lastSync: lastSync || p.lastSync
            }
          }
          return p
        })
      )

      setActiveSyncs((prev) => {
        const next = { ...prev }
        if (status === 'idle' || status === 'error') {
          delete next[playlistId] // Clean up sync progress
        } else {
          next[playlistId] = {
            ...next[playlistId],
            status,
            total: next[playlistId]?.total || 0,
            completedTrackIds: next[playlistId]?.completedTrackIds || [],
            activeDownloads: next[playlistId]?.activeDownloads || {}
          }
        }
        return next
      })

      // Refresh track list if the active playlist status changes (starts syncing or finishes)
      if (playlistId === selectedPlaylistId) {
        window.api.getTracks(playlistId).then(setTracks).catch(console.error)
      }

      // A finished sync may have added/removed tracks or downloaded new ones — refresh counts.
      if (status === 'idle' || status === 'error') {
        refreshPlaylistStats()
      }
    })

    // Listen for download progress updates
    const cleanupDownloadProgress = window.api.onDownloadProgress((data) => {
      setActiveSyncs((prev) => {
        const playlistState = prev[data.playlistId] || {
          status: 'syncing',
          activeDownloads: {},
          completedTrackIds: []
        }
        const activeDownloads = { ...(playlistState.activeDownloads || {}) }
        const completedTrackIds = [...(playlistState.completedTrackIds || [])]

        if (data.percent >= 100) {
          delete activeDownloads[data.trackId]
          if (!completedTrackIds.includes(data.trackId)) {
            completedTrackIds.push(data.trackId)
          }
        } else {
          activeDownloads[data.trackId] = {
            trackId: data.trackId,
            title: data.title,
            percent: data.percent
          }
        }

        return {
          ...prev,
          [data.playlistId]: {
            status: 'syncing',
            total: data.total,
            completedTrackIds,
            activeDownloads
          }
        }
      })

      // Reload tracklist if a track finishes downloading
      if (data.percent >= 100 && data.playlistId === selectedPlaylistId) {
        window.api.getTracks(data.playlistId).then(setTracks).catch(console.error)
      }

      // Each completed download bumps the playlist's downloaded count in the sidebar.
      if (data.percent >= 100) {
        refreshPlaylistStats()
      }
    })

    // Listen for BPM analysis results from the main process
    const cleanupBpmAnalyzed = window.api.onBpmAnalyzed((trackId, _playlistId, bpm) => {
      handleUpdateBpmInState(trackId, bpm)
    })

    // Listen for Key analysis results from the main process
    const cleanupKeyAnalyzed = window.api.onKeyAnalyzed((trackId, _playlistId, key) => {
      handleUpdateKeyInState(trackId, key)
    })

    // Listen for filename renaming status
    const cleanupRenamingStatus = window.api.onRenamingStatus((data) => {
      setRenamingStatus(data)
    })

    // Listen for individual file renames (reorder, BPM rename) to keep all
    // cached Track filepaths in sync without needing a full refetch
    const cleanupFilepathChanged = window.api.onTrackFilepathChanged((changes) => {
      handleUpdateFilepathsInState(changes)
    })

    // Listen for tracks updated event to refresh currently displayed tracks
    const cleanupTracksUpdated = window.api.onTracksUpdated(() => {
      if (selectedPlaylistId) {
        window.api.getTracks(selectedPlaylistId).then(setTracks).catch(console.error)
      }
      refreshPlaylistStats()
    })

    // Listen for local playlists the main process discovered belong to a connected YouTube
    // account (checked on app startup, in case the account was already connected before those
    // playlists existed or before this reconciliation feature shipped) and upgrades them.
    const cleanupPlaylistsLinked = window.api.onYoutubePlaylistsLinked((linkedPlaylists) => {
      for (const playlist of linkedPlaylists) {
        handlePlaylistImported(playlist)
      }
      if (selectedPlaylistId && linkedPlaylists.some((p) => p.id === selectedPlaylistId)) {
        window.api.getTracks(selectedPlaylistId).then(setTracks).catch(console.error)
      }
      toast.success(t('connections.playlistsLinked', { count: String(linkedPlaylists.length) }))
    })

    // Listen for playlists the main process unlinked (their YouTube account was disconnected, or
    // found gone on startup): they're demoted to plain 'local' playlists (see
    // unlinkPlaylistsForAccount) — kept, with tracks/downloads intact, but no longer OAuth-backed
    // at all. Replace them wholesale with what the main process sent rather than patching in a
    // link state ourselves.
    const cleanupPlaylistsUnlinked = window.api.onYoutubePlaylistsUnlinked((unlinkedPlaylists) => {
      const byId = new Map(unlinkedPlaylists.map((p) => [p.id, p]))
      setPlaylists((prev) => prev.map((p) => byId.get(p.id) ?? p))
    })

    return (): void => {
      cleanupSyncStatus()
      cleanupDownloadProgress()
      cleanupBpmAnalyzed()
      cleanupKeyAnalyzed()
      cleanupRenamingStatus()
      cleanupFilepathChanged()
      cleanupTracksUpdated()
      cleanupPlaylistsLinked()
      cleanupPlaylistsUnlinked()
    }
  }, [
    selectedPlaylistId,
    handleUpdateBpmInState,
    handleUpdateKeyInState,
    handleUpdateFilepathsInState,
    handlePlaylistImported,
    refreshPlaylistStats,
    t
  ])

  return {
    playlists,
    playlistStats,
    selectedPlaylistId,
    setSelectedPlaylistId,
    tracks,
    loadedTrackA,
    loadedTrackB,
    settings,
    sidebarWidth,
    activeSyncs,
    handleAddPlaylist,
    handleCreateEmptyPlaylist,
    handleDeletePlaylist,
    handleSyncPlaylist,
    handleRenamePlaylist,
    handleLoadTrack,
    handleUpdateBpmInState,
    handleUpdateKeyInState,
    handleUpdateRatingInState,
    handleReorderTracks,
    handleDropTrackToPlaylist,
    handleMoveTrackToPlaylist,
    handleRemoveTrack,
    handlePlaylistImported,
    handleSyncToYoutube,
    syncingToYoutubeId,
    handleUpdateSettings,
    handleMigrate,
    handleMouseDownSplitter,
    renamingStatus
  }
}
