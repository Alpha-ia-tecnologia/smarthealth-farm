import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { FiltrosResumo } from "@/lib/api"
import {
  estoqueApi,
  type LoteFiltros,
  type ParamsPaginacao,
  type PosicaoFiltros,
} from "@/lib/estoque"

/** Chaves de cache do domínio de estoque. */
export const estoqueKeys = {
  raiz: ["estoque"] as const,
  posicoes: (filtros: PosicaoFiltros, paginacao: ParamsPaginacao) =>
    ["estoque", "posicoes", filtros, paginacao] as const,
  resumo: (filtros: FiltrosResumo) => ["estoque", "resumo", filtros] as const,
  detalhe: (medId: string, uniId: string) => ["estoque", "detalhe", medId, uniId] as const,
  lotes: (filtros: LoteFiltros, paginacao: ParamsPaginacao) =>
    ["estoque", "lotes", filtros, paginacao] as const,
}

/** Posições de estoque paginadas com status (+ filtros). Mantém a página anterior ao paginar. */
export function usePosicoes(filtros: PosicaoFiltros = {}, paginacao: ParamsPaginacao = {}) {
  return useQuery({
    queryKey: estoqueKeys.posicoes(filtros, paginacao),
    queryFn: () => estoqueApi.listarPosicoes(filtros, paginacao),
    placeholderData: keepPreviousData,
  })
}

/** KPIs do estoque (filtros opcionais por unidade/insumo). */
export function useResumoEstoque(filtros: FiltrosResumo = {}) {
  return useQuery({
    queryKey: estoqueKeys.resumo(filtros),
    queryFn: () => estoqueApi.resumo(filtros),
  })
}

/** Drill-down de uma posição (lotes + movimentações). Desabilitado sem id. */
export function usePosicaoDetalhe(insumoId: string | undefined, unidadeId: string | undefined) {
  return useQuery({
    queryKey: estoqueKeys.detalhe(insumoId ?? "", unidadeId ?? ""),
    queryFn: () => estoqueApi.detalhar(insumoId as string, unidadeId as string),
    enabled: Boolean(insumoId && unidadeId),
  })
}

/** Lotes paginados com dias para vencer (+ filtros). Mantém a página anterior ao paginar. */
export function useLotes(filtros: LoteFiltros = {}, paginacao: ParamsPaginacao = {}) {
  return useQuery({
    queryKey: estoqueKeys.lotes(filtros, paginacao),
    queryFn: () => estoqueApi.listarLotes(filtros, paginacao),
    placeholderData: keepPreviousData,
  })
}
