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

/** Dados de escrita de unidade (criar/atualizar). Enums em rótulo pt-BR (o backend aceita). */
export interface DadosUnidade {
  nome: string
  sigla: string
  municipio: string
  porte: Unidade["porte"]
  leitos: number
  conectividade: Unidade["conectividade"]
  perfilDemografico: string
  hub: boolean
}

export const unidadesApi = {
  /** GET /unidades (+ filtros). */
  listar: (filtros: UnidadeFiltros = {}) =>
    api.get<Unidade[]>(`/unidades${montarQuery({ ...filtros })}`),

  /** GET /unidades/{id}. */
  buscar: (id: string) => api.get<Unidade>(`/unidades/${id}`),

  /** POST /unidades (TI) — sigla única (409 em conflito). */
  criar: (body: DadosUnidade) => api.post<Unidade>("/unidades", body),

  /** PUT /unidades/{id} (TI). */
  atualizar: (id: string, body: DadosUnidade) => api.put<Unidade>(`/unidades/${id}`, body),

  /** PATCH /unidades/{id}/status (TI) — ativa/desativa. */
  alterarStatus: (id: string, ativo: boolean) =>
    api.patch<Unidade>(`/unidades/${id}/status`, { ativo }),
}
