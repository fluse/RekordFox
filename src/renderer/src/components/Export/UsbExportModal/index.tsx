import React from 'react'
import { HardDrive, X, Loader2 } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { UsbExportModalProps } from './types'
import { useUsbExport } from './useUsbExport'
import { DriveList } from './components/DriveList'
import { ExportProgressView } from './components/ExportProgressView'
import { ConfirmOverwriteView, SuccessView, ErrorView } from './components/ResultViews'

export default function UsbExportModal({
  isOpen,
  onClose,
  playlistId,
  playlistTitle,
  onStartPioneerExport
}: UsbExportModalProps): React.JSX.Element | null {
  const { t } = useLanguage()
  const usb = useUsbExport({ isOpen, playlistId, onClose })

  if (!isOpen) return null

  const handleExportClick = (): void => {
    if (!usb.selectedDrive) return
    if (usb.exportFormat === 'pioneer' && onStartPioneerExport) {
      onStartPioneerExport(usb.selectedDrive.path)
    } else {
      void usb.handleExport(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        {usb.step !== 'exporting' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={usb.handleClose}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('usbExport.closeTooltip')}</TooltipContent>
          </Tooltip>
        )}

        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">{t('usbExport.title')}</h2>
            <p className="text-xs text-zinc-500 truncate max-w-[280px]">
              {t('usbExport.playlistLabel', { title: playlistTitle })}
            </p>
          </div>
        </div>

        {usb.step === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-zinc-400">{t('usbExport.scanning')}</p>
          </div>
        )}

        {usb.step === 'select' && (
          <DriveList
            drives={usb.drives}
            selectedDrive={usb.selectedDrive}
            onSelectDrive={usb.setSelectedDrive}
            exportFormat={usb.exportFormat}
            onChangeFormat={usb.setExportFormat}
            isRefreshing={usb.isRefreshing}
            onRefresh={usb.refreshDrives}
            isInitGuideOpen={usb.isInitGuideOpen}
            onToggleInitGuide={usb.toggleInitGuide}
            onCancel={usb.handleClose}
            onExport={handleExportClick}
          />
        )}

        {usb.step === 'confirm_overwrite' && (
          <ConfirmOverwriteView
            playlistTitle={playlistTitle}
            driveName={usb.selectedDrive ? usb.selectedDrive.name : ''}
            onCancel={usb.goToSelect}
            onConfirm={() => void usb.handleExport(true)}
          />
        )}

        {usb.step === 'exporting' && (
          <ExportProgressView progress={usb.progress} percent={usb.percent} />
        )}

        {usb.step === 'success' && (
          <SuccessView
            driveName={usb.selectedDrive ? usb.selectedDrive.name : ''}
            onClose={usb.handleClose}
          />
        )}

        {usb.step === 'error' && (
          <ErrorView
            errorMessage={usb.errorMessage}
            onClose={usb.handleClose}
            onRetry={usb.rescan}
          />
        )}
      </div>
    </div>
  )
}
