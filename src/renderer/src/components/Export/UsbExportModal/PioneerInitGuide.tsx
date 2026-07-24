import React from 'react'
import { useLanguage } from '@renderer/i18n'
import type { TranslationKey } from '@renderer/i18n'
import Stepper, { type StepperStep } from '@renderer/components/common/Stepper'

interface GuideStepDef {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  linkUrl?: string
  linkLabelKey?: TranslationKey
  warning?: boolean
}

const STEPS: GuideStepDef[] = [
  {
    titleKey: 'pioneerInitGuide.step1.title',
    descriptionKey: 'pioneerInitGuide.step1.description',
    warning: true
  },
  {
    titleKey: 'pioneerInitGuide.step2.title',
    descriptionKey: 'pioneerInitGuide.step2.description',
    linkUrl: 'https://rekordbox.com/en/download/',
    linkLabelKey: 'pioneerInitGuide.step2.link'
  },
  {
    titleKey: 'pioneerInitGuide.step3.title',
    descriptionKey: 'pioneerInitGuide.step3.description'
  },
  {
    titleKey: 'pioneerInitGuide.step4.title',
    descriptionKey: 'pioneerInitGuide.step4.description'
  },
  {
    titleKey: 'pioneerInitGuide.step5.title',
    descriptionKey: 'pioneerInitGuide.step5.description'
  },
  {
    titleKey: 'pioneerInitGuide.step6.title',
    descriptionKey: 'pioneerInitGuide.step6.description'
  }
]

export default function PioneerInitGuide(): React.JSX.Element {
  const { t } = useLanguage()

  const steps: StepperStep[] = STEPS.map((s) => ({
    title: t(s.titleKey),
    description: t(s.descriptionKey),
    linkUrl: s.linkUrl,
    linkLabel: s.linkLabelKey ? t(s.linkLabelKey) : undefined,
    warning: s.warning
  }))

  return (
    <Stepper
      steps={steps}
      formatStepIndicator={(current, total) => t('setupGuide.stepIndicator', { current, total })}
      backLabel={t('setupGuide.back')}
      nextLabel={t('setupGuide.next')}
      finishLabel={t('setupGuide.finish')}
    />
  )
}
