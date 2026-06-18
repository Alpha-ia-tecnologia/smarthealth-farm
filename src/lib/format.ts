// Formatação pt-BR

const nf = new Intl.NumberFormat("pt-BR")
const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const cf = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
const cf2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtNum = (n: number) => nf.format(n)
export const fmtDec = (n: number) => nf1.format(n)
export const fmtPct = (n: number, dec = 1) =>
  `${n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })}%`
export const fmtMoeda = (n: number) => cf.format(n)
/** Moeda com centavos (R$ 0,00) — para valores exatos como notas fiscais. */
export const fmtMoedaExata = (n: number) => cf2.format(n)

const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function fmtData(iso: string): string {
  const [datePart] = iso.split("T")
  const [y, m, d] = datePart.split("-").map(Number)
  return `${String(d).padStart(2, "0")} ${meses[m - 1]} ${y}`
}

// Datas-hora vêm do backend como Instant em UTC (ISO com "Z"). Exibimos no fuso de Brasília
// (America/Sao_Paulo) — converter aqui evita mostrar a hora em UTC (3h adiantada).
const dtfDataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export function fmtDataHora(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  // pt-BR devolve "dd/mm/aaaa, HH:MM"; removemos a vírgula para "dd/mm/aaaa HH:MM".
  return dtfDataHora.format(data).replace(",", "")
}

export const fmtMilhar = (n: number) =>
  n >= 1_000_000 ? `${fmtDec(n / 1_000_000)}M` : n >= 1000 ? `${fmtDec(n / 1000)}k` : fmtNum(n)

const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

/** Período "AAAA-MM" → rótulo curto "Mmm/AA" (ex.: "2026-06" → "Jun/26"). */
export function fmtPeriodoMes(periodo: string): string {
  const [ano, mes] = periodo.split("-").map(Number)
  const rotulo = mesesAbrev[mes - 1]
  return rotulo ? `${rotulo}/${String(ano).slice(-2)}` : periodo
}
