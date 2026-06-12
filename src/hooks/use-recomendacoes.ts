import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { recomendacoesApi, type RecomendacaoFiltros } from "@/lib/recomendacoes"
import type { ParamsPaginacao } from "@/lib/api"

/** Chaves de cache do domínio de recomendações. */
export const recomendacoesKeys = {
  raiz: ["recomendacoes"] as const,
  lista: (filtros: RecomendacaoFiltros, paginacao: ParamsPaginacao) =>
    ["recomendacoes", "lista", filtros, paginacao] as const,
  resumo: () => ["recomendacoes", "resumo"] as const,
}

/** Recomendações paginadas (maior economia primeiro) com filtros opcionais. Mantém a página anterior. */
export function useRecomendacoes(
  filtros: RecomendacaoFiltros = {},
  paginacao: ParamsPaginacao = {},
) {
  return useQuery({
    queryKey: recomendacoesKeys.lista(filtros, paginacao),
    queryFn: () => recomendacoesApi.listar(filtros, paginacao),
    placeholderData: keepPreviousData,
  })
}

/** KPIs do painel de recomendações. */
export function useResumoRecomendacoes() {
  return useQuery({
    queryKey: recomendacoesKeys.resumo(),
    queryFn: () => recomendacoesApi.resumo(),
  })
}

/** Aprova uma recomendação pendente (Gestor) e invalida lista + resumo. */
export function useAprovarRecomendacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recomendacoesApi.aprovar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recomendacoesKeys.raiz }),
  })
}

/** Marca uma recomendação aprovada como executada (Gestor) e invalida lista + resumo. */
export function useExecutarRecomendacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recomendacoesApi.executar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recomendacoesKeys.raiz }),
  })
}

/** Regenera as recomendações pelo motor (Gestor) e invalida lista + resumo. */
export function useGerarRecomendacoes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => recomendacoesApi.gerar(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recomendacoesKeys.raiz }),
  })
}
