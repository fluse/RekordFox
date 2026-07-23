import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

export interface StepperStep {
  title: string
  description: string
  linkUrl?: string
  linkLabel?: string
  warning?: boolean
}

interface StepperProps {
  steps: StepperStep[]
  formatStepIndicator: (current: number, total: number) => string
  backLabel: string
  nextLabel: string
  finishLabel: string
}

export default function Stepper({
  steps,
  formatStepIndicator,
  backLabel,
  nextLabel,
  finishLabel
}: StepperProps): React.JSX.Element {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const isLastStep = step === steps.length - 1

  return (
    <div className="rounded-lg bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {formatStepIndicator(step + 1, steps.length)}
        </span>
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
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
          {current.title}
        </h3>
        <p className="text-xs text-muted-foreground whitespace-pre-line">{current.description}</p>
        {current.linkUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => window.open(current.linkUrl, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {current.linkLabel}
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
          {backLabel}
        </Button>
        {isLastStep ? (
          <Button type="button" size="sm" className="gap-1.5" onClick={() => setStep(0)}>
            <Check className="h-3.5 w-3.5" />
            {finishLabel}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          >
            {nextLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
