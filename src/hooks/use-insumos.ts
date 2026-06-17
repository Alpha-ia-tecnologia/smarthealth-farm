import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { insumosApi, type DadosInsumo, type InsumoFiltros } from "@/lib/insumos"

/** Chaves de cache do domínio de insumos. */
export const insumosKeys = {
  raiz: ["insumos"] as const,
  lista: (filtros: InsumoFiltros) => ["insumos", "lista", filtros] as const,
  detalhe: (id: string) => ["insumos", "detalhe", id] as const,
}

/** Lista insumos (com filtros opcionais). */
export function useInsumos(filtros: InsumoFiltros = {}) {
  return useQuery({
    queryKey: insumosKeys.lista(filtros),
    queryFn: () => insumosApi.listar(filtros),
    // Mantém a lista anterior enquanto recarrega ao trocar de unidade (sem piscar p/ vazio).
    placeholderData: keepPreviousData,
  })
}

/** Detalha um insumo por id (desabilitado sem id). */
export function useInsumo(id: string | undefined) {
  return useQuery({
    queryKey: insumosKeys.detalhe(id ?? ""),
    queryFn: () => insumosApi.buscar(id as string),
    enabled: Boolean(id),
  })
}

/** Cria um insumo (TI) e invalida a lista. */
export function useCriarInsumo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: DadosInsumo) => insumosApi.criar(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: insumosKeys.raiz }),
  })
}

/** Atualiza um insumo (TI) e invalida a lista. */
export function useAtualizarInsumo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DadosInsumo }) =>
      insumosApi.atualizar(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: insumosKeys.raiz }),
  })
}

/** Ativa/desativa um insumo (TI) e invalida a lista. */
export function useAlterarStatusInsumo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      insumosApi.alterarStatus(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: insumosKeys.raiz }),
  })
}
