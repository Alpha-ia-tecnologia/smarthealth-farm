import { useQuery } from "@tanstack/react-query"
import { medicamentosApi, type MedicamentoFiltros } from "@/lib/medicamentos"

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
