import { ForecastChart } from "@/components/charts/ForecastChart"
import { CoverageChart } from "@/components/charts/CoverageChart"
import { Gauge } from "@/components/charts/extras"
import { GraficoInsightDialog } from "@/components/shared/GraficoInsightDialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { MensagemChat } from "@/lib/ia"
import type { CoberturaUnidade, PainelGerencial } from "@/lib/painel"
import type { PontoSerie } from "@/lib/previsoes"
import type { Indicador } from "@/lib/indicadores"
import { fmtNum, fmtPct, fmtPeriodoMes } from "@/lib/format"

/** Identifica qual gráfico do dashboard está com o modal aberto. */
export type GraficoDashboard = "previsao" | "assertividade" | "cobertura"

interface Props {
  grafico: GraficoDashboard | null
  onOpenChange: (aberto: boolean) => void
  painel: PainelGerencial | undefined
  mape: Indicador | undefined
  evitados: Indicador | undefined
}

/**
 * Os três modais de detalhe + análise por IA dos gráficos do dashboard: Demanda × Previsão,
 * Assertividade (MAPE) e Cobertura por unidade. Cada um abre quando `grafico` é o seu id.
 */
export function DashboardGraficosDialogs({ grafico, onOpenChange, painel, mape, evitados }: Props) {
  return (
    <>
      <GraficoInsightDialog
        aberto={grafico === "previsao"}
        onOpenChange={onOpenChange}
        chave={painel ? `previsao:${painel.serieAgregada.insumoCodigo}` : null}
        titulo={painel ? `Demanda × Previsão — ${painel.serieAgregada.insumoNome} (rede)` : "Demanda × Previsão"}
        descricao="Consumo realizado × previsto, com projeção. Números mês a mês."
        mensagens={painel ? msgsPrevisao(painel) : []}
      >
        {painel && (
          <>
            <ForecastChart serie={painel.serieAgregada.serie} height={280} />
            <TabelaSerie serie={painel.serieAgregada.serie} />
          </>
        )}
      </GraficoInsightDialog>

      <GraficoInsightDialog
        aberto={grafico === "assertividade"}
        onOpenChange={onOpenChange}
        chave={mape ? "assertividade" : null}
        titulo="Assertividade das previsões"
        descricao="Erro médio (MAPE) ponderado dos itens de maior criticidade."
        mensagens={mape ? msgsAssertividade(mape, evitados) : []}
      >
        {mape && <DetalheAssertividade mape={mape} evitados={evitados} />}
      </GraficoInsightDialog>

      <GraficoInsightDialog
        aberto={grafico === "cobertura"}
        onOpenChange={onOpenChange}
        chave={painel ? "cobertura" : null}
        titulo="Cobertura de estoque por unidade"
        descricao="% de itens com estoque acima do nível de segurança, por unidade."
        mensagens={painel ? msgsCobertura(painel) : []}
      >
        {painel && (
          <>
            <CoverageChart data={painel.coberturaPorUnidade} />
            <TabelaCobertura dados={painel.coberturaPorUnidade} />
          </>
        )}
      </GraficoInsightDialog>
    </>
  )
}

const ROTULO_STATUS: Record<CoberturaUnidade["status"], string> = {
  ok: "Adequado",
  atencao: "Atenção",
  critico: "Crítico",
}

