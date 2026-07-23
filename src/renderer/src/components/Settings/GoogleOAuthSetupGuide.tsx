import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useLanguage } from '@renderer/i18n'
import type { TranslationKey } from '@renderer/i18n'

interface GuideStep {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  linkUrl?: string
  warning?: boolean
}

const STEPS: GuideStep[] = [
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
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  return (
    <div className="rounded-lg bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('oauthGuide.stepIndicator', { current: step + 1, total: STEPS.length })}
        </span>
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-4 bg-primary' : 'w-1.5 bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div
        className={`rounded-md p-3 mb-3 ${
          current.warning
            ? 'bg-amber-500/10 border border-amber-500/30'
            : 'bg-background/60 border border-border'
        }`}
      >
        <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
          {current.warning && <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />}
          {t(current.titleKey)}
        </h3>
        <p className="text-xs text-muted-foreground whitespace-pre-line">
          {t(current.descriptionKey)}
        </p>
        {current.linkUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => window.open(current.linkUrl, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('oauthGuide.openLink')}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('oauthGuide.back')}
        </Button>
        {isLastStep ? (
          <Button type="button" size="sm" className="gap-1.5" onClick={() => setStep(0)}>
            <Check className="h-3.5 w-3.5" />
            {t('oauthGuide.finish')}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            {t('oauthGuide.next')}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
