// Serviço de Recomendações (RF-REC). Leitura para qualquer autenticado;
// aprovar, executar e gerar são ações de Gestor (o backend barra; a UI espelha).
import { api, montarQuery, paramsPaginacao, type Pagina, type ParamsPaginacao } from "./api"

export type TipoRecomendacao = "Reposição" | "Redistribuição"
export type StatusRecomendacao = "Pendente" | "Aprovada" | "Executada"
export type OrigemMotor = "Regras" | "Aprendizado de Máquina"
export type Prioridade = "Essencial" | "Importante" | "Desejável"

/** Cartão de recomendação (RF-REC-01/02/03/04) — tudo denormalizado pelo backend. */
export interface Recomendacao {
  id: string
  tipo: TipoRecomendacao
  medicamentoId: string
  medicamentoCodigo: string
  medicamentoNome: string
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
  medicamentoId?: string
  busca?: string
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

  /** GET /recomendacoes/resumo — KPIs do painel. */
  resumo: () => api.get<ResumoRecomendacoes>("/recomendacoes/resumo"),

  /** POST /recomendacoes/{id}/aprovar — aprova uma pendente (Gestor; auditado). */
  aprovar: (id: string) => api.post<Recomendacao>(`/recomendacoes/${id}/aprovar`),

  /** POST /recomendacoes/{id}/executar — marca uma aprovada como executada (Gestor; auditado). */
  executar: (id: string) => api.post<Recomendacao>(`/recomendacoes/${id}/executar`),

  /** POST /recomendacoes/gerar — regenera pelo motor de regras (Gestor). */
  gerar: () => api.post<GeracaoRecomendacoes>("/recomendacoes/gerar"),
}
