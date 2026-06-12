// Serviço da trilha de auditoria / LGPD (RF-SEG). Somente leitura, restrito a Gestor/TI.
// Espelha AuditoriaController: GET /seguranca/auditoria (+ /resumo).
import type { PerfilUsuario } from "@/types"
import { api, montarQuery } from "./api"

/** Conjunto fechado de categorias de ação auditada (rótulos pt-BR, espelham CategoriaAuditoria). */
export type CategoriaAuditoria =
  | "Aprovação de recomendação"
  | "Execução de recomendação"
  | "Recalibração de previsão"
  | "Geração de alertas"
  | "Alteração de limiar de alerta"
  | "Exportação de relatório"
  | "Inferência por IA"
  | "Gestão de usuário"
  | "Consulta"
  | "Autenticação"

/** Categorias na ordem exibida nos filtros. */
export const categoriasAuditoria: CategoriaAuditoria[] = [
  "Aprovação de recomendação",
  "Execução de recomendação",
  "Recalibração de previsão",
  "Geração de alertas",
  "Alteração de limiar de alerta",
  "Exportação de relatório",
  "Inferência por IA",
  "Gestão de usuário",
  "Consulta",
  "Autenticação",
]

/** Linha da trilha de auditoria (espelha LogAuditoriaResponse). */
export interface LogAuditoria {
  id: string
  data: string // ISO datetime
  usuario: string
  perfil: PerfilUsuario
  categoria: CategoriaAuditoria
  acao: string
  recurso: string
  baseLegal: string | null
  assistidoPorIA: boolean
  ip: string
}

/** KPIs do painel de auditoria (espelha ResumoAuditoriaResponse). */
export interface ResumoAuditoria {
  total: number
  assistidosPorIa: number
  comBaseLegal: number
  ultimaAtividade: string | null // ISO datetime ou null se a trilha estiver vazia
}

export interface AuditoriaFiltros {
  categoria?: CategoriaAuditoria
  perfil?: PerfilUsuario
  assistidoPorIA?: boolean
  busca?: string
}

export const auditoriaApi = {
  /** GET /seguranca/auditoria (+ filtros) — mais recentes primeiro. */
  listar: (filtros: AuditoriaFiltros = {}) =>
    api.get<LogAuditoria[]>(`/seguranca/auditoria${montarQuery({ ...filtros })}`),

  /** GET /seguranca/auditoria/resumo — KPIs do painel. */
  resumo: () => api.get<ResumoAuditoria>("/seguranca/auditoria/resumo"),
}
