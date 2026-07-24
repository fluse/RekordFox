import { type Language } from '@renderer/i18n'

// An example playlist users are invited to import as a first test to see how downloading works.
export const EXAMPLE_PLAYLIST_URL =
  'https://www.youtube.com/playlist?list=PL3N5etFaMKtSOajILxSS3ywVNCdOzkqXQ'

export const LANGUAGES: { code: Language; label: string; title: string }[] = [
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'de', label: 'DE', title: 'Deutsch' },
  { code: 'fr', label: 'FR', title: 'Français' },
  { code: 'es', label: 'ES', title: 'Español' }
]
