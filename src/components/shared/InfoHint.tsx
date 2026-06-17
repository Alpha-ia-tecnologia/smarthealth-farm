import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface Props {
  /** Texto explicativo, em linguagem simples, exibido ao passar o mouse ou focar. */
  texto: string
  /** Rótulo acessível do gatilho (lido por leitores de tela). */
  rotulo?: string
  /** Lado preferido do balão. */
  lado?: "top" | "right" | "bottom" | "left"
  className?: string
}

/**
 * Ícone de ajuda (ⓘ) com explicação ao passar o mouse / focar — para que quem não conhece o
 * sistema entenda o que está vendo. Acessível: é um botão focável com `aria-label`.
 */
export function InfoHint({ texto, rotulo = "O que é isto?", lado = "top", className }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={rotulo}
          onClick={(e) => e.preventDefault()}
          className={cn(
            "inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={lado} className="max-w-xs text-pretty text-left leading-relaxed">
        {texto}
      </TooltipContent>
    </Tooltip>
  )
}
