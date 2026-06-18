import { useState } from "react"
import { Link } from "react-router-dom"
import { Activity, ArrowLeftRight, BellRing, MapPin, PackageX, CalendarClock } from "lucide-react"
import { BotaoAnaliseIa } from "@/components/shared/BotaoAnaliseIa"
import { GraficoInsightDialog } from "@/components/shared/GraficoInsightDialog"
import { PageHeader } from "@/components/shared/PageHeader"
import { PaginaIaInsight } from "@/components/shared/PaginaIaInsight"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { KpiCard } from "@/components/shared/KpiCard"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { BarraFiltros, FiltroInsumo, FiltroUnidade, SelectFiltro } from "@/components/shared/filtros"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { usePainelOperacional } from "@/hooks/use-painel"
import { useRecomendacoes } from "@/hooks/use-recomendacoes"
import type { StatusRecomendacao } from "@/lib/recomendacoes"
import type { PainelOperacional } from "@/lib/painel"
import { conectividadeStatus, recomendacaoStatus, severidadeStatus } from "@/lib/status"
import { mensagensAnalise } from "@/lib/ia-prompts"
import { fmtMoeda, fmtNum } from "@/lib/format"

/** Corpo do resumo operacional por IA: totais da rede + unidades em atenção/crítico. */
function corpoOperacional(data: PainelOperacional): string {
  const criticas = data.unidades.filter((u) => u.statusUnidade !== "ok").slice(0, 6)
  const lista = criticas
    .map(
      (u) =>
        `- ${u.sigla} (${u.municipio}): cobertura ${u.cobertura}%, ${u.criticos} críticos, ` +
        `${u.alertasAtivos} alertas, conectividade ${u.conectividade}`,
    )
    .join("\n")
  return (
    `Faça um resumo operacional da rede para o gestor de plantão. Aponte: (1) unidades que exigem ` +
    `ação imediata, (2) os principais riscos (desabastecimento/vencimento), (3) próximas ações.\n\n` +
    `Totais: ${data.totais.alertasAtivos} alertas ativos, ${data.totais.alertasDesabastecimento} de ` +
    `desabastecimento, ${data.totais.alertasVencimento} de vencimento, ` +
    `${data.totais.recomendacoesPendentes} recomendações pendentes.\n\n` +
    `Unidades em atenção/crítico:\n${lista || "nenhuma"}`
  )
}

function corpoAlertasAtivos(data: PainelOperacional): string {
  const { alertasDesabastecimento: desab, alertasVencimento: venc, alertasAtivos: total } = data.totais
  const criticos = data.alertasAtivos.filter((a) => a.severidade === "Crítico").length
  const altos = data.alertasAtivos.filter((a) => a.severidade === "Alto").length
  const unidades = [...new Set(data.alertasAtivos.map((a) => a.unidadeSigla))].join(", ")
  return (
    `Analise o total de alertas ativos e oriente o gestor de plantão sobre a situação da rede.\n\n` +
    `Total: ${total} alertas ativos — ${desab} de desabastecimento, ${venc} de vencimento.\n` +
    `Severidade na fila: ${criticos} críticos, ${altos} altos.\n` +
    `Unidades com alertas: ${unidades || "nenhuma na fila atual"}.`
  )
}

function corpoRiscoDesabastecimento(data: PainelOperacional): string {
  const alertas = data.alertasAtivos.filter((a) => a.tipo === "Desabastecimento")
  const criticos = alertas.filter((a) => a.severidade === "Crítico").length
  const linhas = alertas
    .slice(0, 8)
    .map((a) => `- ${a.unidadeSigla}: ${a.insumoNome} (${a.severidade}, ${a.diasParaEvento}d) — ${a.mensagem}`)
    .join("\n")
  return (
    `Analise o risco de desabastecimento e indique as prioridades de ação.\n\n` +
    `Total em risco: ${data.totais.alertasDesabastecimento} itens — ${criticos} críticos.\n\n` +
    `Alertas:\n${linhas || "Nenhum alerta de desabastecimento na fila atual."}`
  )
}

