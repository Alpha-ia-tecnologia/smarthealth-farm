// Serviço de Recomendações (RF-REC). Leitura para qualquer autenticado;
// aprovar, executar e gerar são ações de Gestor (o backend barra; a UI espelha).
import { api, montarQuery, paramsPaginacao, type FiltrosResumo, type Pagina, type ParamsPaginacao } from "./api"

export type TipoRecomendacao = "Reposição" | "Redistribuição"
export type StatusRecomendacao = "Pendente" | "Aprovada" | "Executada" | "Recusada"
export type OrigemMotor = "Regras" | "Aprendizado de Máquina" | "Manual"
export type Prioridade = "Essencial" | "Importante" | "Desejável"

/**
 * Economia (R$) por unidade transferida numa transferência manual. Espelha
 * `CalculadoraRecomendacao.FATOR_ECONOMIA_MANUAL` no backend (MVP — valor fictício, sem métrica
 * real de custo). Usado para a prévia ao vivo no modal; o backend é a fonte da verdade ao salvar.
 */
export const FATOR_ECONOMIA_MANUAL = 12

/** Economia estimada de uma transferência manual: `quantidade × 12`. */
export function economiaManual(quantidade: number): number {
  return Math.max(0, Math.trunc(quantidade)) * FATOR_ECONOMIA_MANUAL
}

/** Cartão de recomendação (RF-REC-01/02/03/04) — tudo denormalizado pelo backend. */
export interface Recomendacao {
  id: string
  tipo: TipoRecomendacao
  insumoId: string
  insumoCodigo: string
  insumoNome: string
  unidadeDestinoId: string
  unidadeDestinoSigla: string
  unidadeDestinoNome: string
  /** Só em redistribuição (reposição vem null). */
  unidadeOrigemId: string | null
  unidadeOrigemSigla: string | null
  unidadeOrigemNome: string | null
  quantidade: number
  justificativa: string
  origemMotor: OrigemMotor
  prioridade: Prioridade
  economiaEstimada: number // R$
  status: StatusRecomendacao
  criadoEm: string // ISO instant
}

/** KPIs do painel (RF-REC-01/02/03/05). */
export interface ResumoRecomendacoes {
  pendentes: number
  aprovadas: number
  executadas: number
  economiaPotencial: number // R$
  geradasPorIA: number
  taxaAdesao: number // %
  total: number
}

/** Resultado da regeneração pelo motor (RF-REC-01 — ação de Gestor). */
export interface GeracaoRecomendacoes {
  reposicaoGeradas: number
  redistribuicaoGeradas: number
  pendentesRenovadas: number
  totalAtivo: number
  mensagem: string
}

export interface RecomendacaoFiltros {
  tipo?: TipoRecomendacao
  status?: StatusRecomendacao
  origemMotor?: OrigemMotor
  prioridade?: Prioridade
  unidadeId?: string
  insumoId?: string
  busca?: string
}

/** Corpo do POST /recomendacoes — cria uma transferência manual (redistribuição). */
export interface CriarTransferencia {
  insumoId: string
  unidadeOrigemId: string
  unidadeDestinoId: string
  quantidade: number
  justificativa?: string
  prioridade?: Prioridade
}

/** Corpo do PUT /recomendacoes/{id} — edita uma recomendação pendente. */
export interface EditarRecomendacao {
  insumoId: string
  /** Obrigatória em redistribuição; null/ausente em reposição. */
  unidadeOrigemId?: string | null
  unidadeDestinoId: string
  quantidade: number
}

export const recomendacoesApi = {
  /** GET /recomendacoes — paginado (maior economia primeiro) com filtros opcionais (rótulos pt-BR). */
  listar: (
    filtros: RecomendacaoFiltros = {},
    paginacao: ParamsPaginacao = {},
  ): Promise<Pagina<Recomendacao>> =>
    api.getPagina<Recomendacao>(
      `/recomendacoes${montarQuery({ ...filtros, ...paramsPaginacao(paginacao) })}`,
    ),

  /** GET /recomendacoes/resumo — KPIs do painel (filtros opcionais por unidade/insumo). */
  resumo: (filtros: FiltrosResumo = {}) =>
    api.get<ResumoRecomendacoes>(`/recomendacoes/resumo${montarQuery({ ...filtros })}`),

  /** POST /recomendacoes — cria uma transferência manual (Gestor; auditado). */
  criar: (body: CriarTransferencia) => api.post<Recomendacao>("/recomendacoes", body),

  /** PUT /recomendacoes/{id} — edita uma recomendação pendente (Gestor; auditado). */
  editar: (id: string, body: EditarRecomendacao) =>
    api.put<Recomendacao>(`/recomendacoes/${id}`, body),

  /** POST /recomendacoes/{id}/aprovar — aprova uma pendente (Gestor; auditado). */
  aprovar: (id: string) => api.post<Recomendacao>(`/recomendacoes/${id}/aprovar`),

  /** POST /recomendacoes/{id}/recusar — recusa (descarta) uma pendente (Gestor; auditado). */
  recusar: (id: string) => api.post<Recomendacao>(`/recomendacoes/${id}/recusar`),

  /** POST /recomendacoes/{id}/executar — marca uma aprovada como executada (Gestor; auditado). */
  executar: (id: string) => api.post<Recomendacao>(`/recomendacoes/${id}/executar`),

  /** POST /recomendacoes/gerar — regenera pelo motor de regras (Gestor). */
  gerar: () => api.post<GeracaoRecomendacoes>("/recomendacoes/gerar"),
}
