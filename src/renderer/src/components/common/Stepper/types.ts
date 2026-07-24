export interface StepperStep {
  title: string
  description: string
  linkUrl?: string
  linkLabel?: string
  warning?: boolean
}

export interface StepperProps {
  steps: StepperStep[]
  formatStepIndicator: (current: number, total: number) => string
  backLabel: string
  nextLabel: string
  finishLabel: string
}