function corpoRiscoVencimento(data: PainelOperacional): string {
  const alertas = data.alertasAtivos.filter((a) => a.tipo === "Vencimento")
  const criticos = alertas.filter((a) => a.severidade === "Crítico").length
  const linhas = alertas
    .slice(0, 8)
    .map((a) => `- ${a.unidadeSigla}: ${a.insumoNome} (${a.severidade}, ${a.diasParaEvento}d) — ${a.mensagem}`)
    .join("\n")
  return (
    `Analise o risco de vencimento e sugira ações como redistribuição ou uso acelerado.\n\n` +
    `Total em risco: ${data.totais.alertasVencimento} itens — ${criticos} críticos.\n\n` +
    `Alertas:\n${linhas || "Nenhum alerta de vencimento na fila atual."}`
  )
}

function corpoRecomendacoesPendentes(data: PainelOperacional): string {
  const pendentes = data.recomendacoesAbertas.filter((r) => r.status === "Pendente")
  const reposicoes = pendentes.filter((r) => r.tipo === "Reposição").length
  const redistribuicoes = pendentes.filter((r) => r.tipo === "Redistribuição").length
  const economiaPotencial = pendentes.reduce((acc, r) => acc + r.economiaEstimada, 0)
  const linhas = pendentes
    .slice(0, 6)
    .map(
      (r) =>
        `- ${r.tipo}: ${r.insumoNome} → ${r.unidadeDestinoSigla}` +
        (r.unidadeOrigemSigla ? ` (de ${r.unidadeOrigemSigla})` : "") +
        `, ${fmtNum(r.quantidade)} un, prioridade ${r.prioridade}: ${r.justificativa}`,
    )
    .join("\n")
  return (
    `Analise as recomendações pendentes e oriente quais aprovar com prioridade.\n\n` +
    `Total pendente: ${data.totais.recomendacoesPendentes} — ${reposicoes} reposições, ${redistribuicoes} redistribuições.\n` +
    `Economia potencial: ${fmtMoeda(economiaPotencial)}.\n\n` +
    `Recomendações:\n${linhas || "Nenhuma recomendação pendente."}`
  )
}

function corpoSituacaoUnidades(data: PainelOperacional): string {
  const linhas = data.unidades
    .map(
      (u) =>
        `- ${u.sigla} (${u.municipio}): cobertura ${u.cobertura}%, ${u.criticos} críticos, ` +
        `${u.alertasAtivos} alertas, conectividade ${u.conectividade}, status ${u.statusUnidade}`,
    )
    .join("\n")
  return (
    `Analise a situação de cada unidade e indique quais precisam de atenção imediata e por quê.\n\n` +
    `Unidades da rede (${data.unidades.length}):\n${linhas || "Nenhuma unidade registrada."}`
  )
}

function corpoFilaAlertas(data: PainelOperacional): string {
  const linhas = data.alertasAtivos
    .slice(0, 10)
    .map(
      (a) =>
        `- [${a.severidade}] ${a.tipo}: ${a.insumoNome} em ${a.unidadeSigla} ` +
        `(${a.diasParaEvento}d) — ${a.mensagem}`,
    )
    .join("\n")
  return (
    `Analise a fila de alertas e sugira uma ordem de ação para o gestor de plantão.\n\n` +
    `Total: ${data.totais.alertasAtivos} alertas ativos ` +
    `(${data.totais.alertasDesabastecimento} desabastecimento, ${data.totais.alertasVencimento} vencimento).\n\n` +
    `Fila atual:\n${linhas || "Nenhum alerta ativo."}`
  )
}

function corpoRecomendacoesAbertas(data: PainelOperacional): string {
  const linhas = data.recomendacoesAbertas
    .slice(0, 8)
    .map(
      (r) =>
        `- [${r.status}] ${r.tipo}: ${r.insumoNome} → ${r.unidadeDestinoSigla}` +
        (r.unidadeOrigemSigla ? ` (de ${r.unidadeOrigemSigla})` : "") +
        `, ${fmtNum(r.quantidade)} un, prioridade ${r.prioridade}: ${r.justificativa}`,
    )
    .join("\n")
  return (
    `Analise as recomendações em aberto e sugira quais priorizar e o motivo.\n\n` +
    `Total pendente: ${data.totais.recomendacoesPendentes}.\n\n` +
    `Recomendações:\n${linhas || "Nenhuma recomendação em aberto."}`
  )
}

