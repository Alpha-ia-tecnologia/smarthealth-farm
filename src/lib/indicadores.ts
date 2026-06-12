// Serviço de Indicadores do projeto (RF-IND). Metas vs. linha de base — somente leitura.
import { api } from "./api"
import { fmtMoeda, fmtNum, fmtPct } from "./format"

/** Ponto da série histórica de um indicador (RF-IND-05). */
export interface PontoHistorico {
  periodo: string // "AAAA-MM"
  valor: number
}

/** Indicador de desempenho (RF-IND-01..06) — derivações (progresso/atingiu/variação) vêm prontas. */
export interface Indicador {
  id: string
  codigo: string // código de negócio (ex.: "ind-ruptura")
  nome: string
  unidade: string // "%", "R$ mil", "dias", "un"
  baseline: number
  atual: number
  meta: number
  metaReducaoPct: number
  melhorMenor: boolean
  progresso: number // % do caminho até a meta
  atingiu: boolean
  variacaoPct: number | null // variação atual × base (null se base = 0)
  historico: PontoHistorico[]
}

/** KPIs do painel de indicadores (RF-IND-04/05). */
export interface ResumoIndicadores {
  total: number
  atingidas: number
  emProgresso: number
}

export const indicadoresApi = {
  /** GET /indicadores — lista com histórico, progresso, meta atingida e variação. */
  listar: () => api.get<Indicador[]>("/indicadores"),

  /** GET /indicadores/resumo — KPIs (total, metas atingidas, em progresso). */
  resumo: () => api.get<ResumoIndicadores>("/indicadores/resumo"),

  /** GET /indicadores/{codigo} — detalhe pelo código de negócio. */
  detalhar: (codigo: string) => api.get<Indicador>(`/indicadores/${codigo}`),
}

/** Formata um valor na unidade de medida do indicador (% · R$ mil · dias · un). */
export function formatarValorIndicador(unidade: string, valor: number): string {
  switch (unidade) {
    case "%":
      return fmtPct(valor)
    case "R$ mil":
      return fmtMoeda(valor * 1000)
    case "dias":
      return `${fmtNum(valor)} dias`
    default:
      return fmtNum(valor)
  }
}
