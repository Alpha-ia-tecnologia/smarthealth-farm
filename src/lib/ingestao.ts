// Serviço de Ingestão e qualidade de dados (RF-DAD). Governança da base — somente leitura.
import { api } from "./api"
import type { FamiliaTerapeutica } from "@/types"

/** Situação de sincronização de uma fonte (espelha o enum StatusFonte do backend). */
export type StatusFonte = "Sincronizado" | "Atrasado" | "Erro"

/** Granularidade temporal da base por família (espelha o enum GranularidadeDado do backend). */
export type GranularidadeDado = "Diária" | "Semanal" | "Mensal"

/** Fonte de dados com status, volume, qualidade e procedência (RF-DAD-02/07). */
export interface FonteDado {
  id: string
  codigo: string
  nome: string
  geracao: string
  status: StatusFonte
  ultimaIngestao: string // ISO
  registros: number
  qualidade: number // 0-100
  procedencia: string
}

/** Cartão de maturidade/qualidade por família terapêutica (RF-DAD-04). */
export interface QualidadeFamilia {
  id: string
  familia: FamiliaTerapeutica
  maturidade: number // 0-100
  completude: number // 0-100
  consistencia: number // 0-100
  granularidade: GranularidadeDado
  lacunas: number
}

/** KPIs do painel de ingestão (RF-DAD-01/02/03/04) — calculados pelo backend. */
export interface ResumoIngestao {
  registrosIngeridos: number
  totalFontes: number
  fontesSincronizadas: number
  qualidadeMedia: number // 0-100
  anonimizacaoAtiva: boolean
}

export const ingestaoApi = {
  /** GET /ingestao/fontes — fontes com status, volume, qualidade e procedência. */
  fontes: () => api.get<FonteDado[]>("/ingestao/fontes"),

  /** GET /ingestao/qualidade — maturidade/qualidade por família terapêutica. */
  qualidade: () => api.get<QualidadeFamilia[]>("/ingestao/qualidade"),

  /** GET /ingestao/resumo — KPIs (registros, fontes sincronizadas, qualidade média, LGPD). */
  resumo: () => api.get<ResumoIngestao>("/ingestao/resumo"),
}
