// Serviço do Painel (RF-DASH). Agregações de dashboard — somente leitura, qualquer autenticado.
import { api, montarQuery } from "./api"
import type { Alerta } from "./alertas"
import type { Recomendacao } from "./recomendacoes"
import type { PontoSerie } from "./previsoes"
import type { StatusEstoque } from "./estoque"

/** Totais consolidados da rede (RF-DASH-01). */
export interface TotaisRede {
  insumos: number
  unidades: number
  /** Apenas status ABERTO. */
  alertasAbertos: number
  /** Não resolvidos (ABERTO + EM_TRATAMENTO) — mesma métrica "ativos" da tela de alertas. */
  alertasAtivos: number
  alertasDesabastecimento: number
  alertasVencimento: number
  recomendacoesPendentes: number
  economiaPotencial: number // R$
  itensCriticos: number
  lotesProximosVencimento: number
}

/** Ponto do gráfico de cobertura por unidade (sigla, %, status derivado pelo backend). */
export interface CoberturaUnidade {
  nome: string
  valor: number
  status: StatusEstoque
}

/** Série agregada (soma da rede) do insumo mais crítico — base do gráfico do dashboard. */
export interface SerieAgregada {
  insumoId: string
  insumoCodigo: string
  insumoNome: string
  serie: PontoSerie[]
}

/** Payload do dashboard gerencial (RF-DASH-01). */
export interface PainelGerencial {
  totais: TotaisRede
  coberturaPorUnidade: CoberturaUnidade[]
  serieAgregada: SerieAgregada
  alertasRecentes: Alerta[]
  recomendacoesPendentes: Recomendacao[]
}

export type Conectividade = "Estável" | "Intermitente" | "Precária"

/** Resumo operacional de uma unidade atendida (RF-DASH-02) — status agregados vêm prontos. */
export interface ResumoUnidade {
  unidadeId: string
  sigla: string
  nome: string
  municipio: string
  conectividade: Conectividade
  itens: number
  criticos: number
  atencao: number
  alertasAtivos: number
  cobertura: number // %
  statusCobertura: StatusEstoque
  statusUnidade: StatusEstoque
}

/** Payload do painel operacional (RF-DASH-02): filas de alertas/recomendações + situação por unidade. */
export interface PainelOperacional {
  totais: TotaisRede
  unidades: ResumoUnidade[]
  alertasAtivos: Alerta[]
  recomendacoesAbertas: Recomendacao[]
}

/**
 * Filtros do dashboard gerencial — unidade e insumo reaplicam em totais, série agregada, alertas e
 * recomendações; a cobertura por unidade permanece da rede inteira (visão cross-unidade).
 */
export interface PainelGerencialFiltros {
  unidadeId?: string
  insumoId?: string
}

/** Filtros do painel operacional — unidade e insumo. */
export interface PainelOperacionalFiltros {
  unidadeId?: string
  insumoId?: string
}

export const painelApi = {
  /** GET /painel — dashboard gerencial consolidado (filtros opcionais por unidade e insumo). */
  dashboard: (filtros: PainelGerencialFiltros = {}) =>
    api.get<PainelGerencial>(`/painel${montarQuery({ ...filtros })}`),

  /** GET /painel/operacional — situação por unidade + filas (filtros por unidade/insumo). */
  operacional: (filtros: PainelOperacionalFiltros = {}) =>
    api.get<PainelOperacional>(`/painel/operacional${montarQuery({ ...filtros })}`),
}
