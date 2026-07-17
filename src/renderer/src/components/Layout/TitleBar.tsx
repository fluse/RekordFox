import React, { useEffect, useState } from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'
import logo from '@renderer/assets/logo-rekordfox.svg'
import logoLight from '@renderer/assets/logo-rekordfox-light.svg'
import { useLanguage } from '@renderer/i18n'

interface TitleBarProps {
  theme?: 'dark' | 'light'
}

export default function TitleBar({ theme = 'dark' }: TitleBarProps): React.JSX.Element {
  const { t } = useLanguage()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.windowIsMaximized().then(setIsMaximized)
    const unsubscribe = window.api.onWindowMaximizedChange(setIsMaximized)
    return unsubscribe
  }, [])

  return (
    <div
      className="flex h-9 flex-shrink-0 items-center justify-between border-b border-zinc-900 bg-zinc-950 pl-3 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 text-zinc-300">
        <img
          src={theme === 'light' ? logo : logoLight}
          className="h-4 w-4 object-contain"
          alt="RekordFox"
        />
        <span className="text-xs font-semibold tracking-wide">RekordFox</span>
      </div>

      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => window.api.windowMinimize()}
          title={t('titlebar.minimize')}
          className="flex h-full w-11 cursor-pointer items-center justify-center text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => window.api.windowMaximizeToggle()}
          title={isMaximized ? t('titlebar.restore') : t('titlebar.maximize')}
          className="flex h-full w-11 cursor-pointer items-center justify-center text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
        >
          {isMaximized ? <Copy className="h-3.5 w-3.5" /> : <Square className="h-3 w-3" />}
        </button>
        <button
          onClick={() => window.api.windowClose()}
          title={t('titlebar.close')}
          className="flex h-full w-11 cursor-pointer items-center justify-center text-zinc-400 transition-colors hover:bg-red-600 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
