import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  recomendacoesApi,
  type CriarTransferencia,
  type EditarRecomendacao,
  type RecomendacaoFiltros,
} from "@/lib/recomendacoes"
import type { FiltrosResumo, ParamsPaginacao } from "@/lib/api"

/** Chaves de cache do domínio de recomendações. */
export const recomendacoesKeys = {
  raiz: ["recomendacoes"] as const,
  lista: (filtros: RecomendacaoFiltros, paginacao: ParamsPaginacao) =>
    ["recomendacoes", "lista", filtros, paginacao] as const,
  resumo: (filtros: FiltrosResumo) => ["recomendacoes", "resumo", filtros] as const,
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

/** KPIs do painel de recomendações (filtros opcionais por unidade/medicamento). */
export function useResumoRecomendacoes(filtros: FiltrosResumo = {}) {
  return useQuery({
    queryKey: recomendacoesKeys.resumo(filtros),
    queryFn: () => recomendacoesApi.resumo(filtros),
  })
}

/** Cria uma transferência manual (Gestor) e invalida lista + resumo. */
export function useCriarTransferencia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CriarTransferencia) => recomendacoesApi.criar(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recomendacoesKeys.raiz }),
  })
}

/** Edita uma recomendação pendente (Gestor) e invalida lista + resumo. */
export function useEditarRecomendacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EditarRecomendacao }) =>
      recomendacoesApi.editar(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recomendacoesKeys.raiz }),
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

/** Recusa (descarta) uma recomendação pendente (Gestor) e invalida lista + resumo. */
export function useRecusarRecomendacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recomendacoesApi.recusar(id),
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
