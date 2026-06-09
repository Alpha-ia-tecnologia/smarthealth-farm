import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Tag discreta de rastreabilidade com o Documento de Requisitos Funcionais.
export function RfTag({ ids, className }: { ids: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-help items-center rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-tight text-muted-foreground",
            className,
          )}
        >
          {ids}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Requisito Funcional {ids} — Smart Health CAHOSP
      </TooltipContent>
    </Tooltip>
  )
}
