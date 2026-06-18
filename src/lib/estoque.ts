// Serviço de Estoque, Lotes e Movimentações (RF-EST). Leitura para qualquer autenticado.
// Os tipos espelham os DTOs do backend (respostas já denormalizadas e com status derivado).
import { api, montarQuery, paramsPaginacao, type FiltrosResumo, type Pagina, type ParamsPaginacao } from "./api"

export type { ParamsPaginacao } from "./api"

/** Token de status da posição (idêntico ao StatusEstoque do backend e ao StatusBadge). */
export type StatusEstoque = "ok" | "atencao" | "critico"

/** Tipo de movimentação (rótulo pt-BR, idêntico ao TipoMovimentacao do backend). */
export type TipoMovimentacao = "Entrada" | "Saída" | "Transferência" | "Ajuste"

export interface PosicaoEstoque {
  id: string
  insumoId: string
  insumoCodigo: string
  insumoNome: string
  unidadeId: string
  unidadeSigla: string
  unidadeNome: string
  quantidade: number
  nivelCritico: number
  estoqueMaximo: number
  consumoMedioDiario: number
  tempoMedioRessuprimentoDias: number
  status: StatusEstoque
}

export interface Lote {
  id: string
  insumoId: string
  insumoNome: string
  unidadeId: string
  unidadeSigla: string
  numeroLote: string
  validade: string // ISO date (yyyy-MM-dd)
  diasParaVencer: number
  quantidade: number
  fabricante: string
}

export interface Movimentacao {
  id: string
  loteId: string
  numeroLote: string
  insumoId: string
  insumoNome: string
  unidadeId: string
  unidadeSigla: string
  tipo: TipoMovimentacao
  quantidade: number
  dataHora: string // ISO instant
  responsavel: string
  documento: string
}

export interface ResumoEstoque {
  itensCriticos: number
  lotesProximosVencimento: number
  tempoMedioRessuprimentoDias: number
  totalUnidadesEstoque: number
}

export interface PosicaoEstoqueDetalhe {
  posicao: PosicaoEstoque
  lotes: Lote[]
  movimentacoes: Movimentacao[]
}

/** Classe da Curva ABC: A (itens vitais ~80% do valor), B (~15%), C (cauda ~5%). */
export type ClasseAbc = "A" | "B" | "C"

/** Item da Curva ABC (RF-EST): valor de consumo, participação/acumulado (%) e a classe. */
export interface CurvaAbcItem {
  insumoId: string
  insumoCodigo: string
  insumoNome: string
  consumoMedioDiario: number
  custoUnitario: number
  valorConsumo: number // R$ (consumo médio diário × custo unitário)
  participacaoPct: number
  acumuladoPct: number
  classe: ClasseAbc
}

/** Consolidado de uma classe da Curva ABC: nº de itens, valor e os percentuais. */
export interface ResumoClasseAbc {
  classe: ClasseAbc
  itens: number
  valor: number
  itensPct: number
  valorPct: number
}

/** Resposta da Curva ABC: itens ordenados (para o Pareto) + resumo por classe. */
export interface CurvaAbc {
  itens: CurvaAbcItem[]
  resumo: ResumoClasseAbc[]
}

export interface PosicaoFiltros {
  unidadeId?: string
  insumoId?: string
  status?: StatusEstoque
  busca?: string
}

export interface LoteFiltros {
  unidadeId?: string
  insumoId?: string
  comSaldo?: boolean
  validadeAteDias?: number
}

export const estoqueApi = {
  /** GET /estoque — posições paginadas com status (+ filtros). */
  listarPosicoes: (
    filtros: PosicaoFiltros = {},
    paginacao: ParamsPaginacao = {},
  ): Promise<Pagina<PosicaoEstoque>> =>
    api.getPagina<PosicaoEstoque>(`/estoque${montarQuery({ ...filtros, ...paramsPaginacao(paginacao) })}`),

  /** GET /estoque/resumo — KPIs da tela (filtros opcionais por unidade/insumo). */
  resumo: (filtros: FiltrosResumo = {}) =>
    api.get<ResumoEstoque>(`/estoque/resumo${montarQuery({ ...filtros })}`),

  /** GET /estoque/curva-abc — Curva ABC dos insumos por valor de consumo (rede). */
  curvaAbc: () => api.get<CurvaAbc>("/estoque/curva-abc"),

  /** GET /estoque/{insumoId}/{unidadeId} — drill-down: lotes + movimentações. */
  detalhar: (insumoId: string, unidadeId: string) =>
    api.get<PosicaoEstoqueDetalhe>(`/estoque/${insumoId}/${unidadeId}`),

  /** GET /lotes — lotes paginados com dias para vencer (+ filtros). */
  listarLotes: (
    filtros: LoteFiltros = {},
    paginacao: ParamsPaginacao = {},
  ): Promise<Pagina<Lote>> =>
    api.getPagina<Lote>(`/lotes${montarQuery({ ...filtros, ...paramsPaginacao(paginacao) })}`),
}
