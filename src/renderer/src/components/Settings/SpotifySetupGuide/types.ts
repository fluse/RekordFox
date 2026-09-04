import type { TranslationKey } from '@renderer/i18n'

export interface GuideStepDef {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  linkUrl?: string
  warning?: boolean
}
