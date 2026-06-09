import { CalendarDays, GitCompareArrows, Target, TrendingDown, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { TrendChart } from "@/components/charts/TrendChart"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { indicadores } from "@/data"
import type { IndicadorMeta } from "@/types"
import { fmtDec } from "@/lib/format"
import { AiInsight } from "@/components/shared/AiInsight"
import { insightIndicador } from "@/lib/insights"

function progresso(i: IndicadorMeta) {
  // % do caminho percorrido entre baseline e meta
  if (i.baseline === i.meta) return 100
  const p = ((i.baseline - i.atual) / (i.baseline - i.meta)) * 100
  return Math.max(0, Math.min(140, Math.round(p)))
}

function atingiu(i: IndicadorMeta) {
  return i.melhorMenor ? i.atual <= i.meta : i.atual >= i.meta
}

export default function IndicadoresPage() {
  const comparativo = [
    { ind: "Taxa de desabastecimento (%)", atual: 18.4, smart: 11.2 },
    { ind: "Perdas vencimento (%)", atual: 6.1, smart: 4.3 },
    { ind: "Compras emerg. (R$ mil)", atual: 1240, smart: 812 },
    { ind: "Ressuprimento (dias)", atual: 19.5, smart: 13.7 },
  ]

  return (
    <>
      <PageHeader
        icon={<Target className="size-5" />}
        title="Indicadores e Monitoramento de Desempenho"
        rf="RF-IND"
        description="Medição contínua dos resultados frente às metas do edital, com coleta semanal e comparação direta com o sistema atual durante o piloto."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {indicadores.map((i) => {
          const prog = progresso(i)
          const ok = atingiu(i)
          const cor = ok ? "var(--chart-4)" : "var(--chart-3)"
          return (
            <Section
              key={i.id}
              title={i.nome}
              rf={
                i.id === "ind-ruptura" ? "RF-IND-01"
                : i.id === "ind-vencimento" ? "RF-IND-02"
                : i.id === "ind-emergencial" ? "RF-IND-03"
                : "RF-IND-04"
              }
              action={<StatusBadge status={ok ? "ok" : "atencao"} label={ok ? "Meta atingida" : "Em progresso"} dot={false} />}
            >
              <div className="flex items-end justify-between">
                <div>
                  <p className="tabular font-display text-3xl font-bold" style={{ color: cor }}>
                    {fmtDec(i.atual)}<span className="ml-1 text-base text-muted-foreground">{i.unidade}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      {i.melhorMenor ? <TrendingDown className="size-3 text-success" /> : <TrendingUp className="size-3 text-success" />}
                      base {fmtDec(i.baseline)}{i.unidade}
                    </span>
                    {i.metaReducaoPct > 0 && <Badge variant="outline" className="text-[10px]">meta −{i.metaReducaoPct}%</Badge>}
                  </p>
                </div>
                <div className="w-1/2">
                  <TrendChart data={i.historico} color={cor} meta={i.meta} height={90} label={i.nome} />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>progresso até a meta</span>
                  <span className="tabular">{prog}%</span>
                </div>
                <Progress value={Math.min(100, prog)} className={`mt-1 h-1.5 ${ok ? "[&>div]:bg-success" : "[&>div]:bg-warning"}`} />
              </div>
              <AiInsight className="mt-3" {...insightIndicador(i)} />
            </Section>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Comparação piloto x atual (RF-IND-06) */}
        <Section className="lg:col-span-3" title="Operação em paralelo — piloto × sistema atual" rf="RF-IND-06" description="Comparação direta de indicadores entre as duas operações durante o piloto." icon={<GitCompareArrows className="size-4" />} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-semibold">Indicador</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Sistema atual</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Smart Health</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Variação</th>
                </tr>
              </thead>
              <tbody>
                {comparativo.map((c) => {
                  const delta = Math.round(((c.smart - c.atual) / c.atual) * 100)
                  return (
                    <tr key={c.ind} className="border-b last:border-0">
                      <td className="px-5 py-3 font-medium">{c.ind}</td>
                      <td className="px-3 py-3 text-right tabular text-muted-foreground">{fmtDec(c.atual)}</td>
                      <td className="px-3 py-3 text-right tabular font-semibold">{fmtDec(c.smart)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="tabular font-semibold text-success">{delta}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Coleta semanal (RF-IND-05) */}
        <Section className="lg:col-span-2 h-fit" title="Coleta e consolidação" rf="RF-IND-05" description="Cadência de revisão em comitê de acompanhamento." icon={<CalendarDays className="size-4" />}>
          <div className="space-y-3">
            {[
              { l: "Coleta semanal", d: "Segundas-feiras, 08h", st: "ok" as const },
              { l: "Consolidação quinzenal", d: "Comitê de acompanhamento", st: "ok" as const },
              { l: "Próxima revisão", d: "16/06/2026", st: "info" as const },
              { l: "Última consolidação", d: "02/06/2026 · 6 indicadores", st: "ok" as const },
            ].map((x) => (
              <div key={x.l} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{x.l}</p>
                  <p className="text-xs text-muted-foreground">{x.d}</p>
                </div>
                <StatusBadge status={x.st} dot />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  )
}
