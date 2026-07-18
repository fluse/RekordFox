import React from 'react'
import type { Track } from '@main/db'
import { usePreviewStore } from '@renderer/store/usePreviewStore'
import { getMediaUrl } from '@renderer/utils/audio'
import { useLanguage } from '@renderer/i18n'
import { useAudioPlayer } from './useAudioPlayer'
import { useDraggablePosition } from './useDraggablePosition'
import { useResizableHeight } from './useResizableHeight'
import { useResizableWidth } from './useResizableWidth'
import PreviewPlayerHeader from './PreviewPlayerHeader'
import PreviewPlayerTrackInfo from './PreviewPlayerTrackInfo'
import PreviewPlayerProgress from './PreviewPlayerProgress'
import PreviewPlayerControls from './PreviewPlayerControls'
import PreviewPlayerQueue, { QUEUE_ID_MIME } from './PreviewPlayerQueue'
import PreviewPlayerSmartModePanel from './PreviewPlayerSmartModePanel'

const RESTART_THRESHOLD_SECONDS = 3

export default function PreviewPlayer(): React.JSX.Element | null {
  const {
    previewTrack,
    isPlaying,
    stopTrack,
    setIsPlaying,
    isQueuePanelOpen,
    toggleQueuePanel,
    advance,
    previous,
    addToQueue,
    dockMode,
    toggleDockMode,
    smartMode,
    toggleSmartMode,
    smartModeOptions,
    updateSmartModeOptions
  } = usePreviewStore()
  const { t } = useLanguage()
  const isDocked = dockMode === 'sidebar'
  const { position, handleMouseDown } = useDraggablePosition()
  const { height: queueHeight, handleResizeStart } = useResizableHeight()
  const { width: dockedWidth, handleResizeStart: handleWidthResizeStart } = useResizableWidth()
  const {
    audioRef,
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
  } = useAudioPlayer(previewTrack, isPlaying, setIsPlaying, advance)

  if (!previewTrack) return null

  const displayDuration = duration || previewTrack.duration || 0
  const coverUrl = previewTrack.coverPath ? getMediaUrl(previewTrack.coverPath) : ''

  const handlePrevious = (): void => {
    if (currentTime > RESTART_THRESHOLD_SECONDS) {
      seekTo(0)
    } else {
      previous()
    }
  }

  // Accepts drops anywhere over the player, not just the queue list, so tracks
  // dragged from a playlist land in the queue even when the queue panel is closed.
  const handlePlayerDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handlePlayerDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    if (e.dataTransfer.getData(QUEUE_ID_MIME)) return
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const track = JSON.parse(raw) as Track
      addToQueue(track)
    } catch {
      // ignore malformed drag payload
    }
  }

  return (
    <>
      {isDocked && (
        <div
          onMouseDown={handleWidthResizeStart}
          className="relative z-10 w-[1px] flex-shrink-0 cursor-col-resize select-none bg-zinc-800 transition-colors duration-150 hover:bg-primary active:bg-primary"
        >
          {/* Expanded interactive area */}
          <div className="absolute inset-y-0 -left-2 -right-2" />
        </div>
      )}
      <div
        style={
          isDocked
            ? { width: `${dockedWidth}px` }
            : { left: `${position.x}px`, top: `${position.y}px`, width: '320px' }
        }
        onDragOver={handlePlayerDragOver}
        onDrop={handlePlayerDrop}
        className={
          isDocked
            ? 'relative z-10 flex h-full flex-shrink-0 select-none flex-col bg-zinc-950/95 shadow-2xl'
            : 'fixed z-50 select-none rounded-xl border border-zinc-800/80 bg-zinc-950/95 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 fade-in duration-150'
        }
      >
        {/* Audio element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
        />

        <PreviewPlayerHeader
          title={t('preview.title')}
          onDragStart={isDocked ? () => {} : handleMouseDown}
          onClose={stopTrack}
          isQueueOpen={isQueuePanelOpen}
          onToggleQueue={toggleQueuePanel}
          queueToggleLabel={t('preview.queue.toggle')}
          isDocked={isDocked}
          onToggleDock={toggleDockMode}
          dockToggleLabel={isDocked ? t('preview.dock.toFloating') : t('preview.dock.toSidebar')}
        />

        <div className="p-4 flex flex-col gap-3">
          <PreviewPlayerTrackInfo track={previewTrack} coverUrl={coverUrl} />

          <PreviewPlayerProgress
            currentTime={currentTime}
            duration={displayDuration}
            onSeek={handleSeek}
          />

          <PreviewPlayerControls
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onPrevious={handlePrevious}
            onNext={advance}
            previousLabel={t('preview.controls.previous')}
            nextLabel={t('preview.controls.next')}
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            smartMode={smartMode}
            onToggleSmartMode={toggleSmartMode}
            smartModeEnableLabel={t('preview.controls.smartModeEnable')}
            smartModeDisableLabel={t('preview.controls.smartModeDisable')}
          />
        </div>

        {(isDocked || isQueuePanelOpen) && (
          <>
            {smartMode && (
              <PreviewPlayerSmartModePanel
                options={smartModeOptions}
                onChange={updateSmartModeOptions}
              />
            )}
            <PreviewPlayerQueue
              height={queueHeight}
              onResizeStart={handleResizeStart}
              fillHeight={isDocked}
            />
          </>
        )}
      </div>
    </>
  )
}
