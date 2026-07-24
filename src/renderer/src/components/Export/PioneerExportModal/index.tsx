import React from 'react'
import { Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import type { PioneerExportModalProps } from './types'
import { usePioneerExport } from './usePioneerExport'
import { useWaveformAnalysisBridge } from './useWaveformAnalysisBridge'

export default function PioneerExportModal({
  isOpen,
  onClose,
  playlistId,
  playlistTitle,
  usbPath
}: PioneerExportModalProps): React.JSX.Element | null {
  const { t } = useLanguage()
  const { step, errorMessage, progress, handleCancel } = usePioneerExport(
    isOpen,
    playlistId,
    usbPath
  )
  useWaveformAnalysisBridge(isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {step === 'exporting' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : step === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : step === 'canceled' ? (
              <XCircle className="h-5 w-5 text-zinc-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-zinc-100">Pioneer CDJ Export</h2>
            <p className="text-xs text-zinc-500 truncate max-w-[280px]">
              {t('usbExport.playlistLabel', { title: playlistTitle })}
            </p>
          </div>
        </div>

        {/* Exporting Step */}
        {step === 'exporting' && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Exportiere Tracks...</span>
              <span className="font-mono text-zinc-300">
                {progress.currentTrack > 0 && progress.totalTracks > 0
                  ? `${progress.currentTrack}/${progress.totalTracks}`
                  : 'Bereite vor...'}
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/50">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
              <p className="truncate text-center text-xs font-semibold text-zinc-400 leading-normal min-h-[1.5rem]">
                {progress.statusText}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all duration-200 cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">Export erfolgreich abgeschlossen!</p>
              <p className="text-xs text-zinc-500 mt-2 max-w-[290px] leading-relaxed">
                Deine Tracks und Pioneer ANLZ-Waveforms wurden sicher auf den USB-Stick unter{' '}
                <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">
                  {usbPath}
                </code>{' '}
                exportiert.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer"
            >
              Fertig
            </button>
          </div>
        )}

        {/* Canceled Step */}
        {step === 'canceled' && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
              <XCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">Export abgebrochen</p>
              <p className="text-xs text-zinc-500 mt-2 max-w-[280px] leading-relaxed">
                Der Exportvorgang wurde durch den Benutzer abgebrochen. Teilweise kopierte Dateien
                wurden vom USB-Stick gelöscht.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-lg bg-zinc-900 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Schließen
            </button>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
              <AlertCircle className="mx-auto h-7 w-7 text-red-500 mb-2" />
              <p className="text-sm font-medium text-zinc-200">Export failed</p>
              <p className="text-xs text-red-400 mt-2.5 bg-red-500/10 p-3 rounded border border-red-500/20 text-left whitespace-pre-line break-words max-h-52 overflow-y-auto leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
