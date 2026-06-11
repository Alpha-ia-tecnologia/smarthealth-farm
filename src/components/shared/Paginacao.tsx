import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TAMANHOS_PAGINA } from "@/lib/paginacao"
import { cn } from "@/lib/utils"

interface PaginacaoProps {
  /** Página atual (base 0). */
  paginaAtual: number
  totalPaginas: number
  /** Chamado com a nova página (base 0). */
  onMudarPagina: (pagina: number) => void
  /** Registros por página. */
  tamanhoPagina: number
  /** Chamado ao trocar o tamanho da página (o chamador deve voltar à página 0). */
  onMudarTamanho: (tamanho: number) => void
  /** Total de registros, para o rótulo "N registro(s)". */
  totalRegistros?: number
  className?: string
}

/**
 * Paginação com seleção direta: um select com todas as páginas, um select de registros por
 * página (5/10/20/30) e anterior/próxima. Base 0 na interface (combina com o TanStack Table),
 * exibida em base 1. Some quando tudo cabe na menor página.
 */
export function Paginacao({
  paginaAtual,
  totalPaginas,
  onMudarPagina,
  tamanhoPagina,
  onMudarTamanho,
  totalRegistros,
  className,
}: PaginacaoProps) {
  const total = totalRegistros ?? 0
  // Sem o que paginar nem o que reconfigurar: menos que a menor opção de página.
  if (totalPaginas <= 1 && total <= TAMANHOS_PAGINA[0]) return null

  const paginas = Array.from({ length: Math.max(1, totalPaginas) }, (_, i) => i + 1)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="tabular">
        {totalRegistros !== undefined ? `${totalRegistros} registro(s)` : ""}
      </span>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs">Por página</span>
          <Select value={String(tamanhoPagina)} onValueChange={(v) => onMudarTamanho(Number(v))}>
            <SelectTrigger size="sm" className="w-18 tabular" aria-label="Registros por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAMANHOS_PAGINA.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs">Página</span>
          <Select
            value={String(paginaAtual + 1)}
            onValueChange={(v) => onMudarPagina(Number(v) - 1)}
          >
            <SelectTrigger size="sm" className="w-18 tabular" aria-label="Página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paginas.map((p) => (
                <SelectItem key={p} value={String(p)}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs tabular">de {Math.max(1, totalPaginas)}</span>
        </div>

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
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onMudarPagina(paginaAtual + 1)}
            disabled={paginaAtual + 1 >= totalPaginas}
            aria-label="Próxima página"
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      </div>
    </div>
  )
}
