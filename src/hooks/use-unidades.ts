import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { unidadesApi, type DadosUnidade, type UnidadeFiltros } from "@/lib/unidades"

/** Chaves de cache do domínio de unidades. */
export const unidadesKeys = {
  raiz: ["unidades"] as const,
  lista: (filtros: UnidadeFiltros) => ["unidades", "lista", filtros] as const,
  detalhe: (id: string) => ["unidades", "detalhe", id] as const,
}

/** Lista unidades (com filtros opcionais). */
export function useUnidades(filtros: UnidadeFiltros = {}) {
  return useQuery({
    queryKey: unidadesKeys.lista(filtros),
    queryFn: () => unidadesApi.listar(filtros),
  })
}

/** Detalha uma unidade por id (desabilitado sem id). */
export function useUnidade(id: string | undefined) {
  return useQuery({
    queryKey: unidadesKeys.detalhe(id ?? ""),
    queryFn: () => unidadesApi.buscar(id as string),
    enabled: Boolean(id),
  })
}

/** Cria uma unidade (TI) e invalida a lista. */
export function useCriarUnidade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: DadosUnidade) => unidadesApi.criar(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: unidadesKeys.raiz }),
  })
}

/** Atualiza uma unidade (TI) e invalida a lista. */
export function useAtualizarUnidade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DadosUnidade }) =>
      unidadesApi.atualizar(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: unidadesKeys.raiz }),
  })
}

/** Ativa/desativa uma unidade (TI) e invalida a lista. */
export function useAlterarStatusUnidade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      unidadesApi.alterarStatus(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: unidadesKeys.raiz }),
  })
}
