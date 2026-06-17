// Serviço do catálogo de insumos (RF-DAD-06). Leitura para qualquer autenticado.
import type { CategoriaInsumo, Insumo } from "@/types"
import { api, montarQuery } from "./api"

/** Categorias de insumo (rótulos pt-BR, espelham o enum CategoriaInsumo do backend). */
export const categoriasInsumo: CategoriaInsumo[] = [
  "Antibióticos",
  "Analgésicos",
  "Antivirais",
  "Cardiovascular",
  "Soros e Vacinas",
  "Insumos Médicos",
  "Saúde Mental",
  "Antiparasitários",
]

/** Criticidades (rótulos pt-BR, espelham o enum Criticidade do backend). */
export const criticidades: Insumo["criticidade"][] = ["Alta", "Média", "Baixa"]

export interface InsumoFiltros {
  categoria?: CategoriaInsumo
  criticidade?: Insumo["criticidade"]
  essencial?: boolean
  ativo?: boolean
  busca?: string
  /** Restringe aos insumos com posição de estoque na unidade (filtro dependente). */
  unidadeId?: string
}

/** Dados de escrita de insumo (criar/atualizar). Enums em rótulo pt-BR (o backend aceita). */
export interface DadosInsumo {
  codigo: string
  nome: string
  apresentacao: string
  categoria: CategoriaInsumo
  unidadeMedida: string
  criticidade: Insumo["criticidade"]
  essencial: boolean
}

export const insumosApi = {
  /** GET /insumos (+ filtros). */
  listar: (filtros: InsumoFiltros = {}) =>
    api.get<Insumo[]>(`/insumos${montarQuery({ ...filtros })}`),

  /** GET /insumos/{id}. */
  buscar: (id: string) => api.get<Insumo>(`/insumos/${id}`),

  /** POST /insumos (TI) — código único (409 em conflito). */
  criar: (body: DadosInsumo) => api.post<Insumo>("/insumos", body),

  /** PUT /insumos/{id} (TI). */
  atualizar: (id: string, body: DadosInsumo) =>
    api.put<Insumo>(`/insumos/${id}`, body),

  /** PATCH /insumos/{id}/status (TI) — ativa/desativa. */
  alterarStatus: (id: string, ativo: boolean) =>
    api.patch<Insumo>(`/insumos/${id}/status`, { ativo }),
}
