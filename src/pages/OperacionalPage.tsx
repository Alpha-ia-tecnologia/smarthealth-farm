import { useState } from "react"
import { Link } from "react-router-dom"
import { Activity, ArrowLeftRight, BellRing, MapPin, PackageX, CalendarClock } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
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
import { conectividadeStatus, recomendacaoStatus, severidadeStatus } from "@/lib/status"
import { fmtNum } from "@/lib/format"

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
      <Cabecalho />

      <BarraFiltros>
        <FiltroUnidade valor={unidadeId} onChange={setUnidadeId} />
        <FiltroInsumo valor={insumoId} onChange={setInsumoId} unidadeId={unidadeId} />
      </BarraFiltros>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Alertas ativos" value={data ? fmtNum(data.totais.alertasAtivos) : ""} carregando={isPending} icon={BellRing} accent="danger" hint="abertos + em tratamento" info="Quantos avisos importantes precisam de atenção agora, somando os que ainda não foram tratados e os que já estão em andamento. Quanto menor, mais sob controle está a operação." />
        <KpiCard label="Risco de desabastecimento" value={data ? fmtNum(data.totais.alertasDesabastecimento) : ""} carregando={isPending} icon={PackageX} accent="danger" info="Número de insumos que correm risco de acabar antes da próxima reposição. São casos que exigem ação rápida para não faltar remédio aos pacientes." />
        <KpiCard label="Risco de vencimento" value={data ? fmtNum(data.totais.alertasVencimento) : ""} carregando={isPending} icon={CalendarClock} accent="warning" info="Número de insumos com data de validade se aproximando que talvez não sejam usados a tempo. Ajuda a evitar desperdício, antecipando o uso ou a transferência desses itens." />
        <KpiCard label="Recomendações pendentes" value={data ? fmtNum(data.totais.recomendacoesPendentes) : ""} carregando={isPending} icon={ArrowLeftRight} accent="teal" info="Sugestões do sistema para repor ou remanejar estoque entre unidades que ainda aguardam uma decisão. Avaliá-las mantém o abastecimento equilibrado na rede." />
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
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/alertas">Ver todos</Link>
                </Button>
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
    </>
  )
}

function Cabecalho() {
  return (
    <PageHeader
      icon={<Activity className="size-5" />}
      title="Painel Operacional"
      info="Visão geral do dia a dia da farmácia hospitalar: reúne os avisos que precisam de ação, as sugestões de reposição e remanejamento de estoque e a situação de cada unidade da rede, tudo em uma só tela."
      description="Alertas ativos, recomendações de reposição/redistribuição e situação de cada unidade da rede."
    />
  )
}
