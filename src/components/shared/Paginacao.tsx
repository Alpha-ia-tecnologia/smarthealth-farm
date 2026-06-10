import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginacaoProps {
  /** Página atual (base 0). */
  paginaAtual: number
  totalPaginas: number
  /** Chamado com a nova página (base 0). */
  onMudarPagina: (pagina: number) => void
  /** Total de registros, para o rótulo "N registro(s)". */
  totalRegistros?: number
  className?: string
}

/** Janela de páginas visíveis (base 1) com reticências: 1 … 4 5 6 … 20. */
function janelaPaginas(atual: number, total: number): (number | "reticencia")[] {
  const paginas: (number | "reticencia")[] = [1]
  const inicio = Math.max(2, atual - 1)
  const fim = Math.min(total - 1, atual + 1)
  if (inicio > 2) paginas.push("reticencia")
  for (let p = inicio; p <= fim; p++) paginas.push(p)
  if (fim < total - 1) paginas.push("reticencia")
  if (total > 1) paginas.push(total)
  return paginas
}

/**
 * Paginação com seleção direta de página (números) + anterior/próxima. Trabalha em base 0 na
 * interface (combina com o TanStack Table) e exibe os números em base 1. Some quando há 1 página.
 */
export function Paginacao({
  paginaAtual,
  totalPaginas,
  onMudarPagina,
  totalRegistros,
  className,
}: PaginacaoProps) {
  if (totalPaginas <= 1) return null
  const atual1 = paginaAtual + 1
  const paginas = janelaPaginas(atual1, totalPaginas)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="tabular">
        {totalRegistros !== undefined ? `${totalRegistros} registro(s) · ` : ""}
        página {atual1} de {totalPaginas}
      </span>
      <nav className="flex items-center gap-1" aria-label="Paginação">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onMudarPagina(paginaAtual - 1)}
          disabled={paginaAtual === 0}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {paginas.map((p, i) =>
          p === "reticencia" ? (
            <span key={`r${i}`} className="select-none px-1.5" aria-hidden>
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === atual1 ? "default" : "outline"}
              size="icon"
              className="size-8 tabular"
              onClick={() => onMudarPagina(p - 1)}
              aria-label={`Página ${p}`}
              aria-current={p === atual1 ? "page" : undefined}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onMudarPagina(paginaAtual + 1)}
          disabled={atual1 === totalPaginas}
          aria-label="Próxima página"
        >
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  )
}
