import React from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useLanguage } from '@renderer/i18n'

interface TryExampleCardProps {
  importing: boolean
  onImportExample: () => Promise<void>
}

export default function TryExampleCard({
  importing,
  onImportExample
}: TryExampleCardProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-semibold text-zinc-100">{t('onboarding.tryTitle')}</h3>
          <p className="mb-3 text-xs text-zinc-400">{t('onboarding.tryDesc')}</p>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            disabled={importing}
            onClick={onImportExample}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('onboarding.importing')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t('onboarding.importExample')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
