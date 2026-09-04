import React, { useEffect, useState } from 'react'
import { Sidebar, SplashScreen, TitleBar, TrackTrashZone } from '@renderer/components/Layout'
import {
  Tracklist,
  AddPlaylistModal,
  PreviewPlayer,
  HistoryView
} from '@renderer/components/Library'
import { DjMixer } from '@renderer/components/Mixer'
import SettingsView from '@renderer/components/Settings'
import { DiscoverView, type DiscoverContext } from '@renderer/components/Discover'
import { OnboardingScreen } from '@renderer/components/Onboarding'
import { Toaster } from '@renderer/components/ui/sonner'
import { TooltipProvider, TooltipSettingsProvider } from '@renderer/components/ui/tooltip'
import { ChevronDown } from 'lucide-react'
import type { Track } from '@main/db'
import { useApp } from './hooks/useApp'

import { LanguageProvider, useLanguage } from './i18n'
import type { UseAppReturn } from './hooks/useApp'

function AppContent({ appState }: { appState: UseAppReturn }): React.JSX.Element {
  const { t } = useLanguage()
  const [showSplash, setShowSplash] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isMixerCollapsed, setIsMixerCollapsed] = useState(true)
  const [viewMode, setViewMode] = useState<'library' | 'history' | 'settings' | 'discover'>(
    'library'
  )
  const [settingsCategory, setSettingsCategory] = useState<'general' | 'connections'>('general')
  const [discoverContext, setDiscoverContext] = useState<DiscoverContext | null>(null)
  const [forceOnboarding, setForceOnboarding] = useState(false)
  // True while a track is being dragged (native HTML5 drag), so the trash drop zone can appear.
  const [isDraggingTrack, setIsDraggingTrack] = useState(false)

  useEffect(() => {
    const handleDragStart = (e: DragEvent): void => {
      if (e.dataTransfer?.types?.includes('application/x-recordfox-track')) {
        setIsDraggingTrack(true)
      }
    }
    const handleDragEnd = (): void => setIsDraggingTrack(false)

    window.addEventListener('dragstart', handleDragStart)
    window.addEventListener('dragend', handleDragEnd)
    window.addEventListener('drop', handleDragEnd)
    return (): void => {
      window.removeEventListener('dragstart', handleDragStart)
      window.removeEventListener('dragend', handleDragEnd)
      window.removeEventListener('drop', handleDragEnd)
    }
  }, [])

  const handleFindSimilarTrack = (track: Track): void => {
    setDiscoverContext({
      playlistId: track.playlistId,
      seedTrack: { id: track.id, title: track.title }
    })
    setViewMode('discover')
  }

  const {
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
  } = appState

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100 font-sans antialiased">
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <TitleBar theme={settings.theme} />
      {/* Top Half: DJ Mixer Dashboard */}
      <div className="relative flex-shrink-0 z-20">
        <div
          className={`mixer-container border-b border-zinc-900 bg-zinc-950/40 ${
            isMixerCollapsed ? 'collapsed' : ''
          }`}
        >
          <div className="min-h-0">
            <DjMixer trackA={loadedTrackA} trackB={loadedTrackB} onLoadTrack={handleLoadTrack} />
          </div>
        </div>
        {/* Toggle Button */}
        <button
          onClick={() => setIsMixerCollapsed(!isMixerCollapsed)}
          className={`absolute left-1/2 -translate-x-1/2 z-30 flex h-6 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-primary/55 shadow-lg cursor-pointer transition-all duration-300 bottom-[-12px]`}
          title={isMixerCollapsed ? t('mixer.show') : t('mixer.hide')}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${isMixerCollapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Bottom Half: Sidebar and Track Browser */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          playlists={playlists}
          playlistStats={playlistStats}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={(id) => {
            setViewMode('library')
            setSelectedPlaylistId(id)
          }}
          isHistorySelected={viewMode === 'history'}
          onSelectHistory={() => setViewMode('history')}
          isDiscoverSelected={viewMode === 'discover'}
          onSelectDiscover={() => {
            setDiscoverContext((prev) =>
              prev ? prev : selectedPlaylistId ? { playlistId: selectedPlaylistId } : null
            )
            setViewMode('discover')
          }}
          onRenamePlaylist={handleRenamePlaylist}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSettings={() => {
            setSettingsCategory('general')
            setViewMode('settings')
          }}
          onDropTrackToPlaylist={handleDropTrackToPlaylist}
          onMoveTrackToPlaylist={handleMoveTrackToPlaylist}
          isSettingsSelected={viewMode === 'settings'}
          activeSyncs={activeSyncs}
          width={sidebarWidth}
          theme={settings.theme}
          renamingStatus={renamingStatus}
        />

        {/* Resizer Splitter */}
        <div
          onMouseDown={handleMouseDownSplitter}
          className="relative w-[1px] bg-zinc-800 cursor-col-resize h-full select-none z-10 transition-colors duration-150 hover:bg-primary active:bg-primary group"
        >
          {/* Expanded interactive area */}
          <div className="absolute inset-y-0 -left-2 -right-2" />
        </div>

        {viewMode === 'settings' ? (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onMigrate={handleMigrate}
            onPlaylistImported={(playlist) => {
              handlePlaylistImported(playlist)
              setViewMode('library')
            }}
            isSyncing={Object.keys(activeSyncs).length > 0}
            initialCategory={settingsCategory}
            renamingStatus={renamingStatus}
            onShowOnboarding={() => {
              setForceOnboarding(true)
              setViewMode('library')
            }}
          />
        ) : viewMode === 'history' ? (
          <HistoryView onFindSimilarTrack={handleFindSimilarTrack} />
        ) : viewMode === 'discover' ? (
          <DiscoverView
            playlists={playlists}
            context={discoverContext}
            onContextChange={setDiscoverContext}
          />
        ) : forceOnboarding || playlists.length === 0 ? (
          <OnboardingScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onMigrate={handleMigrate}
            onImportPlaylist={handleAddPlaylist}
            onAddPlaylist={() => setIsAddModalOpen(true)}
            onClose={forceOnboarding ? () => setForceOnboarding(false) : undefined}
          />
        ) : selectedPlaylistId && selectedPlaylist ? (
          <Tracklist
            playlistId={selectedPlaylistId}
            playlistTitle={selectedPlaylist.title}
            playlists={playlists}
            tracks={tracks}
            onLoadTrack={handleLoadTrack}
            onUpdateBpm={handleUpdateBpmInState}
            onUpdateKey={handleUpdateKeyInState}
            onUpdateRating={handleUpdateRatingInState}
            onReorderTracks={handleReorderTracks}
            onRemoveTrack={handleRemoveTrack}
            onSyncToYoutube={handleSyncToYoutube}
            isSyncingToYoutube={syncingToYoutubeId === selectedPlaylistId}
            onRenamePlaylist={handleRenamePlaylist}
            onSyncPlaylist={handleSyncPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            isSyncing={activeSyncs[selectedPlaylistId]?.status === 'syncing'}
            onFindSimilarTrack={handleFindSimilarTrack}
            currentTrackA={loadedTrackA}
            currentTrackB={loadedTrackB}
            activeDownloads={activeSyncs[selectedPlaylistId]?.activeDownloads}
            isMixerCollapsed={isMixerCollapsed}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-zinc-900/10 text-zinc-500 text-sm">
            {t('app.selectPlaylistPrompt')}
          </div>
        )}

        <PreviewPlayer appShortcuts={settings.appShortcuts} />
      </div>

      <TrackTrashZone visible={isDraggingTrack} onRemoveTrack={handleRemoveTrack} />

      {/* Modal Dialogs */}
      <AddPlaylistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddPlaylist}
        onCreateEmpty={handleCreateEmptyPlaylist}
      />

      <Toaster
        theme={settings.theme === 'light' ? 'light' : 'dark'}
        richColors
        position="bottom-right"
      />
    </div>
  )
}

export default function App(): React.JSX.Element {
  const appState = useApp()
  const { settings, handleUpdateSettings } = appState

  return (
    <LanguageProvider
      language={settings.language || 'en'}
      setLanguage={async (lang) => {
        await handleUpdateSettings({ language: lang })
      }}
    >
      <TooltipSettingsProvider enabled={settings.tooltipsEnabled ?? true}>
        <TooltipProvider delayDuration={settings.tooltipDelay ?? 600} skipDelayDuration={0}>
          <AppContent appState={appState} />
        </TooltipProvider>
      </TooltipSettingsProvider>
    </LanguageProvider>
  )
}
