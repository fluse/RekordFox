import React from 'react'
import { cn } from '@renderer/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@renderer/components/ui/toggle-group'

export interface ToggleGroupFieldOption<T extends string> {
  value: T
  label: React.ReactNode
  title?: string
}

interface ToggleGroupFieldProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: ToggleGroupFieldOption<T>[]
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

// Reusable single-select segmented control built on shadcn's ToggleGroup,
// used anywhere the app needs a small "pick one of a few options" input
// (theme, language, filename template, etc.) instead of hand-rolled buttons.
export default function ToggleGroupField<T extends string>({
  value,
  onValueChange,
  options,
  disabled,
  orientation = 'horizontal',
  className
}: ToggleGroupFieldProps<T>): React.JSX.Element {
  const isVertical = orientation === 'vertical'

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next: string) => {
        if (next) onValueChange(next as T)
      }}
      disabled={disabled}
      spacing={isVertical ? 2 : 0}
      className={cn('w-full', isVertical && 'flex-col items-stretch', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          title={option.title}
          className={cn(
            'flex-1 gap-1.5 text-xs font-semibold',
            // Vertical options carry longer, descriptive labels — let them wrap
            // and grow in height instead of forcing a fixed, clipped pill.
            isVertical && 'h-auto w-full justify-start whitespace-normal py-2 text-left'
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
