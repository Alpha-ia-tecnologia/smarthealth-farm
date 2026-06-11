// Serviço de Alertas (RF-ALE). Leitura/tratamento para qualquer autenticado;
// gerar e alterar limiares são ações de Gestor (o backend barra; a UI espelha).
import type { PerfilUsuario } from "@/types"
import { api, montarQuery, paramsPaginacao, type Pagina, type ParamsPaginacao } from "./api"

export type TipoAlerta = "Desabastecimento" | "Vencimento"
export type SeveridadeAlerta = "Crítico" | "Alto" | "Médio"
export type StatusAlerta = "Aberto" | "Em tratamento" | "Resolvido"

export interface Alerta {
  id: string
  tipo: TipoAlerta
  severidade: SeveridadeAlerta
  medicamentoId: string
  medicamentoCodigo: string
  medicamentoNome: string
  unidadeId: string
  unidadeSigla: string
  unidadeNome: string
  mensagem: string
  status: StatusAlerta
  destinatarios: PerfilUsuario[]
  loteId: string | null
  numeroLote: string | null
  diasParaEvento: number
  criadoEm: string // ISO instant
}

export interface ResumoAlertas {
  abertos: number
  desabastecimento: number
  vencimento: number
  criticos: number
  emTratamento: number
  resolvidos: number
  total: number
}

export interface GeracaoAlertas {
  desabastecimentoGerados: number
  vencimentoGerados: number
  abertosRenovados: number
  totalAtivo: number
  mensagem: string
}

export interface LimiarAlerta {
  percentualEstoqueMinimo: number
  coberturaCriticaDias: number
  coberturaAltaDias: number
  antecedenciaVencimentoDias: number
  vencimentoCriticoDias: number
  vencimentoAltoDias: number
  desabastecimentoAtivo: boolean
  vencimentoAtivo: boolean
  atualizadoEm: string
}

/** Corpo do PUT /alertas/limiares (sem o atualizadoEm, que é derivado). */
export type AtualizarLimiares = Omit<LimiarAlerta, "atualizadoEm">

export interface AlertaFiltros {
  tipo?: TipoAlerta
  severidade?: SeveridadeAlerta
  status?: StatusAlerta
  unidadeId?: string
  medicamentoId?: string
  busca?: string
}

export const alertasApi = {
  /** GET /alertas — paginado, mais urgentes primeiro (+ filtros). */
  listar: (filtros: AlertaFiltros = {}, paginacao: ParamsPaginacao = {}): Promise<Pagina<Alerta>> =>
    api.getPagina<Alerta>(`/alertas${montarQuery({ ...filtros, ...paramsPaginacao(paginacao) })}`),

  /** GET /alertas/resumo — KPIs do painel. */
  resumo: () => api.get<ResumoAlertas>("/alertas/resumo"),

  /** PATCH /alertas/{id}/status — tratamento (Aberto → Em tratamento → Resolvido). */
  atualizarStatus: (id: string, status: StatusAlerta) =>
    api.patch<Alerta>(`/alertas/${id}/status`, { status }),

  /** POST /alertas/gerar — regenera pelo motor de regras (Gestor). */
  gerar: () => api.post<GeracaoAlertas>("/alertas/gerar"),

  /** GET /alertas/limiares — configuração vigente (RF-ALE-03). */
  limiares: () => api.get<LimiarAlerta>("/alertas/limiares"),

  /** PUT /alertas/limiares — atualiza os limiares (Gestor; auditado). */
  salvarLimiares: (limiares: AtualizarLimiares) =>
    api.put<LimiarAlerta>("/alertas/limiares", limiares),
}
