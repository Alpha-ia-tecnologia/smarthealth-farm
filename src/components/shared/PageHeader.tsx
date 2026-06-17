import { cn } from "@/lib/utils"
import { InfoHint } from "./InfoHint"

interface Props {
  title: string
  description?: string
  /** Explicação em linguagem simples do que esta tela faz (ícone ⓘ ao lado do título). */
  info?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, info, icon, actions, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {info && <InfoHint texto={info} lado="bottom" />}
          </div>
          {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
