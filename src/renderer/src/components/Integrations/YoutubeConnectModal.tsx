import React from 'react'
import { X, Sparkles, RefreshCw } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'

interface YoutubeConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onGoToConnections: () => void
}

export default function YoutubeConnectModal({
  isOpen,
  onClose,
  onGoToConnections
}: YoutubeConnectModalProps): React.JSX.Element | null {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-4 right-4 text-zinc-400 hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
            <YoutubeIcon className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">{t('youtubeConnect.title')}</h2>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2.5 text-sm text-zinc-300">
            <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <span>{t('youtubeConnect.benefit1')}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-zinc-300">
            <RefreshCw className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <span>{t('youtubeConnect.benefit2')}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
          >
            {t('youtubeConnect.close')}
          </button>
          <button
            onClick={() => {
              onGoToConnections()
              onClose()
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/95 cursor-pointer"
          >
            <YoutubeIcon className="h-4 w-4" />
            {t('youtubeConnect.cta')}
          </button>
        </div>
      </div>
    </div>
  )
}
