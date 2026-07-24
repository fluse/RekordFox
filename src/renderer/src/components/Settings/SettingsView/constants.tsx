import { Palette, Music, Download, Keyboard, type LucideIcon } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'
import YoutubeIcon from '@renderer/components/icons/YoutubeIcon'
import type { SettingsCategory } from './types'

type TranslateFn = ReturnType<typeof useLanguage>['t']

export function buildCategories(t: TranslateFn): {
  key: SettingsCategory
  label: string
  icon: LucideIcon | typeof YoutubeIcon
}[] {
  return [
    { key: 'general', label: t('settings.categoryGeneral'), icon: Palette },
    { key: 'library', label: t('settings.categoryLibrary'), icon: Music },
    { key: 'downloads', label: t('settings.categoryDownloads'), icon: Download },
    { key: 'connections', label: t('settings.categoryConnections'), icon: YoutubeIcon },
    { key: 'shortcuts', label: t('settings.categoryShortcuts'), icon: Keyboard }
  ]
}
