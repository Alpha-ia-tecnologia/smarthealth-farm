import { Link } from "react-router-dom"
import { Activity, ArrowLeftRight, BellRing, MapPin, PackageX, CalendarClock } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { KpiCard } from "@/components/shared/KpiCard"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { usePainelOperacional } from "@/hooks/use-painel"
import { conectividadeStatus, severidadeStatus } from "@/lib/status"
import { fmtNum } from "@/lib/format"

export default function OperacionalPage() {
  const { data, isPending, isError, isFetching, refetch } = usePainelOperacional()

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Alertas ativos" value={data ? fmtNum(data.totais.alertasAtivos) : ""} carregando={isPending} icon={BellRing} accent="danger" hint="abertos + em tratamento" rf="RF-ALE-04" />
        <KpiCard label="Risco de desabastecimento" value={data ? fmtNum(data.totais.alertasDesabastecimento) : ""} carregando={isPending} icon={PackageX} accent="danger" rf="RF-ALE-01" />
        <KpiCard label="Risco de vencimento" value={data ? fmtNum(data.totais.alertasVencimento) : ""} carregando={isPending} icon={CalendarClock} accent="warning" rf="RF-ALE-02" />
        <KpiCard label="Recomendações pendentes" value={data ? fmtNum(data.totais.recomendacoesPendentes) : ""} carregando={isPending} icon={ArrowLeftRight} accent="teal" rf="RF-REC-01" />
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
              rf="RF-DASH-02"
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
              rf="RF-ALE-04"
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
            rf="RF-REC-04"
            description="Cada recomendação traz item, unidades de origem/destino, quantidade e motivo."
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/recomendacoes">Ver todas</Link>
              </Button>
            }
          >
            {data.recomendacoesAbertas.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma recomendação em aberto.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {data.recomendacoesAbertas.map((r) => (
                  <Card key={r.id} className="gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={r.tipo === "Redistribuição" ? "secondary" : "outline"} className="text-[10px]">{r.tipo}</Badge>
                      <StatusBadge
                        status={r.status === "Pendente" ? "atencao" : r.status === "Aprovada" ? "info" : "ok"}
                        label={r.status}
                        dot={false}
                      />
                    </div>
                    <div className="text-sm">
                      <span className="flex flex-col">
                        <span className="font-medium leading-tight">{r.medicamentoNome}</span>
                        <span className="text-xs text-muted-foreground">{r.medicamentoCodigo}</span>
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
      rf="RF-DASH-02"
      description="Alertas ativos, recomendações de reposição/redistribuição e situação de cada unidade da rede."
    />
  )
}
