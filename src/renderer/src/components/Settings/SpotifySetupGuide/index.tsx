import React from 'react'
import { useLanguage } from '@renderer/i18n'
import Stepper, { type StepperStep } from '@renderer/components/common/Stepper'
import { STEPS } from './constants'

export default function SpotifySetupGuide(): React.JSX.Element {
  const { t } = useLanguage()

  const steps: StepperStep[] = STEPS.map((s) => ({
    title: t(s.titleKey),
    description: t(s.descriptionKey),
    linkUrl: s.linkUrl,
    linkLabel: s.linkUrl ? t('spotifyGuide.openLink') : undefined,
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
