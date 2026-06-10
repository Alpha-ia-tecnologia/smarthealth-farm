// Serviço do catálogo de unidades (RF-DAD-06). Leitura para qualquer autenticado.
import type { Unidade } from "@/types"
import { api, montarQuery } from "./api"

export interface UnidadeFiltros {
  porte?: Unidade["porte"]
  conectividade?: Unidade["conectividade"]
  hub?: boolean
  ativo?: boolean
  busca?: string
}

export const unidadesApi = {
  /** GET /unidades (+ filtros). */
  listar: (filtros: UnidadeFiltros = {}) =>
    api.get<Unidade[]>(`/unidades${montarQuery({ ...filtros })}`),

  /** GET /unidades/{id}. */
  buscar: (id: string) => api.get<Unidade>(`/unidades/${id}`),
}
