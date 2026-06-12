import { useMemo } from "react"
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
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { ForecastChart } from "@/components/charts/ForecastChart"
import { Gauge } from "@/components/charts/extras"
import { CoverageChart } from "@/components/charts/CoverageChart"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePainelGerencial } from "@/hooks/use-painel"
import { useIndicadores } from "@/hooks/use-indicadores"
import { formatarValorIndicador, type Indicador } from "@/lib/indicadores"
import { fmtMoeda, fmtNum, fmtPct } from "@/lib/format"
import { severidadeStatus } from "@/lib/status"

/** Delta do KPI a partir da variação entregue pela API (sinal interpretado pela direção da meta). */
function deltaIndicador(ind: Indicador) {
  const variacao = ind.variacaoPct ?? 0
  const positivo = ind.melhorMenor ? variacao <= 0 : variacao >= 0
  return { value: `${Math.abs(variacao)}%`, positivo }
}

export default function DashboardPage() {
  const painelQuery = usePainelGerencial()
  const indicadoresQuery = useIndicadores()

  const indPorCodigo = useMemo(
    () => new Map((indicadoresQuery.data ?? []).map((i) => [i.codigo, i])),
    [indicadoresQuery.data],
  )
  const ruptura = indPorCodigo.get("ind-ruptura")
  const vencimento = indPorCodigo.get("ind-vencimento")
  const emergencial = indPorCodigo.get("ind-emergencial")
  const mape = indPorCodigo.get("ind-mape")
  const evitados = indPorCodigo.get("ind-rupturas-evitadas")

  const painel = painelQuery.data

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

      {/* KPIs principais (RF-IND-01..04) — vindos de /indicadores */}
      {indicadoresQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores do projeto."
          onTentarNovamente={() => indicadoresQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Taxa de desabastecimento"
            value={ruptura ? fmtPct(ruptura.atual) : ""}
            carregando={indicadoresQuery.isPending}
            icon={PackageX}
            accent="danger"
            delta={ruptura ? deltaIndicador(ruptura) : undefined}
            hint={ruptura ? `meta −${ruptura.metaReducaoPct}% · base ${fmtPct(ruptura.baseline)}` : undefined}
            rf="RF-IND-01"
          />
          <KpiCard
            label="Perdas por vencimento"
            value={vencimento ? fmtPct(vencimento.atual) : ""}
            carregando={indicadoresQuery.isPending}
            icon={CalendarClock}
            accent="warning"
            delta={vencimento ? deltaIndicador(vencimento) : undefined}
            hint={vencimento ? `meta −${vencimento.metaReducaoPct}% · base ${fmtPct(vencimento.baseline)}` : undefined}
            rf="RF-IND-02"
          />
          <KpiCard
            label="Compras emergenciais"
            value={emergencial ? formatarValorIndicador(emergencial.unidade, emergencial.atual) : ""}
            carregando={indicadoresQuery.isPending}
            icon={TrendingDown}
            accent="teal"
            delta={emergencial ? deltaIndicador(emergencial) : undefined}
            hint={emergencial ? `meta −${emergencial.metaReducaoPct}% · base ${formatarValorIndicador(emergencial.unidade, emergencial.baseline)}` : undefined}
            rf="RF-IND-03"
          />
          <KpiCard
            label="Assertividade da previsão (MAPE)"
            value={mape ? fmtPct(mape.atual) : ""}
            carregando={indicadoresQuery.isPending}
            icon={Target}
            accent="success"
            delta={mape ? deltaIndicador(mape) : undefined}
            hint={mape ? `alvo < ${fmtPct(mape.meta)}` : undefined}
            rf="RF-IND-04"
          />
        </div>
      )}

      {/* Previsão agregada + acurácia */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          className="lg:col-span-2"
          title={painel ? `Demanda × Previsão — ${painel.serieAgregada.medicamentoNome} (rede)` : "Demanda × Previsão (rede)"}
          description="Comparativo entre consumo realizado e previsto, com projeção de 3 meses."
          rf="RF-PRV-02"
          action={<Badge variant="outline" className="text-[10px]">Modelo preditivo híbrido</Badge>}
        >
          {painelQuery.isError ? (
            <ErroConsulta mensagem="Não foi possível carregar a série." onTentarNovamente={() => painelQuery.refetch()} />
          ) : !painel ? (
            <div className="flex justify-center py-20"><Spinner size={40} label="Carregando série" /></div>
          ) : (
            <ForecastChart serie={painel.serieAgregada.serie} />
          )}
        </Section>

        <Section title="Assertividade das previsões" rf="RF-PRV-05" description="Erro médio (MAPE) ponderado dos itens de maior criticidade.">
          {indicadoresQuery.isError ? (
            <ErroConsulta mensagem="Não foi possível carregar os indicadores." onTentarNovamente={() => indicadoresQuery.refetch()} />
          ) : !mape ? (
            <div className="flex justify-center py-20"><Spinner size={40} label="Carregando" /></div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Gauge value={Math.round(100 - mape.atual)} label="Assertividade média" suffix="%" color="var(--chart-4)" />
              <div className="grid w-full grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="tabular font-display text-xl font-bold">{fmtPct(mape.atual)}</p>
                  <p className="text-[11px] text-muted-foreground">erro médio (MAPE)</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="tabular font-display text-xl font-bold text-success">{evitados ? fmtNum(evitados.atual) : "—"}</p>
                  <p className="text-[11px] text-muted-foreground">desabastecimentos evitados</p>
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Cobertura por unidade + alertas + recomendações */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Cobertura de estoque por unidade"
          rf="RF-DASH-01"
          description="% de itens com estoque acima do nível de segurança, por unidade."
        >
          {painelQuery.isError ? (
            <ErroConsulta mensagem="Não foi possível carregar a cobertura." onTentarNovamente={() => painelQuery.refetch()} />
          ) : !painel ? (
            <div className="flex justify-center py-16"><Spinner size={40} label="Carregando cobertura" /></div>
          ) : (
            <CoverageChart data={painel.coberturaPorUnidade} />
          )}
        </Section>

        <Section
          title="Alertas recentes"
          rf="RF-ALE-01"
          description={painel ? `${fmtNum(painel.totais.alertasAtivos)} alertas ativos na rede` : "Alertas ativos na rede"}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/alertas">Ver todos</Link>
            </Button>
          }
          noPadding
        >
          {painelQuery.isError ? (
            <div className="p-5"><ErroConsulta mensagem="Não foi possível carregar os alertas." onTentarNovamente={() => painelQuery.refetch()} /></div>
          ) : !painel ? (
            <div className="flex justify-center py-16"><Spinner size={40} label="Carregando alertas" /></div>
          ) : painel.alertasRecentes.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum alerta ativo na rede.</p>
          ) : (
            <ul className="divide-y">
              {painel.alertasRecentes.map((a) => (
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
                      {a.unidadeSigla} · {a.mensagem}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Recomendações pendentes"
          rf="RF-REC-01"
          description={painel ? `Economia potencial ${fmtMoeda(painel.totais.economiaPotencial)}` : "Economia potencial da rede"}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/recomendacoes">Ver todas</Link>
            </Button>
          }
          noPadding
        >
          {painelQuery.isError ? (
            <div className="p-5"><ErroConsulta mensagem="Não foi possível carregar as recomendações." onTentarNovamente={() => painelQuery.refetch()} /></div>
          ) : !painel ? (
            <div className="flex justify-center py-16"><Spinner size={40} label="Carregando recomendações" /></div>
          ) : painel.recomendacoesPendentes.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma recomendação pendente.</p>
          ) : (
            <ul className="divide-y">
              {painel.recomendacoesPendentes.map((r) => (
                <li key={r.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={r.tipo === "Redistribuição" ? "secondary" : "outline"} className="text-[10px]">
                      {r.tipo}
                    </Badge>
                    <span className="tabular text-xs font-semibold text-success">{fmtMoeda(r.economiaEstimada)}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium">{r.medicamentoNome}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.justificativa}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="size-3.5" />
        Indicadores acompanham as metas do edital FAPEMA GovIA (RF-IND).
      </p>
    </>
  )
}
