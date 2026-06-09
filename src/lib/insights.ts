// Geração de "insights da IA" a partir dos dados reais (mock).
// Produz texto em linguagem natural + tom para auxiliar a leitura dos gráficos.

import type { IndicadorMeta, PontoSerie } from "@/types"
import { fmtDec, fmtNum } from "@/lib/format"

export type InsightTone = "info" | "positivo" | "alerta"
export interface Insight {
  text: string
  tone: InsightTone
}

const f = (v: number) => (Math.abs(v) >= 100 ? fmtNum(Math.round(v)) : fmtDec(v))

/** Comparativo Realizado × Previsto + projeção. */
export function insightPrevisao(
  serie: PontoSerie[],
  nome: string,
  opts: { mape?: number; drift?: string } = {},
): Insight {
  const reais = serie.filter((p) => p.realizado != null).map((p) => p.realizado as number)
  const prevs = serie.filter((p) => p.realizado == null).map((p) => p.previsto as number)
  const ultReal = reais[reais.length - 1] ?? 0
  const fimPrev = prevs[prevs.length - 1] ?? ultReal
  const delta = ultReal ? Math.round(((fimPrev - ultReal) / ultReal) * 100) : 0
  const caiu = delta <= -3
  const subiu = delta >= 3

  let text =
    `Para ${nome}, a previsão aponta ` +
    (caiu ? `queda de ${Math.abs(delta)}%` : subiu ? `alta de ${delta}%` : "estabilidade") +
    ` no próximo trimestre (${fmtNum(ultReal)} → ${fmtNum(fimPrev)} un/mês)`
  text += caiu
    ? ", acompanhando o recuo sazonal do período seco. Reduza a reposição e avalie redistribuir excedentes próximos do vencimento."
    : subiu
    ? ", puxada pela sazonalidade epidemiológica. Antecipe a reposição para evitar desabastecimento."
    : ", mantendo o patamar atual. Conserve o plano de reposição vigente."

  let tone: InsightTone = subiu ? "alerta" : "info"
  if (opts.mape != null) {
    text += ` Erro do modelo: ${fmtDec(opts.mape)}%${opts.mape < 15 ? " (dentro da meta)" : " (acima da meta de 15%)"}.`
    if (opts.mape >= 15) tone = "alerta"
  }
  if (opts.drift === "Degradado") {
    text += " Modelo com desvio detectado — recomenda-se recalibração."
    tone = "alerta"
  }
  return { text, tone }
}

/** Cobertura de estoque por unidade. */
export function insightCobertura(
  data: { nome: string; valor: number; status: string }[],
): Insight {
  const total = data.length
  const ok = data.filter((d) => d.status === "ok").length
  const crit = data.filter((d) => d.status === "critico").length
  const pior = [...data].sort((a, b) => a.valor - b.valor)[0]

  let text = `${ok} de ${total} unidades atingiram a meta de cobertura (≥ 80%). ${pior.nome} registra a menor cobertura (${pior.valor}%)`
  text += crit > 0
    ? ", em nível crítico — priorize reposição imediata."
    : " — candidata a redistribuição preventiva."
  if (crit === 0) text += " Nenhuma unidade em nível crítico no momento."

  const tone: InsightTone = crit > 0 ? "alerta" : ok >= Math.ceil(total / 2) ? "positivo" : "info"
  return { text, tone }
}

/** Indicador vs. linha de base / meta. */
export function insightIndicador(ind: IndicadorMeta): Insight {
  const red = ind.baseline ? Math.round(((ind.baseline - ind.atual) / ind.baseline) * 100) : 0

  if (ind.id === "ind-mape") {
    const met = ind.atual <= ind.meta
    return {
      text: `Erro médio das previsões em ${fmtDec(ind.atual)}% — ${met ? "abaixo" : "acima"} do alvo de ${fmtDec(ind.meta)}%. ${met ? "Previsões confiáveis para dimensionar a reposição." : "Recomenda-se recalibrar os modelos de maior criticidade."}`,
      tone: met ? "positivo" : "alerta",
    }
  }
  if (ind.id === "ind-rupturas-evitadas") {
    return {
      text: `${fmtNum(ind.atual)} desabastecimentos evitados no acumulado — resultado direto da antecipação preditiva, acima da expectativa de ${fmtNum(ind.meta)}.`,
      tone: "positivo",
    }
  }
  if (ind.id === "ind-ressuprimento") {
    return {
      text: `Ressuprimento ${red}% mais rápido que a linha de base (${fmtDec(ind.atual)} dias vs ${fmtDec(ind.baseline)}). Menor janela de exposição a desabastecimento.`,
      tone: ind.atual <= ind.meta ? "positivo" : "info",
    }
  }
  // Metas de redução (desabastecimento, vencimento, compras emergenciais)
  const met = red >= ind.metaReducaoPct
  return {
    text: `Queda de ${red}% frente à linha de base (${f(ind.baseline)} → ${f(ind.atual)} ${ind.unidade}). Meta de −${ind.metaReducaoPct}% ${met ? "superada." : "ainda não atingida — manter o ritmo de melhoria."}`,
    tone: met ? "positivo" : "info",
  }
}
