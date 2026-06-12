// Serviço de Previsão de Demanda (RF-PRV). Leitura para qualquer autenticado;
// recalibrar é ação de Gestor (o backend barra; a UI espelha).
import { api, montarQuery, paramsPaginacao, type Pagina, type ParamsPaginacao } from "./api"

export type Drift = "Estável" | "Atenção" | "Degradado"
export type Criticidade = "Alta" | "Média" | "Baixa"

/** Meta de assertividade do projeto: MAPE < 15% (espelha CalculadoraPrevisao.META_MAPE). */
export const META_MAPE = 15

/** Ponto da série temporal: realizado/previsto por período, com bandas opcionais (RF-PRV-02). */
export interface PontoSerie {
  periodo: string // "AAAA-MM"
  realizado: number | null
  previsto: number | null
  limiteInferior: number | null
  limiteSuperior: number | null
}

/** Linha da tabela de previsões (RF-PRV-01) — tudo denormalizado pelo backend. */
export interface Previsao {
  id: string
  medicamentoId: string
  medicamentoCodigo: string
  medicamentoNome: string
  criticidade: Criticidade
  unidadeId: string
  unidadeSigla: string
  unidadeNome: string
  horizonteMeses: number
  mape: number // %
  modelo: string
  versaoModelo: string // RF-PRV-09
  drift: Drift // RF-PRV-06
  calibradoEm: string // ISO date
}

/** Detalhe de uma previsão: o resumo + a série temporal completa (RF-PRV-02). */
export interface PrevisaoDetalhe {
  previsao: Previsao
  serie: PontoSerie[]
}

/** KPIs do painel (RF-PRV-04/05/06). */
export interface ResumoPrevisao {
  mapeMedio: number
  criticosNaMeta: number
  totalCriticos: number
  previsoesAtivas: number
  itensComDesvio: number
}

/** Resultado da recalibração (RF-PRV — ação de Gestor). */
export interface Recalibracao {
  recalibradas: number
  calibradoEm: string // ISO date
  mensagem: string
}

export interface PrevisaoFiltros {
  unidadeId?: string
  medicamentoId?: string
  drift?: Drift
  busca?: string
}

export const previsoesApi = {
  /** GET /previsoes — paginado (ordenado por medicamento) com filtros opcionais (rótulos pt-BR). */
  listar: (
    filtros: PrevisaoFiltros = {},
    paginacao: ParamsPaginacao = {},
  ): Promise<Pagina<Previsao>> =>
    api.getPagina<Previsao>(`/previsoes${montarQuery({ ...filtros, ...paramsPaginacao(paginacao) })}`),

  /** GET /previsoes/resumo — KPIs do painel (MAPE médio, críticos na meta, drift). */
  resumo: () => api.get<ResumoPrevisao>("/previsoes/resumo"),

  /** GET /previsoes/{medicamentoId}/{unidadeId} — série temporal completa do item. */
  detalhar: (medicamentoId: string, unidadeId: string) =>
    api.get<PrevisaoDetalhe>(`/previsoes/${medicamentoId}/${unidadeId}`),

  /** POST /previsoes/recalibrar — recalibra os modelos e estabiliza drift (Gestor; auditado). */
  recalibrar: () => api.post<Recalibracao>("/previsoes/recalibrar"),
}
