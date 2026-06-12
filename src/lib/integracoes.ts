// Serviço de Integração com os sistemas da EMSERH (RF-INT). Saúde das conexões e AI Gateway —
// somente leitura.
import { api } from "./api"

/** Situação de uma integração externa (espelha o enum StatusIntegracao do backend). */
export type StatusIntegracao = "Operacional" | "Degradada" | "Indisponível"

/** Modo de operação para unidades de borda (espelha o enum ModoIntegracao do backend). */
export type ModoIntegracao = "Online" | "Offline (buffer)" | "Reconciliando"

/** Papel de um provedor de IA no AI Gateway (espelha o enum PapelIa do backend). */
export type PapelIa = "Primário" | "Fallback" | "Standby"

/** Conexão/API versionada da EMSERH com situação, latência, modo e buffer offline (RF-INT-01/02/04/05). */
export interface IntegracaoApi {
  id: string
  codigo: string
  nome: string
  versao: string
  status: StatusIntegracao
  latenciaMs: number
  ultimaSync: string // ISO
  modo: ModoIntegracao
  registrosBuffer: number
}

/** Provedor de IA do AI Gateway com papel, custo, volume e anonimização (RF-INT-06 / RF-SEG-04). */
export interface ProvedorIa {
  id: string
  codigo: string
  nome: string
  ativo: boolean
  papel: PapelIa
  custoPor1kTokens: number
  chamadasMes: number
  anonimizacao: boolean
}

/** KPIs do painel de integração (RF-INT-01/02/05/06) — calculados pelo backend. */
export interface ResumoIntegracao {
  operacionais: number
  totalIntegracoes: number
  latenciaMediaMs: number
  registrosBuffer: number
  provedoresIa: number
}

export const integracoesApi = {
  /** GET /integracoes — conexões com status, latência, modo e buffer offline. */
  listar: () => api.get<IntegracaoApi[]>("/integracoes"),

  /** GET /integracoes/resumo — KPIs (operacionais, latência média, buffer, provedores). */
  resumo: () => api.get<ResumoIntegracao>("/integracoes/resumo"),

  /** GET /integracoes/provedores-ia — provedores do AI Gateway (papel, custo, anonimização). */
  provedoresIa: () => api.get<ProvedorIa[]>("/integracoes/provedores-ia"),
}
