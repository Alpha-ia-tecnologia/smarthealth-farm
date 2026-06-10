import { useState } from "react"
import { ArrowLeftRight, ArrowRight, BadgeCheck, Boxes, BrainCircuit, Coins } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { MedLabel, UniLabel } from "@/components/shared/MedLabel"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { recomendacoes, totais } from "@/data"
import type { Recomendacao } from "@/types"
import { fmtMoeda, fmtNum } from "@/lib/format"
import { toast } from "sonner"

const statusMap = { Pendente: "atencao", Aprovada: "info", Executada: "ok" } as const

function RecCard({ r }: { r: Recomendacao }) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between">
        <Badge variant={r.tipo === "Redistribuição" ? "secondary" : "outline"}>{r.tipo}</Badge>
        <div className="flex items-center gap-2">
          {r.origemMotor === "Aprendizado de Máquina" ? (
            <Badge className="gap-1 bg-primary/15 text-primary text-[10px]"><BrainCircuit className="size-3" /> IA</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Regras</Badge>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
        </div>
      </div>

      <div className="text-sm"><MedLabel id={r.medicamentoId} sub /></div>

      <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
        {r.unidadeOrigemId ? (
          <>
            <UniLabel id={r.unidadeOrigemId} />
            <ArrowRight className="size-3.5 text-primary" />
            <UniLabel id={r.unidadeDestinoId} />
          </>
        ) : (
          <>
            <Boxes className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Reposição →</span>
            <UniLabel id={r.unidadeDestinoId} />
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{r.justificativa}</p>

      <div className="flex items-center justify-between border-t pt-3">
        <div>
          <p className="tabular text-sm font-semibold">{fmtNum(r.quantidade)} un</p>
          <p className="text-[11px] text-success">economia {fmtMoeda(r.economiaEstimada)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={statusMap[r.status]} label={r.status} />
          {r.status === "Pendente" && (
            <Button size="sm" onClick={() => toast.success(`Recomendação ${r.id} aprovada`)}>Aprovar</Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function RecomendacoesPage() {
  const [tab, setTab] = useState("todas")
  const filtrar = (t?: Recomendacao["tipo"]) => recomendacoes.filter((r) => !t || r.tipo === t)
  const dados = tab === "todas" ? recomendacoes : tab === "reposicao" ? filtrar("Reposição") : filtrar("Redistribuição")

  const porML = recomendacoes.filter((r) => r.origemMotor === "Aprendizado de Máquina").length
  const taxaAdesao = Math.round((recomendacoes.filter((r) => r.status !== "Pendente").length / recomendacoes.length) * 100)

  return (
    <>
      <PageHeader
        icon={<ArrowLeftRight className="size-5" />}
        title="Reposição & Redistribuição"
        rf="RF-REC"
        description="Módulo de recomendação dimensionado pela previsão de demanda — reduz compras emergenciais e equilibra estoques críticos entre unidades."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Recomendações pendentes" value={fmtNum(totais.recomendacoesPendentes)} icon={ArrowLeftRight} accent="warning" rf="RF-REC-01" />
        <KpiCard label="Economia potencial" value={fmtMoeda(totais.economiaPotencial)} icon={Coins} accent="success" rf="RF-REC-02" />
        <KpiCard label="Geradas por IA" value={fmtNum(porML)} icon={BrainCircuit} accent="primary" hint="evolução de regras → IA" rf="RF-REC-03" />
        <KpiCard label="Taxa de adesão" value={`${taxaAdesao}%`} icon={BadgeCheck} accent="teal" hint="aprovadas + executadas" rf="RF-REC-05" />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="reposicao">Reposição</TabsTrigger>
              <TabsTrigger value="redistribuicao">Redistribuição</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                {dados.map((r) => (
                  <RecCard key={r.id} r={r} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Métricas do módulo (RF-REC-05) */}
        <Section className="lg:col-span-1 h-fit" title="Desempenho do módulo" rf="RF-REC-05" description="Acompanhamento e auditoria.">
          <div className="space-y-4">
            {[
              { l: "Assertividade das recomendações", v: 87, c: "var(--chart-4)" },
              { l: "Redistribuições aceitas", v: 72, c: "var(--chart-2)" },
              { l: "Cobertura por regras", v: 100 - Math.round((porML / recomendacoes.length) * 100), c: "var(--chart-1)" },
              { l: "Cobertura assistida por IA", v: Math.round((porML / recomendacoes.length) * 100), c: "var(--chart-3)" },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex justify-between text-xs">
                  <span>{m.l}</span>
                  <span className="tabular font-medium">{m.v}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${m.v}%`, background: m.c }} />
                </div>
              </div>
            ))}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Evolução do módulo</p>
              Regras configuráveis em produção; transição assistida por inteligência artificial em curso (RF-REC-03).
            </div>
          </div>
        </Section>
      </div>
    </>
  )
}
