import React from 'react'
import { useLanguage } from '@renderer/i18n'
import type {
  BpmTolerance,
  SetProfile,
  SmartModeOptions,
  TargetEnergy
} from '@renderer/utils/camelot'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}): React.JSX.Element {
  return (
    <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-2 py-1 text-[10px] font-semibold transition cursor-pointer ${
            value === option.value
              ? 'bg-primary text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface PreviewPlayerSmartModePanelProps {
  options: SmartModeOptions
  onChange: (options: Partial<SmartModeOptions>) => void
}

export default function PreviewPlayerSmartModePanel({
  options,
  onChange
}: PreviewPlayerSmartModePanelProps): React.JSX.Element {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-2.5 border-t border-zinc-900 bg-zinc-900/30 px-4 py-3">
      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {t('preview.smartMode.bpmTolerance.label')}
        </div>
        <SegmentedControl<BpmTolerance>
          value={options.bpmTolerance}
          onChange={(bpmTolerance) => onChange({ bpmTolerance })}
          options={[
            { value: 'strict', label: t('preview.smartMode.bpmTolerance.strict') },
            { value: 'normal', label: t('preview.smartMode.bpmTolerance.normal') },
            { value: 'loose', label: t('preview.smartMode.bpmTolerance.loose') }
          ]}
        />
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {t('preview.smartMode.targetEnergy.label')}
        </div>
        <SegmentedControl<TargetEnergy>
          value={options.targetEnergy}
          onChange={(targetEnergy) => onChange({ targetEnergy })}
          options={[
            { value: 'chill', label: t('preview.smartMode.targetEnergy.chill') },
            { value: 'balanced', label: t('preview.smartMode.targetEnergy.balanced') },
            { value: 'high_energy', label: t('preview.smartMode.targetEnergy.highEnergy') }
          ]}
        />
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {t('preview.smartMode.setProfile.label')}
        </div>
        <SegmentedControl<SetProfile>
          value={options.setProfile}
          onChange={(setProfile) => onChange({ setProfile })}
          options={[
            { value: 'classic_peak', label: t('preview.smartMode.setProfile.classicPeak') },
            { value: 'rollercoaster', label: t('preview.smartMode.setProfile.rollercoaster') },
            { value: 'steady', label: t('preview.smartMode.setProfile.steady') }
          ]}
        />
      </div>
    </div>
  )
}
