import React from 'react'
import { useLanguage } from '@renderer/i18n'
import type { TranslationKey } from '@renderer/i18n'
import Stepper, { type StepperStep } from '@renderer/components/common/Stepper'

interface GuideStepDef {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  linkUrl?: string
  warning?: boolean
}

const STEPS: GuideStepDef[] = [
  {
    titleKey: 'oauthGuide.step1.title',
    descriptionKey: 'oauthGuide.step1.description',
    linkUrl: 'https://console.cloud.google.com/projectcreate'
  },
  {
    titleKey: 'oauthGuide.step2.title',
    descriptionKey: 'oauthGuide.step2.description',
    linkUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com'
  },
  {
    titleKey: 'oauthGuide.step3.title',
    descriptionKey: 'oauthGuide.step3.description',
    linkUrl: 'https://console.cloud.google.com/apis/credentials/consent'
  },
  {
    titleKey: 'oauthGuide.step4.title',
    descriptionKey: 'oauthGuide.step4.description',
    linkUrl: 'https://console.cloud.google.com/apis/credentials/consent'
  },
  {
    titleKey: 'oauthGuide.step5.title',
    descriptionKey: 'oauthGuide.step5.description',
    linkUrl: 'https://console.cloud.google.com/apis/credentials/consent',
    warning: true
  },
  {
    titleKey: 'oauthGuide.step6.title',
    descriptionKey: 'oauthGuide.step6.description',
    linkUrl: 'https://console.cloud.google.com/apis/credentials'
  },
  {
    titleKey: 'oauthGuide.step7.title',
    descriptionKey: 'oauthGuide.step7.description'
  }
]

export default function GoogleOAuthSetupGuide(): React.JSX.Element {
  const { t } = useLanguage()

  const steps: StepperStep[] = STEPS.map((s) => ({
    title: t(s.titleKey),
    description: t(s.descriptionKey),
    linkUrl: s.linkUrl,
    linkLabel: s.linkUrl ? t('oauthGuide.openLink') : undefined,
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
