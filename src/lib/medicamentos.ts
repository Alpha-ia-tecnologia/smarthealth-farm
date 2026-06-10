// Serviço do catálogo de medicamentos (RF-DAD-06). Leitura para qualquer autenticado.
import type { FamiliaTerapeutica, Medicamento } from "@/types"
import { api, montarQuery } from "./api"

export interface MedicamentoFiltros {
  familia?: FamiliaTerapeutica
  criticidade?: Medicamento["criticidade"]
  essencial?: boolean
  ativo?: boolean
  busca?: string
}

export const medicamentosApi = {
  /** GET /medicamentos (+ filtros). */
  listar: (filtros: MedicamentoFiltros = {}) =>
    api.get<Medicamento[]>(`/medicamentos${montarQuery({ ...filtros })}`),

  /** GET /medicamentos/{id}. */
  buscar: (id: string) => api.get<Medicamento>(`/medicamentos/${id}`),
}
