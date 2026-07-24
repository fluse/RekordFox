import type { TranslationKey } from '@renderer/i18n'

export interface GuideStepDef {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  warning?: boolean
}