/** Opções do filtro isolado de status na seção "Recomendações em aberto". */
const STATUS_REC_OPCOES = [
  { valor: "Pendente", rotulo: "Pendente" },
  { valor: "Aprovada", rotulo: "Aprovada" },
  { valor: "Recusada", rotulo: "Recusada" },
  { valor: "Executada", rotulo: "Executada" },
]

export default function OperacionalPage() {
  const [unidadeId, setUnidadeId] = useState<string | undefined>(undefined)
  const [insumoId, setInsumoId] = useState<string | undefined>(undefined)
  const [statusRec, setStatusRec] = useState<string | undefined>(undefined)
  const [dialogOp, setDialogOp] = useState<string | null>(null)

  const { data, isPending, isError, isFetching, refetch } = usePainelOperacional({
    unidadeId,
    insumoId,
  })
  // Seção "Recomendações em aberto": consome /recomendacoes (suporta filtro de status),
  // herdando unidade/insumo da barra de filtros + o status isolado da própria seção.
  const recsQuery = useRecomendacoes(
    { status: statusRec as StatusRecomendacao | undefined, unidadeId, insumoId },
    { tamanho: 6 },
  )
  const recomendacoes = recsQuery.data?.itens ?? []

  if (isError) {
    return (
      <>
        <Cabecalho />
        <ErroConsulta
          mensagem="Não foi possível carregar o painel operacional."
          onTentarNovamente={() => refetch()}
        />
      </>
    )
  }

  return (
    <>
      <Cabecalho
        actions={
          data ? (
            <PaginaIaInsight
              rotulo="Operacional"
              titulo="Resumo operacional por IA"
              descricao="Panorama da rede com as unidades que exigem ação e os próximos passos."
              mensagens={mensagensAnalise(corpoOperacional(data))}
            />
          ) : undefined
        }
      />

      <BarraFiltros>
        <FiltroUnidade valor={unidadeId} onChange={setUnidadeId} />
        <FiltroInsumo valor={insumoId} onChange={setInsumoId} unidadeId={unidadeId} />
      </BarraFiltros>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Alertas ativos"
          value={data ? fmtNum(data.totais.alertasAtivos) : ""}
          carregando={isPending}
          icon={BellRing}
          accent="danger"
          hint="abertos + em tratamento"
          info="Quantos avisos importantes precisam de atenção agora, somando os que ainda não foram tratados e os que já estão em andamento. Quanto menor, mais sob controle está a operação."
          action={data ? <BotaoAnaliseIa rotulo="Alertas ativos" onClick={() => setDialogOp("alertas")} /> : undefined}
        />
        <KpiCard
          label="Risco de desabastecimento"
          value={data ? fmtNum(data.totais.alertasDesabastecimento) : ""}
          carregando={isPending}
          icon={PackageX}
          accent="danger"
          info="Número de insumos que correm risco de acabar antes da próxima reposição. São casos que exigem ação rápida para não faltar remédio aos pacientes."
          action={data ? <BotaoAnaliseIa rotulo="Risco de desabastecimento" onClick={() => setDialogOp("desabastecimento")} /> : undefined}
        />
        <KpiCard
          label="Risco de vencimento"
          value={data ? fmtNum(data.totais.alertasVencimento) : ""}
          carregando={isPending}
          icon={CalendarClock}
          accent="warning"
          info="Número de insumos com data de validade se aproximando que talvez não sejam usados a tempo. Ajuda a evitar desperício, antecipando o uso ou a transferência desses itens."
          action={data ? <BotaoAnaliseIa rotulo="Risco de vencimento" onClick={() => setDialogOp("vencimento")} /> : undefined}
        />
        <KpiCard
          label="Recomendações pendentes"
          value={data ? fmtNum(data.totais.recomendacoesPendentes) : ""}
          carregando={isPending}
          icon={ArrowLeftRight}
          accent="teal"
          info="Sugestões do sistema para repor ou remanejar estoque entre unidades que ainda aguardam uma decisão. Avaliá-las mantém o abastecimento equilibrado na rede."
          action={data ? <BotaoAnaliseIa rotulo="Recomendações pendentes" onClick={() => setDialogOp("recomendacoes")} /> : undefined}
        />
      </div>

      {!data ? (
        <div className="flex justify-center py-20">
          <Spinner size={40} label="Carregando painel operacional" />
        </div>
      ) : (
        <AreaAtualizavel atualizando={isFetching}>
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Situação por unidade */}
            <Section
              className="lg:col-span-3"
              title="Situação por unidade"
              info="Mostra como está cada unidade atendida (hospital ou posto): o quanto o estoque cobre a demanda, quantos itens estão em situação crítica e se a unidade está conectada ao sistema. Serve para ver de relance onde focar a atenção."
              description="Cobertura, itens críticos e conectividade de cada unidade atendida."
              action={<BotaoAnaliseIa rotulo="Situação por unidade" onClick={() => setDialogOp("unidades")} />}
              noPadding
            >
              {data.unidades.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma unidade atendida.</p>
              ) : (
                <div className="grid gap-px bg-border sm:grid-cols-2">
                  {data.unidades.map((u) => (
                    <div key={u.unidadeId} className="bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-semibold">{u.sigla}</p>
                            <p className="text-xs text-muted-foreground">{u.municipio}</p>
                          </div>
                        </div>
                        <StatusBadge status={u.statusUnidade} />
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Cobertura</span>
                          <span className="tabular font-medium">{u.cobertura}%</span>
                        </div>
                        <Progress value={u.cobertura} className="h-1.5" />
                        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                          <span>{u.criticos} críticos · {u.alertasAtivos} alertas</span>
                          <StatusBadge status={conectividadeStatus[u.conectividade]} label={u.conectividade} dot />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Fila de alertas */}
            <Section
              className="lg:col-span-2"
              title="Fila de alertas ativos"
              info="Lista os avisos que ainda precisam de providência, já encaminhados a quem é responsável por resolvê-los. É a fila de trabalho do dia a dia para manter o abastecimento em ordem."
              description="Direcionados aos perfis responsáveis."
              action={
                <div className="flex items-center gap-2">
                  <BotaoAnaliseIa rotulo="Fila de alertas" onClick={() => setDialogOp("filaAlertas")} />
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/alertas">Ver todos</Link>
                  </Button>
                </div>
              }
              noPadding
            >
              {data.alertasAtivos.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum alerta ativo na rede.</p>
              ) : (
                <ul className="divide-y">
                  {data.alertasAtivos.map((a) => (
                    <li key={a.id} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {a.tipo === "Desabastecimento" ? <PackageX className="size-4 text-danger" /> : <CalendarClock className="size-4 text-warning" />}
                          {a.tipo}
                        </span>
                        <StatusBadge status={severidadeStatus[a.severidade]} label={a.severidade} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{a.unidadeSigla} · {a.unidadeNome}</p>
                      <p className="text-xs text-muted-foreground">{a.mensagem}</p>
                      <div className="mt-1.5 flex gap-1">
                        {a.destinatarios.map((d) => (
                          <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <Section
            title="Recomendações em aberto"
            info="Sugestões de compra ou de transferência de insumos entre unidades que ainda aguardam aprovação. Cada uma indica o item, de onde sai e para onde vai, a quantidade e o motivo, para facilitar a decisão."
            description="Filtre por situação (pendente, aprovada, recusada…), unidade e insumo."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <BotaoAnaliseIa rotulo="Recomendações" onClick={() => setDialogOp("recsAbertas")} />
                <SelectFiltro
                  valor={statusRec}
                  onChange={setStatusRec}
                  opcoes={STATUS_REC_OPCOES}
                  todosRotulo="Todos os status"
                  className="w-44"
                />
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/recomendacoes">Ver todas</Link>
                </Button>
              </div>
            }
          >
            {recsQuery.isError ? (
              <ErroConsulta
                mensagem="Não foi possível carregar as recomendações."
                onTentarNovamente={() => recsQuery.refetch()}
              />
            ) : recsQuery.isPending ? (
              <div className="flex justify-center py-10">
                <Spinner size={32} label="Carregando recomendações" />
              </div>
            ) : recomendacoes.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma recomendação para este filtro.</p>
            ) : (
              <AreaAtualizavel atualizando={recsQuery.isFetching}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {recomendacoes.map((r) => (
                    <Card key={r.id} className="gap-2 p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={r.tipo === "Redistribuição" ? "secondary" : "outline"} className="text-[10px]">{r.tipo}</Badge>
                        <StatusBadge status={recomendacaoStatus[r.status]} label={r.status} dot={false} />
                      </div>
                      <div className="text-sm">
                        <span className="flex flex-col">
                          <span className="font-medium leading-tight">{r.insumoNome}</span>
                          <span className="text-xs text-muted-foreground">{r.insumoCodigo}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {r.unidadeOrigemSigla && (
                          <>
                            <span className="font-medium">{r.unidadeOrigemSigla}</span>
                            <ArrowLeftRight className="size-3 text-muted-foreground" />
                          </>
                        )}
                        <span className="font-medium">{r.unidadeDestinoSigla}</span>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{r.justificativa}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="tabular text-sm font-semibold">{fmtNum(r.quantidade)} un</span>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/recomendacoes">Avaliar</Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </AreaAtualizavel>
            )}
          </Section>
        </AreaAtualizavel>
      )}

      {data && (
        <>
          <GraficoInsightDialog
            aberto={dialogOp === "alertas"}
            onOpenChange={(a) => setDialogOp(a ? "alertas" : null)}
            titulo="Alertas ativos — análise por IA"
            descricao="Visão consolidada dos alertas ativos por tipo e severidade, com orientação de prioridade."
            mensagens={mensagensAnalise(corpoAlertasAtivos(data))}
            chave="op-alertas"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "desabastecimento"}
            onOpenChange={(a) => setDialogOp(a ? "desabastecimento" : null)}
            titulo="Risco de desabastecimento — análise por IA"
            descricao="Itens com risco de faltar antes da próxima reposição e prioridades de ação."
            mensagens={mensagensAnalise(corpoRiscoDesabastecimento(data))}
            chave="op-desabastecimento"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "vencimento"}
            onOpenChange={(a) => setDialogOp(a ? "vencimento" : null)}
            titulo="Risco de vencimento — análise por IA"
            descricao="Itens com validade se aproximando e sugestões de redistribuição ou uso acelerado."
            mensagens={mensagensAnalise(corpoRiscoVencimento(data))}
            chave="op-vencimento"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "recomendacoes"}
            onOpenChange={(a) => setDialogOp(a ? "recomendacoes" : null)}
            titulo="Recomendações pendentes — análise por IA"
            descricao="Recomendações que aguardam aprovação, com orientação sobre quais priorizar."
            mensagens={mensagensAnalise(corpoRecomendacoesPendentes(data))}
            chave="op-recomendacoes"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "unidades"}
            onOpenChange={(a) => setDialogOp(a ? "unidades" : null)}
            titulo="Situação por unidade — análise por IA"
            descricao="Análise consolidada das unidades com indicação de quais exigem atenção imediata."
            mensagens={mensagensAnalise(corpoSituacaoUnidades(data))}
            chave="op-unidades"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "filaAlertas"}
            onOpenChange={(a) => setDialogOp(a ? "filaAlertas" : null)}
            titulo="Fila de alertas — análise por IA"
            descricao="Ordem de ação recomendada para os alertas ativos, agrupada por urgência."
            mensagens={mensagensAnalise(corpoFilaAlertas(data))}
            chave="op-filaAlertas"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "recsAbertas"}
            onOpenChange={(a) => setDialogOp(a ? "recsAbertas" : null)}
            titulo="Recomendações em aberto — análise por IA"
            descricao="Priorização das recomendações em aberto com base no tipo, unidade e justificativa."
            mensagens={mensagensAnalise(corpoRecomendacoesAbertas(data))}
            chave="op-recsAbertas"
          />
        </>
      )}
    </>
  )
}

function Cabecalho({ actions }: { actions?: React.ReactNode }) {
  return (
    <PageHeader
      icon={<Activity className="size-5" />}
      title="Painel Operacional"
      info="Visão geral do dia a dia da farmácia hospitalar: reúne os avisos que precisam de ação, as sugestões de reposição e remanejamento de estoque e a situação de cada unidade da rede, tudo em uma só tela."
      description="Alertas ativos, recomendações de reposição/redistribuição e situação de cada unidade da rede."
      actions={actions}
    />
  )
}
