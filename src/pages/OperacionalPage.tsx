import { Activity, ArrowLeftRight, BellRing, MapPin, PackageX, CalendarClock } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { KpiCard } from "@/components/shared/KpiCard"
import { MedLabel, UniLabel } from "@/components/shared/MedLabel"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  alertas,
  recomendacoes,
  totais,
  unidadesAtendidas,
  resumoUnidade,
} from "@/data"
import { conectividadeStatus, severidadeStatus, type StatusKey } from "@/lib/status"
import { fmtNum } from "@/lib/format"

export default function OperacionalPage() {
  const alertasAtivos = alertas.filter((a) => a.status !== "Resolvido").slice(0, 8)
  const recs = recomendacoes.filter((r) => r.status !== "Executada").slice(0, 6)

  return (
    <>
      <PageHeader
        icon={<Activity className="size-5" />}
        title="Painel Operacional"
        rf="RF-DASH-02"
        description="Alertas ativos, recomendações de reposição/redistribuição e situação de cada unidade da rede."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Alertas abertos" value={fmtNum(totais.alertasAbertos)} icon={BellRing} accent="danger" rf="RF-ALE-04" />
        <KpiCard label="Risco de desabastecimento" value={fmtNum(totais.alertasRuptura)} icon={PackageX} accent="danger" rf="RF-ALE-01" />
        <KpiCard label="Risco de vencimento" value={fmtNum(totais.alertasVencimento)} icon={CalendarClock} accent="warning" rf="RF-ALE-02" />
        <KpiCard label="Recomendações pendentes" value={fmtNum(totais.recomendacoesPendentes)} icon={ArrowLeftRight} accent="teal" rf="RF-REC-01" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Situação por unidade */}
        <Section
          className="lg:col-span-3"
          title="Situação por unidade"
          rf="RF-DASH-02"
          description="Cobertura, itens críticos e conectividade de cada unidade atendida."
          noPadding
        >
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {unidadesAtendidas.map((u) => {
              const r = resumoUnidade(u.id)
              const st: StatusKey = r.criticos > 3 ? "critico" : r.criticos > 0 ? "atencao" : "ok"
              return (
                <div key={u.id} className="bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold">{u.sigla}</p>
                        <p className="text-xs text-muted-foreground">{u.municipio}</p>
                      </div>
                    </div>
                    <StatusBadge status={st} />
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Cobertura</span>
                      <span className="tabular font-medium">{r.cobertura}%</span>
                    </div>
                    <Progress value={r.cobertura} className="h-1.5" />
                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                      <span>{r.criticos} críticos · {r.alertasAtivos} alertas</span>
                      <StatusBadge status={conectividadeStatus[u.conectividade]} label={u.conectividade} dot />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Fila de alertas */}
        <Section
          className="lg:col-span-2"
          title="Fila de alertas ativos"
          rf="RF-ALE-04"
          description="Direcionados aos perfis responsáveis."
          noPadding
        >
          <ul className="divide-y">
            {alertasAtivos.map((a) => (
              <li key={a.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {a.tipo === "Desabastecimento" ? <PackageX className="size-4 text-danger" /> : <CalendarClock className="size-4 text-warning" />}
                    {a.tipo}
                  </span>
                  <StatusBadge status={severidadeStatus[a.severidade]} label={a.severidade} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground"><UniLabel id={a.unidadeId} /></p>
                <p className="text-xs text-muted-foreground">{a.mensagem}</p>
                <div className="mt-1.5 flex gap-1">
                  {a.destinatarios.map((d) => (
                    <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section
        title="Recomendações em aberto"
        rf="RF-REC-04"
        description="Cada recomendação traz item, unidades de origem/destino, quantidade e motivo."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recs.map((r) => (
            <Card key={r.id} className="gap-2 p-4">
              <div className="flex items-center justify-between">
                <Badge variant={r.tipo === "Redistribuição" ? "secondary" : "outline"} className="text-[10px]">{r.tipo}</Badge>
                <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
              </div>
              <div className="text-sm"><MedLabel id={r.medicamentoId} sub /></div>
              <div className="flex items-center gap-2 text-xs">
                {r.unidadeOrigemId && (
                  <>
                    <UniLabel id={r.unidadeOrigemId} />
                    <ArrowLeftRight className="size-3 text-muted-foreground" />
                  </>
                )}
                <UniLabel id={r.unidadeDestinoId} />
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{r.justificativa}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="tabular text-sm font-semibold">{fmtNum(r.quantidade)} un</span>
                <Button size="sm" variant="outline">Avaliar</Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}
