import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RfTag } from "./RfTag"

interface Props {
  title?: string
  description?: string
  rf?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  noPadding?: boolean
}

export function Section({
  title,
  description,
  rf,
  icon,
  action,
  children,
  className,
  bodyClassName,
  noPadding,
}: Props) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      {(title || action) && (
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b px-5 py-4">
          <div className="flex items-start gap-2.5">
            {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {title && <h3 className="font-display text-sm font-semibold tracking-tight">{title}</h3>}
                {rf && <RfTag ids={rf} />}
              </div>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(noPadding ? "p-0" : "p-5", bodyClassName)}>{children}</CardContent>
    </Card>
  )
}
