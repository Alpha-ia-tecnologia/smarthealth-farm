// Formatação pt-BR

const nf = new Intl.NumberFormat("pt-BR")
const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const cf = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

export const fmtNum = (n: number) => nf.format(n)
export const fmtDec = (n: number) => nf1.format(n)
export const fmtPct = (n: number, dec = 1) =>
  `${n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })}%`
export const fmtMoeda = (n: number) => cf.format(n)

const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function fmtData(iso: string): string {
  const [datePart] = iso.split("T")
  const [y, m, d] = datePart.split("-").map(Number)
  return `${String(d).padStart(2, "0")} ${meses[m - 1]} ${y}`
}

export function fmtDataHora(iso: string): string {
  const [datePart, timePart = "00:00:00"] = iso.split("T")
  const [y, m, d] = datePart.split("-").map(Number)
  const [hh, mm] = timePart.split(":")
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y} ${hh}:${mm}`
}

export const fmtMilhar = (n: number) =>
  n >= 1_000_000 ? `${fmtDec(n / 1_000_000)}M` : n >= 1000 ? `${fmtDec(n / 1000)}k` : fmtNum(n)
