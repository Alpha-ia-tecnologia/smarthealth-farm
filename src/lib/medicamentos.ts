// Serviço do catálogo de medicamentos (RF-DAD-06). Leitura para qualquer autenticado.
import type { FamiliaTerapeutica, Medicamento } from "@/types"
import { api, montarQuery } from "./api"

/** Famílias terapêuticas (rótulos pt-BR, espelham o enum FamiliaTerapeutica do backend). */
export const familiasTerapeuticas: FamiliaTerapeutica[] = [
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
export const criticidades: Medicamento["criticidade"][] = ["Alta", "Média", "Baixa"]

export interface MedicamentoFiltros {
  familia?: FamiliaTerapeutica
  criticidade?: Medicamento["criticidade"]
  essencial?: boolean
  ativo?: boolean
  busca?: string
  /** Restringe aos medicamentos com posição de estoque na unidade (filtro dependente). */
  unidadeId?: string
}

/** Dados de escrita de medicamento (criar/atualizar). Enums em rótulo pt-BR (o backend aceita). */
export interface DadosMedicamento {
  codigo: string
  nome: string
  apresentacao: string
  familia: FamiliaTerapeutica
  unidadeMedida: string
  criticidade: Medicamento["criticidade"]
  essencial: boolean
}

export const medicamentosApi = {
  /** GET /medicamentos (+ filtros). */
  listar: (filtros: MedicamentoFiltros = {}) =>
    api.get<Medicamento[]>(`/medicamentos${montarQuery({ ...filtros })}`),

  /** GET /medicamentos/{id}. */
  buscar: (id: string) => api.get<Medicamento>(`/medicamentos/${id}`),

  /** POST /medicamentos (TI) — código único (409 em conflito). */
  criar: (body: DadosMedicamento) => api.post<Medicamento>("/medicamentos", body),

  /** PUT /medicamentos/{id} (TI). */
  atualizar: (id: string, body: DadosMedicamento) =>
    api.put<Medicamento>(`/medicamentos/${id}`, body),

  /** PATCH /medicamentos/{id}/status (TI) — ativa/desativa. */
  alterarStatus: (id: string, ativo: boolean) =>
    api.patch<Medicamento>(`/medicamentos/${id}/status`, { ativo }),
}
