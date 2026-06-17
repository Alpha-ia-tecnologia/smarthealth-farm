import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { previsoesApi, type PrevisaoFiltros } from "@/lib/previsoes"
import type { FiltrosResumo, ParamsPaginacao } from "@/lib/api"

/** Chaves de cache do domínio de previsões. */
export const previsoesKeys = {
  raiz: ["previsoes"] as const,
  lista: (filtros: PrevisaoFiltros, paginacao: ParamsPaginacao) =>
    ["previsoes", "lista", filtros, paginacao] as const,
  resumo: (filtros: FiltrosResumo) => ["previsoes", "resumo", filtros] as const,
  detalhe: (insumoId?: string, unidadeId?: string) =>
    ["previsoes", "detalhe", insumoId, unidadeId] as const,
}

/** Previsões paginadas (ordenadas por insumo) com filtros opcionais. Mantém a página anterior. */
export function usePrevisoes(filtros: PrevisaoFiltros = {}, paginacao: ParamsPaginacao = {}) {
  return useQuery({
    queryKey: previsoesKeys.lista(filtros, paginacao),
    queryFn: () => previsoesApi.listar(filtros, paginacao),
    placeholderData: keepPreviousData,
  })
}

/** KPIs do painel de previsão (filtros opcionais por unidade/insumo). */
export function useResumoPrevisao(filtros: FiltrosResumo = {}) {
  return useQuery({
    queryKey: previsoesKeys.resumo(filtros),
    queryFn: () => previsoesApi.resumo(filtros),
  })
}

/** Série temporal de um item (só dispara com insumo e unidade definidos). */
export function usePrevisaoDetalhe(insumoId?: string, unidadeId?: string) {
  return useQuery({
    queryKey: previsoesKeys.detalhe(insumoId, unidadeId),
    queryFn: () => previsoesApi.detalhar(insumoId!, unidadeId!),
    enabled: !!insumoId && !!unidadeId,
  })
}

/** Recalibra as previsões (Gestor) e invalida lista + resumo + detalhe. */
export function useRecalibrarPrevisoes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => previsoesApi.recalibrar(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: previsoesKeys.raiz }),
  })
}
