import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { previsoesApi, type PrevisaoFiltros } from "@/lib/previsoes"
import type { ParamsPaginacao } from "@/lib/api"

/** Chaves de cache do domínio de previsões. */
export const previsoesKeys = {
  raiz: ["previsoes"] as const,
  lista: (filtros: PrevisaoFiltros, paginacao: ParamsPaginacao) =>
    ["previsoes", "lista", filtros, paginacao] as const,
  resumo: () => ["previsoes", "resumo"] as const,
  detalhe: (medicamentoId?: string, unidadeId?: string) =>
    ["previsoes", "detalhe", medicamentoId, unidadeId] as const,
}

/** Previsões paginadas (ordenadas por medicamento) com filtros opcionais. Mantém a página anterior. */
export function usePrevisoes(filtros: PrevisaoFiltros = {}, paginacao: ParamsPaginacao = {}) {
  return useQuery({
    queryKey: previsoesKeys.lista(filtros, paginacao),
    queryFn: () => previsoesApi.listar(filtros, paginacao),
    placeholderData: keepPreviousData,
  })
}

/** KPIs do painel de previsão. */
export function useResumoPrevisao() {
  return useQuery({
    queryKey: previsoesKeys.resumo(),
    queryFn: () => previsoesApi.resumo(),
  })
}

/** Série temporal de um item (só dispara com medicamento e unidade definidos). */
export function usePrevisaoDetalhe(medicamentoId?: string, unidadeId?: string) {
  return useQuery({
    queryKey: previsoesKeys.detalhe(medicamentoId, unidadeId),
    queryFn: () => previsoesApi.detalhar(medicamentoId!, unidadeId!),
    enabled: !!medicamentoId && !!unidadeId,
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
