import {
  CalendarDays,
  CheckCircle2,
  GitCompareArrows,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { TrendChart } from "@/components/charts/TrendChart"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useIndicadores, useResumoIndicadores } from "@/hooks/use-indicadores"
import type { Indicador } from "@/lib/indicadores"
import { fmtDec, fmtNum } from "@/lib/format"

export default function IndicadoresPage() {
  const resumoQuery = useResumoIndicadores()
  const indicadoresQuery = useIndicadores()

  const indicadores = indicadoresQuery.data ?? []
  const comparativo = indicadores.filter((i) => i.variacaoPct != null)

  return (
    <>
      <PageHeader
        icon={<Target className="size-5" />}
        title="Indicadores e Monitoramento de Desempenho"
        info="Esta tela acompanha, semana a semana, se o projeto está alcançando as metas combinadas. Compara como funcionava antes (sistema atual) com o resultado usando o Smart Health, para mostrar o ganho real."
        description="Medição contínua dos resultados frente às metas do edital, com coleta semanal e comparação direta com o sistema atual durante o piloto."
      />

      {/* Resumo (RF-IND-04/05) — KPIs do /indicadores/resumo */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar o resumo dos indicadores."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Indicadores monitorados" value={resumoQuery.data ? fmtNum(resumoQuery.data.total) : ""} carregando={resumoQuery.isPending} icon={Target} accent="primary" info="Quantas metas de desempenho o projeto está acompanhando no total. É a soma de todos os indicadores medidos nesta tela." />
          <KpiCard label="Metas atingidas" value={resumoQuery.data ? fmtNum(resumoQuery.data.atingidas) : ""} carregando={resumoQuery.isPending} icon={CheckCircle2} accent="success" info="Quantos indicadores já alcançaram o resultado combinado. Quanto maior este número, melhor: significa mais metas cumpridas." />
          <KpiCard label="Em progresso" value={resumoQuery.data ? fmtNum(resumoQuery.data.emProgresso) : ""} carregando={resumoQuery.isPending} icon={TimerReset} accent="warning" info="Quantos indicadores ainda não bateram a meta e seguem evoluindo. Tende a diminuir conforme as metas vão sendo atingidas." />
        </div>
      )}

      {indicadoresQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores."
          onTentarNovamente={() => indicadoresQuery.refetch()}
        />
      ) : !indicadoresQuery.data ? (
        <div className="flex justify-center py-20">
          <Spinner size={40} label="Carregando indicadores" />
        </div>
      ) : indicadores.length === 0 ? (
        <Section title="Indicadores do projeto" info="Lista as metas de desempenho que o projeto se comprometeu a alcançar, como reduzir falta de remédios e perdas por vencimento.">
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum indicador monitorado.</p>
        </Section>
      ) : (
        <AreaAtualizavel atualizando={indicadoresQuery.isFetching}>
          <div className="grid gap-5 lg:grid-cols-2">
            {indicadores.map((i) => (
              <CartaoIndicador key={i.id} ind={i} />
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            {/* Comparação piloto × atual (RF-IND-06) — baseline × atual × variação reais */}
            <Section
              className="lg:col-span-3"
              title="Operação em paralelo — piloto × sistema atual"
              info="Coloca lado a lado o resultado do jeito antigo (sistema atual) e o do Smart Health para o mesmo período. A variação mostra, em porcentagem, o quanto melhorou."
              description="Comparação direta de indicadores entre as duas operações durante o piloto."
              icon={<GitCompareArrows className="size-4" />}
              noPadding
            >
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
                      const variacao = c.variacaoPct ?? 0
                      const melhora = c.melhorMenor ? variacao < 0 : variacao > 0
                      return (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="px-5 py-3 font-medium">{c.nome} <span className="text-xs text-muted-foreground">({c.unidade})</span></td>
                          <td className="px-3 py-3 text-right tabular text-muted-foreground">{fmtDec(c.baseline)}</td>
                          <td className="px-3 py-3 text-right tabular font-semibold">{fmtDec(c.atual)}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`tabular font-semibold ${melhora ? "text-success" : "text-muted-foreground"}`}>{variacao}%</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Coleta semanal (RF-IND-05) — cadência ilustrativa (sem endpoint dedicado) */}
            <Section
              className="lg:col-span-2 h-fit"
              title="Coleta e consolidação"
              info="Mostra com que frequência os dados são coletados e revisados pela equipe. Garante que os números fiquem sempre atualizados e confiáveis."
              description="Cadência de revisão em comitê de acompanhamento."
              icon={<CalendarDays className="size-4" />}
              action={
                <Badge variant="outline" className="border-warning/40 bg-warning/10 text-[10px] text-warning">
                  Dados ilustrativos
                </Badge>
              }
            >
              {/* NOTA: cadência de coleta é ilustrativa (mock) — não há endpoint que a sirva. */}
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
        </AreaAtualizavel>
      )}
    </>
  )
}

/** Cartão de um indicador: valor atual, base, meta, série histórica e progresso (tudo do backend). */
function CartaoIndicador({ ind }: { ind: Indicador }) {
  const cor = ind.atingiu ? "var(--chart-4)" : "var(--chart-3)"
  return (
    <Section
      title={ind.nome}
      info={`${ind.melhorMenor ? "Aqui, quanto menor o valor, melhor" : "Aqui, quanto maior o valor, melhor"}. O número grande é o resultado atual; "base" é como estava antes de começar; e "meta" é o alvo a alcançar. A barra mostra o quanto do caminho até a meta já foi percorrido.`}
      action={
        <StatusBadge
          status={ind.atingiu ? "ok" : "atencao"}
          label={ind.atingiu ? "Meta atingida" : "Em progresso"}
          dot={false}
        />
      }
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="tabular font-display text-3xl font-bold" style={{ color: cor }}>
            {fmtDec(ind.atual)}<span className="ml-1 text-base text-muted-foreground">{ind.unidade}</span>
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-0.5">
              {ind.melhorMenor ? <TrendingDown className="size-3 text-success" /> : <TrendingUp className="size-3 text-success" />}
              base {fmtDec(ind.baseline)}{ind.unidade}
            </span>
            {ind.metaReducaoPct > 0 && <Badge variant="outline" className="text-[10px]">meta −{ind.metaReducaoPct}%</Badge>}
          </p>
        </div>
        <div className="w-1/2">
          <TrendChart data={ind.historico} color={cor} meta={ind.meta} height={90} label={ind.nome} />
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>progresso até a meta</span>
          <span className="tabular">{ind.progresso}%</span>
        </div>
        <Progress value={Math.min(100, ind.progresso)} className={`mt-1 h-1.5 ${ind.atingiu ? "[&>div]:bg-success" : "[&>div]:bg-warning"}`} />
      </div>
    </Section>
  )
}