/** Tabela mês a mês da série de demanda × previsão. */
function TabelaSerie({ serie }: { serie: PontoSerie[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 text-left font-semibold">Mês</th>
            <th className="px-3 py-2 text-right font-semibold">Realizado</th>
            <th className="px-3 py-2 text-right font-semibold">Previsto</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((p) => (
            <tr key={p.periodo} className="border-b last:border-0">
              <td className="px-3 py-2">{fmtPeriodoMes(p.periodo)}</td>
              <td className="px-3 py-2 text-right tabular">{p.realizado == null ? "—" : fmtNum(p.realizado)}</td>
              <td className="px-3 py-2 text-right tabular text-muted-foreground">
                {p.previsto == null ? "—" : fmtNum(p.previsto)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Tabela de cobertura por unidade, com a situação (adequado/atenção/crítico). */
function TabelaCobertura({ dados }: { dados: CoberturaUnidade[] }) {
  const rows = [...dados].sort((a, b) => b.valor - a.valor)
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 text-left font-semibold">Unidade</th>
            <th className="px-3 py-2 text-right font-semibold">Cobertura</th>
            <th className="px-3 py-2 text-right font-semibold">Situação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.nome} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium">{u.nome}</td>
              <td className="px-3 py-2 text-right tabular font-semibold">{u.valor}%</td>
              <td className="px-3 py-2 text-right">
                <StatusBadge status={u.status} label={ROTULO_STATUS[u.status]} dot={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Medidor de assertividade (100 − MAPE) + números de apoio. */
function DetalheAssertividade({ mape, evitados }: { mape: Indicador; evitados: Indicador | undefined }) {
  const assertividade = Math.round((100 - mape.atual) * 10) / 10
  return (
    <div className="flex flex-col items-center gap-4">
      <Gauge value={assertividade} label="Assertividade média" suffix="%" color="var(--chart-4)" height={180} />
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile valor={fmtPct(mape.atual)} rotulo="erro médio (MAPE)" />
        <StatTile valor={fmtPct(assertividade)} rotulo="assertividade média" />
        <StatTile valor={`< ${fmtPct(mape.meta)}`} rotulo="meta de MAPE" />
        {evitados && <StatTile valor={fmtNum(evitados.atual)} rotulo="desabastecimentos evitados" />}
      </div>
    </div>
  )
}

function StatTile({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="tabular font-display text-xl font-bold">{valor}</p>
      <p className="text-[11px] text-muted-foreground">{rotulo}</p>
    </div>
  )
}

const SISTEMA: MensagemChat = {
  papel: "system",
  conteudo:
    "Você é um analista da plataforma Smart Health CAHOSP, de gestão preditiva da cadeia " +
    "farmacêutica hospitalar (EMSERH-MA). Analise os dados do gráfico e responda em português do " +
    "Brasil, de forma objetiva e executiva (3 a 4 frases), sem inventar dados além dos fornecidos.",
}

function msgsPrevisao(painel: PainelGerencial): MensagemChat[] {
  const linhas = painel.serieAgregada.serie
    .map(
      (p) =>
        `${fmtPeriodoMes(p.periodo)}: realizado ${p.realizado == null ? "—" : fmtNum(p.realizado)}, ` +
        `previsto ${p.previsto == null ? "—" : fmtNum(p.previsto)}`,
    )
    .join("\n")
  return [
    SISTEMA,
    {
      papel: "user",
      conteudo:
        `Analise a série de demanda (consumo realizado) versus previsão do insumo ` +
        `"${painel.serieAgregada.insumoNome}" na rede. Aponte: (1) a tendência recente, ` +
        `(2) a aderência da previsão ao realizado, (3) o que a projeção sugere e uma recomendação.\n\n` +
        linhas,
    },
  ]
}

function msgsAssertividade(mape: Indicador, evitados: Indicador | undefined): MensagemChat[] {
  const assertividade = Math.round((100 - mape.atual) * 10) / 10
  return [
    SISTEMA,
    {
      papel: "user",
      conteudo:
        `Analise a assertividade das previsões de demanda da rede hospitalar. Aponte: ` +
        `(1) o que o erro indica, (2) se está bom frente à meta, (3) uma recomendação.\n\n` +
        `Erro médio (MAPE) atual: ${fmtPct(mape.atual)}\n` +
        `Assertividade média: ${fmtPct(assertividade)}\n` +
        `Meta de MAPE: abaixo de ${fmtPct(mape.meta)}\n` +
        `${evitados ? `Desabastecimentos evitados (acumulado): ${fmtNum(evitados.atual)}\n` : ""}`,
    },
  ]
}

function msgsCobertura(painel: PainelGerencial): MensagemChat[] {
  const linhas = painel.coberturaPorUnidade
    .map((u) => `${u.nome}: ${u.valor}% (${ROTULO_STATUS[u.status]})`)
    .join("\n")
  return [
    SISTEMA,
    {
      papel: "user",
      conteudo:
        `Analise a cobertura de estoque por unidade da rede (meta de 80%). Aponte: ` +
        `(1) as unidades em risco, (2) o panorama geral, (3) uma recomendação de ` +
        `redistribuição ou reposição.\n\n${linhas}`,
    },
  ]
}
