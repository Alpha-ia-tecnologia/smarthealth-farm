import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  LayoutDashboard,
  PackageX,
  Target,
  TrendingDown,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { MedLabel, UniLabel } from "@/components/shared/MedLabel"
import { ForecastChart } from "@/components/charts/ForecastChart"
import { Gauge } from "@/components/charts/extras"
import { CoverageChart } from "@/components/charts/CoverageChart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  alertas,
  getIndicador,
  indicadores,
  recomendacoes,
  serieAgregada,
  totais,
  unidadesAtendidas,
  resumoUnidade,
} from "@/data"
import { fmtMoeda, fmtNum, fmtPct } from "@/lib/format"
import { severidadeStatus } from "@/lib/status"
import { AiInsight } from "@/components/shared/AiInsight"
import { insightCobertura, insightIndicador, insightPrevisao } from "@/lib/insights"

export default function DashboardPage() {
  const ruptura = getIndicador("ind-ruptura")!
  const vencimento = getIndicador("ind-vencimento")!
  const emergencial = getIndicador("ind-emergencial")!
  const mape = getIndicador("ind-mape")!

  const reducao = (i: typeof ruptura) =>
    Math.round(((i.baseline - i.atual) / i.baseline) * 100)

  const alertasRecentes = alertas.filter((a) => a.status !== "Resolvido").slice(0, 6)
  const recsPendentes = recomendacoes.filter((r) => r.status === "Pendente").slice(0, 4)

  const cobertura = unidadesAtendidas
    .map((u) => ({ u, r: resumoUnidade(u.id) }))
    .map(({ u, r }) => ({
      nome: u.sigla,
      valor: r.cobertura,
      status: r.cobertura < 60 ? "critico" : r.cobertura < 80 ? "atencao" : "ok",
    }))

  return (
    <>
      <PageHeader
        icon={<LayoutDashboard className="size-5" />}
        title="Dashboard Gerencial"
        rf="RF-DASH-01"
        description="Visão consolidada da cadeia farmacêutica da CAHOSP e das unidades da rede EMSERH — previsão, estoque e indicadores frente às metas do projeto."
        actions={
          <Button variant="outline" asChild>
            <Link to="/relatorios">
              Relatório executivo <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {/* KPIs principais (RF-IND-01..04) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Taxa de desabastecimento"
          value={fmtPct(ruptura.atual)}
          icon={PackageX}
          accent="danger"
          delta={{ value: `${reducao(ruptura)}%`, positivo: true }}
          hint={`meta −${ruptura.metaReducaoPct}% · base ${fmtPct(ruptura.baseline)}`}
          rf="RF-IND-01"
        />
        <KpiCard
          label="Perdas por vencimento"
          value={fmtPct(vencimento.atual)}
          icon={CalendarClock}
          accent="warning"
          delta={{ value: `${reducao(vencimento)}%`, positivo: true }}
          hint={`meta −${vencimento.metaReducaoPct}% · base ${fmtPct(vencimento.baseline)}`}
          rf="RF-IND-02"
        />
        <KpiCard
          label="Compras emergenciais"
          value={fmtMoeda(emergencial.atual * 1000)}
          icon={TrendingDown}
          accent="teal"
          delta={{ value: `${reducao(emergencial)}%`, positivo: true }}
          hint={`meta −${emergencial.metaReducaoPct}% · base ${fmtMoeda(emergencial.baseline * 1000)}`}
          rf="RF-IND-03"
        />
        <KpiCard
          label="Assertividade da previsão (MAPE)"
          value={fmtPct(mape.atual)}
          icon={Target}
          accent="success"
          delta={{ value: `${reducao(mape)}%`, positivo: true }}
          hint={`alvo < ${fmtPct(mape.meta)}`}
          rf="RF-IND-04"
        />
      </div>

      {/* Previsão agregada + acurácia */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          className="lg:col-span-2"
          title="Demanda × Previsão — Ceftriaxona 1g (rede)"
          description="Comparativo entre consumo realizado e previsto, com projeção de 3 meses."
          rf="RF-PRV-02"
          action={<Badge variant="outline" className="text-[10px]">Modelo preditivo híbrido</Badge>}
        >
          <ForecastChart serie={serieAgregada("m-002")} />
          <AiInsight className="mt-4" {...insightPrevisao(serieAgregada("m-002"), "Ceftriaxona 1g")} />
        </Section>

        <Section title="Assertividade das previsões" rf="RF-PRV-05" description="Erro médio (MAPE) ponderado dos itens de maior criticidade.">
          <div className="flex flex-col items-center gap-4">
            <Gauge value={100 - mape.atual} label="Assertividade média" suffix="%" color="var(--chart-4)" />
            <div className="grid w-full grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="tabular font-display text-xl font-bold">{fmtPct(mape.atual)}</p>
                <p className="text-[11px] text-muted-foreground">erro médio (MAPE)</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="tabular font-display text-xl font-bold text-success">{fmtNum(147)}</p>
                <p className="text-[11px] text-muted-foreground">desabastecimentos evitados</p>
              </div>
            </div>
            <AiInsight className="w-full" {...insightIndicador(mape)} />
          </div>
        </Section>
      </div>

      {/* Cobertura por unidade + alertas + recomendações */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Cobertura de estoque por unidade"
          rf="RF-DASH-01"
          description="% de itens com estoque acima do nível de segurança, por unidade."
        >
          <CoverageChart data={cobertura} />
          <AiInsight className="mt-4" {...insightCobertura(cobertura)} />
        </Section>

        <Section
          title="Alertas recentes"
          rf="RF-ALE-01"
          description={`${totais.alertasAbertos} alertas abertos na rede`}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/alertas">Ver todos</Link>
            </Button>
          }
          noPadding
        >
          <ul className="divide-y">
            {alertasRecentes.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${a.tipo === "Desabastecimento" ? "bg-danger/12 text-danger" : "bg-warning/12 text-warning"}`}>
                  {a.tipo === "Desabastecimento" ? <PackageX className="size-4" /> : <CalendarClock className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{a.tipo}</p>
                    <StatusBadge status={severidadeStatus[a.severidade]} label={a.severidade} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    <UniLabel id={a.unidadeId} /> · {a.mensagem}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Recomendações pendentes"
          rf="RF-REC-01"
          description={`Economia potencial ${fmtMoeda(totais.economiaPotencial)}`}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/recomendacoes">Ver todas</Link>
            </Button>
          }
          noPadding
        >
          <ul className="divide-y">
            {recsPendentes.map((r) => (
              <li key={r.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={r.tipo === "Redistribuição" ? "secondary" : "outline"} className="text-[10px]">
                    {r.tipo}
                  </Badge>
                  <span className="tabular text-xs font-semibold text-success">{fmtMoeda(r.economiaEstimada)}</span>
                </div>
                <div className="mt-1.5 text-sm">
                  <MedLabel id={r.medicamentoId} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.justificativa}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="size-3.5" />
        Dados fictícios para demonstração. Indicadores acompanham as metas do edital FAPEMA GovIA (RF-IND).
      </p>
    </>
  )
}
