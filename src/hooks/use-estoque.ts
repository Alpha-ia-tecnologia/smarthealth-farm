import { useQuery } from "@tanstack/react-query"
import {
  estoqueApi,
  type LoteFiltros,
  type PosicaoFiltros,
} from "@/lib/estoque"

/** Chaves de cache do domínio de estoque. */
export const estoqueKeys = {
  raiz: ["estoque"] as const,
  posicoes: (filtros: PosicaoFiltros) => ["estoque", "posicoes", filtros] as const,
  resumo: () => ["estoque", "resumo"] as const,
  detalhe: (medId: string, uniId: string) => ["estoque", "detalhe", medId, uniId] as const,
  lotes: (filtros: LoteFiltros) => ["estoque", "lotes", filtros] as const,
}

/** Posições de estoque com status (+ filtros). */
export function usePosicoes(filtros: PosicaoFiltros = {}) {
  return useQuery({
    queryKey: estoqueKeys.posicoes(filtros),
    queryFn: () => estoqueApi.listarPosicoes(filtros),
  })
}

/** KPIs do estoque. */
export function useResumoEstoque() {
  return useQuery({
    queryKey: estoqueKeys.resumo(),
    queryFn: () => estoqueApi.resumo(),
  })
}

/** Drill-down de uma posição (lotes + movimentações). Desabilitado sem id. */
export function usePosicaoDetalhe(medicamentoId: string | undefined, unidadeId: string | undefined) {
  return useQuery({
    queryKey: estoqueKeys.detalhe(medicamentoId ?? "", unidadeId ?? ""),
    queryFn: () => estoqueApi.detalhar(medicamentoId as string, unidadeId as string),
    enabled: Boolean(medicamentoId && unidadeId),
  })
}

/** Lotes com dias para vencer (+ filtros). */
export function useLotes(filtros: LoteFiltros = {}) {
  return useQuery({
    queryKey: estoqueKeys.lotes(filtros),
    queryFn: () => estoqueApi.listarLotes(filtros),
  })
}
