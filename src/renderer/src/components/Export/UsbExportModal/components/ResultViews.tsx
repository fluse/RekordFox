import React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'

// The "playlist already exists" confirmation step.
export function ConfirmOverwriteView({
  playlistTitle,
  driveName,
  onCancel,
  onConfirm
}: {
  playlistTitle: string
  driveName: string
  onCancel: () => void
  onConfirm: () => void
}): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center">
        <AlertCircle className="mx-auto h-7 w-7 text-amber-500 mb-2" />
        <p className="text-sm font-medium text-zinc-200">{t('usbExport.playlistExistsTitle')}</p>
        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
          {t('usbExport.playlistExistsDesc', { title: playlistTitle, driveName })}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {t('usbExport.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          {t('usbExport.overwriteConfirm')}
        </button>
      </div>
    </div>
  )
}

// The success step.
export function SuccessView({
  driveName,
  onClose
}: {
  driveName: string
  onClose: () => void
}): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-100">{t('usbExport.successTitle')}</p>
        <p className="text-xs text-zinc-500 mt-1.5 max-w-[280px] leading-relaxed">
          {t('usbExport.successDesc', { driveName })}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full rounded-lg bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
      >
        {t('usbExport.doneBtn')}
      </button>
    </div>
  )
}

// The error step, with a retry that re-scans the drives.
export function ErrorView({
  errorMessage,
  onClose,
  onRetry
}: {
  errorMessage: string
  onClose: () => void
  onRetry: () => void
}): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
        <AlertCircle className="mx-auto h-7 w-7 text-red-500 mb-2" />
        <p className="text-sm font-medium text-zinc-200">{t('usbExport.failedTitle')}</p>
        <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-2.5 rounded border border-red-500/20 text-left whitespace-pre-line break-words leading-relaxed max-h-52 overflow-y-auto">
          {errorMessage}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {t('usbExport.closeBtn')}
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/95 transition-colors shadow-lg cursor-pointer"
        >
          {t('usbExport.tryAgainBtn')}
        </button>
      </div>
    </div>
  )
}
