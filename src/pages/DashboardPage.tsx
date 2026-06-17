import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarClock,
  Coins,
  LayoutDashboard,
  PackageX,
  Target,
  TrendingDown,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { BarraFiltros, FiltroUnidade } from "@/components/shared/filtros"
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
  const [unidadeId, setUnidadeId] = useState<string | undefined>(undefined)
  const painelQuery = usePainelGerencial({ unidadeId })
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
        info="Visão geral do desempenho da rede: previsão de demanda, situação dos estoques e os principais indicadores comparados às metas do projeto. Use os atalhos de cada bloco para abrir o módulo em detalhe."
        description="Visão consolidada da cadeia farmacêutica da CAHOSP e das unidades da rede EMSERH — previsão, estoque e indicadores frente às metas do projeto."
        actions={
          <Button variant="outline" asChild>
            <Link to="/relatorios">
              Relatório executivo <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <BarraFiltros>
        <FiltroUnidade valor={unidadeId} onChange={setUnidadeId} />
      </BarraFiltros>

      {/* KPIs — sem filtro: indicadores do edital (rede). Com unidade: operacionais da unidade. */}
      {unidadeId ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Itens críticos" value={painel ? fmtNum(painel.totais.itensCriticos) : ""} carregando={painelQuery.isPending} icon={PackageX} accent="danger" info="Insumos com estoque abaixo do nível seguro nesta unidade — risco de faltar." />
          <KpiCard label="Alertas ativos" value={painel ? fmtNum(painel.totais.alertasAtivos) : ""} carregando={painelQuery.isPending} icon={BellRing} accent="danger" hint="abertos + em tratamento" info="Avisos de risco ainda não resolvidos nesta unidade (abertos somados aos em tratamento)." />
          <KpiCard label="Risco de vencimento" value={painel ? fmtNum(painel.totais.alertasVencimento) : ""} carregando={painelQuery.isPending} icon={CalendarClock} accent="warning" info="Insumos com lotes perto da validade nesta unidade, que precisam de uso ou remanejamento." />
          <KpiCard label="Economia potencial" value={painel ? fmtMoeda(painel.totais.economiaPotencial) : ""} carregando={painelQuery.isPending} icon={Coins} accent="success" info="Quanto a unidade pode economizar seguindo as recomendações em aberto (compra programada sai mais barata que a de urgência)." />
        </div>
      ) : indicadoresQuery.isError ? (
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
            info="Percentual de itens que ficaram em falta quando eram necessários. Quanto menor, melhor — a meta é reduzir esse número em relação à linha de base (situação antes do projeto)."
          />
          <KpiCard
            label="Perdas por vencimento"
            value={vencimento ? fmtPct(vencimento.atual) : ""}
            carregando={indicadoresQuery.isPending}
            icon={CalendarClock}
            accent="warning"
            delta={vencimento ? deltaIndicador(vencimento) : undefined}
            hint={vencimento ? `meta −${vencimento.metaReducaoPct}% · base ${fmtPct(vencimento.baseline)}` : undefined}
            info="Percentual de insumos descartados por terem vencido antes de serem usados. Comprar e distribuir na medida certa reduz esse desperdício."
          />
          <KpiCard
            label="Compras emergenciais"
            value={emergencial ? formatarValorIndicador(emergencial.unidade, emergencial.atual) : ""}
            carregando={indicadoresQuery.isPending}
            icon={TrendingDown}
            accent="teal"
            delta={emergencial ? deltaIndicador(emergencial) : undefined}
            hint={emergencial ? `meta −${emergencial.metaReducaoPct}% · base ${formatarValorIndicador(emergencial.unidade, emergencial.baseline)}` : undefined}
            info="Volume de compras feitas com urgência, fora do planejamento. Costumam sair mais caras (frete e preço); a meta é reduzi-las com previsão e reposição programada."
          />
          <KpiCard
            label="Assertividade da previsão (MAPE)"
            value={mape ? fmtPct(mape.atual) : ""}
            carregando={indicadoresQuery.isPending}
            icon={Target}
            accent="success"
            delta={mape ? deltaIndicador(mape) : undefined}
            hint={mape ? `alvo < ${fmtPct(mape.meta)}` : undefined}
            info="MAPE é o erro médio da previsão de demanda: o quanto, em média, ela erra para mais ou para menos. Quanto menor o erro, mais confiável é a previsão (alvo abaixo da meta)."
          />
        </div>
      )}

      {/* Previsão agregada + acurácia */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          className="lg:col-span-2"
          title={painel ? `Demanda × Previsão — ${painel.serieAgregada.insumoNome} (rede)` : "Demanda × Previsão (rede)"}
          description="Comparativo entre consumo realizado e previsto, com projeção de 3 meses."
          info="Compara o consumo já realizado (histórico) com o previsto pelo modelo e projeta os próximos meses, ajudando a antecipar quanto será necessário."
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

        <Section title="Assertividade das previsões" info="Mostra o quanto as previsões têm acertado nos itens mais críticos. O ponteiro indica a assertividade média (100% menos o erro); ao lado, os desabastecimentos que foram evitados." description="Erro médio (MAPE) ponderado dos itens de maior criticidade.">
          {indicadoresQuery.isError ? (
            <ErroConsulta mensagem="Não foi possível carregar os indicadores." onTentarNovamente={() => indicadoresQuery.refetch()} />
          ) : !mape ? (
            <div className="flex justify-center py-20"><Spinner size={40} label="Carregando" /></div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Gauge value={Math.round((100 - mape.atual) * 10) / 10} label="Assertividade média" suffix="%" color="var(--chart-4)" />
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
          info="Para cada unidade, o percentual de itens com estoque acima do nível de segurança. Quanto maior a cobertura, menor o risco de faltar item."
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
          info="Avisos automáticos de risco na rede — itens em vias de faltar (desabastecimento) ou perto de vencer. A cor indica a gravidade."
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
          info="Sugestões de compra ou de troca de estoque entre unidades aguardando aprovação. A economia potencial aparece porque comprar de forma programada sai mais barato: compras de urgência pagam frete e preços maiores. Planejar a reposição com antecedência reduz esse custo extra."
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
                  <div className="mt-1.5 text-sm font-medium">{r.insumoNome}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.justificativa}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="size-3.5" />
        Indicadores acompanham as metas do edital FAPEMA GovIA.
      </p>
    </>
  )
}
