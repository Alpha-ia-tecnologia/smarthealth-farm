// Serviço de Estoque, Lotes e Movimentações (RF-EST). Leitura para qualquer autenticado.
// Os tipos espelham os DTOs do backend (respostas já denormalizadas e com status derivado).
import { api, montarQuery } from "./api"

/** Token de status da posição (idêntico ao StatusEstoque do backend e ao StatusBadge). */
export type StatusEstoque = "ok" | "atencao" | "critico"

/** Tipo de movimentação (rótulo pt-BR, idêntico ao TipoMovimentacao do backend). */
export type TipoMovimentacao = "Entrada" | "Saída" | "Transferência" | "Ajuste"

export interface PosicaoEstoque {
  id: string
  medicamentoId: string
  medicamentoCodigo: string
  medicamentoNome: string
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
  medicamentoId: string
  medicamentoNome: string
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
  medicamentoId: string
  medicamentoNome: string
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

export interface PosicaoFiltros {
  unidadeId?: string
  medicamentoId?: string
  status?: StatusEstoque
  busca?: string
}

export interface LoteFiltros {
  unidadeId?: string
  medicamentoId?: string
  comSaldo?: boolean
  validadeAteDias?: number
}

export const estoqueApi = {
  /** GET /estoque — posições com status (+ filtros). */
  listarPosicoes: (filtros: PosicaoFiltros = {}) =>
    api.get<PosicaoEstoque[]>(`/estoque${montarQuery({ ...filtros })}`),

  /** GET /estoque/resumo — KPIs da tela. */
  resumo: () => api.get<ResumoEstoque>("/estoque/resumo"),

  /** GET /estoque/{medicamentoId}/{unidadeId} — drill-down: lotes + movimentações. */
  detalhar: (medicamentoId: string, unidadeId: string) =>
    api.get<PosicaoEstoqueDetalhe>(`/estoque/${medicamentoId}/${unidadeId}`),

  /** GET /lotes — lotes com dias para vencer (+ filtros). */
  listarLotes: (filtros: LoteFiltros = {}) =>
    api.get<Lote[]>(`/lotes${montarQuery({ ...filtros })}`),
}
