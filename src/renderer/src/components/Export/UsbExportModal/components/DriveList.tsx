import React from 'react'
import { HardDrive, AlertCircle, RefreshCw, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { UsbDrive, ExportFormat } from '../types'
import PioneerInitGuide from '../PioneerInitGuide'

interface DriveListProps {
  drives: UsbDrive[]
  selectedDrive: UsbDrive | null
  onSelectDrive: (drive: UsbDrive) => void
  exportFormat: ExportFormat
  onChangeFormat: (format: ExportFormat) => void
  isRefreshing: boolean
  onRefresh: () => void
  isInitGuideOpen: boolean
  onToggleInitGuide: () => void
  onCancel: () => void
  onExport: () => void
}

// The "select a drive" step: drive picker, export-format select, Pioneer-init warning/guide, and
// the cancel / export actions.
export function DriveList({
  drives,
  selectedDrive,
  onSelectDrive,
  exportFormat,
  onChangeFormat,
  isRefreshing,
  onRefresh,
  isInitGuideOpen,
  onToggleInitGuide,
  onCancel,
  onExport
}: DriveListProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      {drives.length === 0 ? (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-center">
          <AlertCircle className="mx-auto h-7 w-7 text-yellow-500 mb-2" />
          <p className="text-sm font-medium text-zinc-200">{t('usbExport.noStickDetectedTitle')}</p>
          <p className="text-xs text-zinc-500 mt-1">{t('usbExport.noStickDetectedDesc')}</p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            {t('usbExport.autoDetectHint')}
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {drives.length === 1
                ? t('usbExport.singleDriveLabel')
                : t('usbExport.multiDriveLabel')}
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer disabled:opacity-60"
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
                  />
                  {isRefreshing ? t('usbExport.checking') : t('usbExport.refreshBtn')}
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('usbExport.refreshTooltip')}</TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {drives.map((drive) => (
              <button
                key={drive.path}
                type="button"
                onClick={(): void => onSelectDrive(drive)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition cursor-pointer ${
                  selectedDrive?.path === drive.path
                    ? 'border-primary bg-primary/10 text-zinc-100 shadow-[0_0_12px_rgba(var(--primary),0.1)]'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <HardDrive
                  className={`h-5 w-5 ${
                    selectedDrive?.path === drive.path ? 'text-primary' : 'text-zinc-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{drive.name}</p>
                  <p className="text-xs text-zinc-500 font-mono truncate">{drive.path}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {drives.length > 0 && (
        <div className="border-t border-zinc-900 pt-3 space-y-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Export-Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => onChangeFormat(e.target.value as ExportFormat)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-300 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              <option value="m3u8">M3U8 Playlist & MP3 Ordner (Standard)</option>
              <option value="pioneer">Pioneer CDJ / Rekordbox (inkl. Waveforms)</option>
            </select>
          </div>

          {exportFormat === 'pioneer' && selectedDrive && !selectedDrive.isPioneerInitialized && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2.5">
              <p className="text-xs leading-relaxed text-amber-400/90">
                {t('usbExport.notInitializedWarning')}
              </p>
              <button
                type="button"
                onClick={onToggleInitGuide}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {t('pioneerInitGuide.toggle')}
                {isInitGuideOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {isInitGuideOpen && (
                <div className="max-h-72 overflow-y-auto">
                  <PioneerInitGuide />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {t('usbExport.cancel')}
        </button>
        {drives.length === 0 ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('usbExport.scanAgain')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onExport}
            disabled={!selectedDrive}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/95 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20 cursor-pointer"
          >
            {t('usbExport.exportBtn')}
          </button>
        )}
      </div>
    </div>
  )
}
