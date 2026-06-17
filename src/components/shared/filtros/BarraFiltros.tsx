import { SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  /** Controles de filtro (SelectFiltro/FiltroUnidade/FiltroInsumo e afins). */
  children: React.ReactNode
  /** Esconde o ícone/rótulo "Filtros" à esquerda (quando o contexto já deixa claro). */
  semRotulo?: boolean
  className?: string
}

/**
 * Contêiner unificado de filtros: um painel discreto (segunda camada neutra, borda fina) que
 * agrupa os controles em linha e quebra em telas estreitas. O rótulo "Filtros" lidera com o mesmo
 * tratamento de ícone dos KpiCards, mantendo a linguagem visual do projeto. Os filtros específicos
 * entram como `children`, então cada tela compõe o conjunto que precisa.
 */
export function BarraFiltros({ children, semRotulo, className }: Props) {
  return (
    <div
      role="search"
      aria-label="Filtros"
      className={cn(
        "rounded-xl border border-border/70 bg-muted/60 px-3.5 py-3 shadow-xs",
        className,
      )}
    >
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {!semRotulo && (
          <div className="flex h-9 items-center gap-2 pr-1">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
              <SlidersHorizontal className="size-3.5" />
            </span>
            <span className="text-sm font-medium text-foreground/85">Filtros</span>
            <span aria-hidden className="ml-1 hidden h-5 w-px bg-border/70 sm:block" />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
