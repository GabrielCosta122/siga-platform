import type { ReactNode } from 'react'

type SectionHeadingProps = {
  title: string
  description?: string
  action?: ReactNode
}

function SectionHeading({ title, description, action }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export { SectionHeading }
