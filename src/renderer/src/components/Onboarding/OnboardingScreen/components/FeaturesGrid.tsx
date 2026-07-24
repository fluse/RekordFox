import React from 'react'
import { ListMusic, Music4, Usb } from 'lucide-react'
import { useLanguage } from '@renderer/i18n'

export default function FeaturesGrid(): React.JSX.Element {
  const { t } = useLanguage()

  const features = [
    {
      icon: ListMusic,
      title: t('onboarding.feature1Title'),
      description: t('onboarding.feature1Desc')
    },
    {
      icon: Music4,
      title: t('onboarding.feature2Title'),
      description: t('onboarding.feature2Desc')
    },
    {
      icon: Usb,
      title: t('onboarding.feature3Title'),
      description: t('onboarding.feature3Desc')
    }
  ]

  return (
    <>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t('onboarding.whatToExpectTitle')}
      </h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div key={feature.title} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <Icon className="mb-2 h-5 w-5 text-primary" />
              <h3 className="mb-1 text-sm font-semibold text-zinc-100">{feature.title}</h3>
              <p className="text-xs text-zinc-400">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </>
  )
}
