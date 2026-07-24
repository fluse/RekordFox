import React from 'react'
import { useLanguage } from '@renderer/i18n'
import logo from '@renderer/assets/logo-rekordfox.svg'
import logoLight from '@renderer/assets/logo-rekordfox-light.svg'

// Placeholder shown in the playlist list when the user has no playlists yet.
export function EmptyState({
  theme,
  onOpenAddModal
}: {
  theme: 'dark' | 'light'
  onOpenAddModal: () => void
}): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <img
        src={theme === 'light' ? logo : logoLight}
        className="h-8 w-8 object-contain opacity-20"
        alt={t('sidebar.noPlaylists')}
      />
      <p className="mt-2 text-xs text-zinc-600">{t('sidebar.noPlaylists')}</p>
      <button
        onClick={onOpenAddModal}
        className="mt-3 text-xs font-semibold text-primary hover:underline cursor-pointer"
      >
        {t('sidebar.addNow')}
      </button>
    </div>
  )
}
