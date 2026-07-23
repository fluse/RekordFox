import React from 'react'
import { useLanguage } from '@renderer/i18n'
import type { TranslationKey } from '@renderer/i18n'
import Stepper, { type StepperStep } from '@renderer/components/common/Stepper'

interface GuideStepDef {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  warning?: boolean
}

const STEPS: GuideStepDef[] = [
  {
    titleKey: 'rekordboxGuide.step1.title',
    descriptionKey: 'rekordboxGuide.step1.description'
  },
  {
    titleKey: 'rekordboxGuide.step2.title',
    descriptionKey: 'rekordboxGuide.step2.description'
  },
  {
    titleKey: 'rekordboxGuide.step3.title',
    descriptionKey: 'rekordboxGuide.step3.description'
  },
  {
    titleKey: 'rekordboxGuide.step4.title',
    descriptionKey: 'rekordboxGuide.step4.description'
  },
  {
    titleKey: 'rekordboxGuide.step5.title',
    descriptionKey: 'rekordboxGuide.step5.description'
  },
  {
    titleKey: 'rekordboxGuide.step6.title',
    descriptionKey: 'rekordboxGuide.step6.description',
    warning: true
  }
]

export default function RekordboxXmlSetupGuide(): React.JSX.Element {
  const { t } = useLanguage()

  const steps: StepperStep[] = STEPS.map((s) => ({
    title: t(s.titleKey),
    description: t(s.descriptionKey),
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
