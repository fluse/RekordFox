import React from 'react'

interface SettingsSectionProps {
  title: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}

export default function SettingsSection({
  title,
  headerRight,
  children
}: SettingsSectionProps): React.JSX.Element {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
        <h2 className="text-xs font-bold tracking-wider text-muted-foreground/70 uppercase">
          {title}
        </h2>
        {headerRight}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}
