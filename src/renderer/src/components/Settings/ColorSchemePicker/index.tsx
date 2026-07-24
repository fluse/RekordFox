import React, { useRef } from 'react'
import { Check, Pipette } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import type { ColorScheme } from '@main/db'
import { getSchemeSwatchHex, CUSTOM_SCHEME_DEFAULT_HEX } from '@renderer/lib/colorSchemes'
import { useLanguage } from '@renderer/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { PRESET_ORDER, LABEL_KEYS } from './constants'

interface ColorSchemePickerProps {
  value: ColorScheme
  customColor?: string
  onChange: (scheme: ColorScheme, customColor?: string) => void
}

export default function ColorSchemePicker({
  value,
  customColor,
  onChange
}: ColorSchemePickerProps): React.JSX.Element {
  const { t } = useLanguage()
  const colorInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {PRESET_ORDER.map((scheme) => {
        const selected = value === scheme
        return (
          <Tooltip key={scheme}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange(scheme)}
                className={cn(
                  'h-8 w-8 shrink-0 cursor-pointer rounded-full ring-offset-2 ring-offset-background transition flex items-center justify-center',
                  selected ? 'ring-2 ring-foreground' : 'hover:scale-110'
                )}
                style={{ backgroundColor: getSchemeSwatchHex(scheme) }}
              >
                {selected && <Check className="h-4 w-4 text-white drop-shadow" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{t(LABEL_KEYS[scheme])}</TooltipContent>
          </Tooltip>
        )
      })}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            className={cn(
              'relative h-8 w-8 shrink-0 cursor-pointer rounded-full ring-offset-2 ring-offset-background transition flex items-center justify-center',
              value === 'custom' ? 'ring-2 ring-foreground' : 'hover:scale-110'
            )}
            style={{
              background:
                value === 'custom'
                  ? customColor || CUSTOM_SCHEME_DEFAULT_HEX
                  : 'conic-gradient(from 180deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #8b5cf6, #ef4444)'
            }}
          >
            {value === 'custom' ? (
              <Check className="h-4 w-4 text-white drop-shadow" />
            ) : (
              <Pipette className="h-3.5 w-3.5 text-white drop-shadow" />
            )}
            <input
              ref={colorInputRef}
              type="color"
              value={
                value === 'custom'
                  ? customColor || CUSTOM_SCHEME_DEFAULT_HEX
                  : CUSTOM_SCHEME_DEFAULT_HEX
              }
              onChange={(e) => onChange('custom', e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t('settings.colorSchemeCustom')}</TooltipContent>
      </Tooltip>
    </div>
  )
}
