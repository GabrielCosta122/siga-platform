import { Sparkles } from 'lucide-react'

function StoryMilestone() {
  return (
    <aside className="relative my-2 pl-8 sm:pl-10">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" aria-hidden="true" />
          <p className="text-sm font-medium">Um novo começo</p>
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          A assinatura do contrato transformou um plano em parte da nossa história.
        </p>
      </div>
    </aside>
  )
}

export { StoryMilestone }
