import type { ColorScheme } from '@main/db'
import type { TranslationKey } from '@renderer/i18n'

export const PRESET_ORDER: Exclude<ColorScheme, 'custom'>[] = [
  'purple',
  'blue',
  'green',
  'orange',
  'rose',
  'teal',
  'forest',
  'amber',
  'cyan',
  'fuchsia'
]

export const LABEL_KEYS: Record<ColorScheme, TranslationKey> = {
  purple: 'settings.colorSchemePurple',
  blue: 'settings.colorSchemeBlue',
  green: 'settings.colorSchemeGreen',
  orange: 'settings.colorSchemeOrange',
  rose: 'settings.colorSchemeRose',
  teal: 'settings.colorSchemeTeal',
  forest: 'settings.colorSchemeForest',
  amber: 'settings.colorSchemeAmber',
  cyan: 'settings.colorSchemeCyan',
  fuchsia: 'settings.colorSchemeFuchsia',
  custom: 'settings.colorSchemeCustom'
}
