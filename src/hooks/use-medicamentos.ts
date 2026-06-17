import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { medicamentosApi, type DadosMedicamento, type MedicamentoFiltros } from "@/lib/medicamentos"

/** Chaves de cache do domínio de medicamentos. */
export const medicamentosKeys = {
  raiz: ["medicamentos"] as const,
  lista: (filtros: MedicamentoFiltros) => ["medicamentos", "lista", filtros] as const,
  detalhe: (id: string) => ["medicamentos", "detalhe", id] as const,
}

/** Lista medicamentos (com filtros opcionais). */
export function useMedicamentos(filtros: MedicamentoFiltros = {}) {
  return useQuery({
    queryKey: medicamentosKeys.lista(filtros),
    queryFn: () => medicamentosApi.listar(filtros),
    // Mantém a lista anterior enquanto recarrega ao trocar de unidade (sem piscar p/ vazio).
    placeholderData: keepPreviousData,
  })
}

/** Detalha um medicamento por id (desabilitado sem id). */
export function useMedicamento(id: string | undefined) {
  return useQuery({
    queryKey: medicamentosKeys.detalhe(id ?? ""),
    queryFn: () => medicamentosApi.buscar(id as string),
    enabled: Boolean(id),
  })
}

/** Cria um medicamento (TI) e invalida a lista. */
export function useCriarMedicamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: DadosMedicamento) => medicamentosApi.criar(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: medicamentosKeys.raiz }),
  })
}

/** Atualiza um medicamento (TI) e invalida a lista. */
export function useAtualizarMedicamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DadosMedicamento }) =>
      medicamentosApi.atualizar(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: medicamentosKeys.raiz }),
  })
}

/** Ativa/desativa um medicamento (TI) e invalida a lista. */
export function useAlterarStatusMedicamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      medicamentosApi.alterarStatus(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: medicamentosKeys.raiz }),
  })
}
