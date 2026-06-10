import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Boxes, BrainCircuit, GitBranch, RefreshCw, Target, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { MedLabel, UniLabel } from "@/components/shared/MedLabel"
import { ForecastChart } from "@/components/charts/ForecastChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { previsoes, getMedicamento, getUnidade } from "@/data"
import type { Previsao } from "@/types"
import { fmtPct, fmtNum } from "@/lib/format"
import { cn } from "@/lib/utils"
import { AiInsight } from "@/components/shared/AiInsight"
import { insightPrevisao } from "@/lib/insights"

const driftStatus = { Estável: "ok", Atenção: "atencao", Degradado: "critico" } as const

function mapeStatus(mape: number) {
  return mape < 10 ? "ok" : mape < 15 ? "atencao" : "critico"
}

export default function PrevisaoPage() {
  const [sel, setSel] = useState<Previsao>(
    previsoes.find((p) => p.medicamentoId === "m-002") ?? previsoes[0],
  )

  const mapeMedio = useMemo(
    () => previsoes.reduce((s, p) => s + p.mape, 0) / previsoes.length,
    [],
  )
  const criticosAbaixoMeta = previsoes.filter(
    (p) => getMedicamento(p.medicamentoId)?.criticidade === "Alta" && p.mape < 15,
  ).length
  const totalCriticos = previsoes.filter((p) => getMedicamento(p.medicamentoId)?.criticidade === "Alta").length
  const driftDegradado = previsoes.filter((p) => p.drift === "Degradado").length

  const columns: ColumnDef<Previsao>[] = [
    {
      accessorKey: "medicamentoId",
      header: "Medicamento",
      accessorFn: (r) => getMedicamento(r.medicamentoId)?.nome,
      cell: ({ row }) => <MedLabel id={row.original.medicamentoId} sub />,
    },
    {
      accessorKey: "unidadeId",
      header: "Unidade",
      accessorFn: (r) => getUnidade(r.unidadeId)?.sigla,
      cell: ({ row }) => <UniLabel id={row.original.unidadeId} />,
    },
    {
      accessorKey: "mape",
      header: "Erro (MAPE)",
      cell: ({ row }) => (
        <StatusBadge status={mapeStatus(row.original.mape)} label={fmtPct(row.original.mape)} dot={false} />
      ),
    },
    {
      id: "criticidade",
      header: "Criticidade",
      accessorFn: (r) => getMedicamento(r.medicamentoId)?.criticidade,
      cell: ({ row }) => {
        const c = getMedicamento(row.original.medicamentoId)?.criticidade
        return <Badge variant={c === "Alta" ? "destructive" : "outline"} className="text-[10px]">{c}</Badge>
      },
    },
    { accessorKey: "modelo", header: "Modelo", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.modelo}</span> },
    {
      accessorKey: "drift",
      header: "Desvio do modelo",
      cell: ({ row }) => <StatusBadge status={driftStatus[row.original.drift]} label={row.original.drift} />,
    },
  ]

  const med = getMedicamento(sel.medicamentoId)!

  return (
    <>
      <PageHeader
        icon={<TrendingUp className="size-5" />}
        title="Previsão de Demanda"
        rf="RF-PRV"
        description="Estima a demanda futura por medicamento, unidade e horizonte, com assertividade aferida (meta de erro MAPE < 15% nos itens de maior criticidade)."
        actions={
          <Button variant="outline"><RefreshCw className="size-4" /> Recalibrar previsões</Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Erro médio (MAPE)" value={fmtPct(mapeMedio)} icon={Target} accent="success" hint="alvo < 15%" rf="RF-PRV-05" />
        <KpiCard label="Itens críticos na meta" value={`${criticosAbaixoMeta}/${totalCriticos}`} icon={Boxes} accent="teal" rf="RF-PRV-05" />
        <KpiCard label="Previsões ativas" value={fmtNum(previsoes.length)} icon={BrainCircuit} accent="primary" hint="geradas automaticamente" rf="RF-PRV-04" />
        <KpiCard label="Itens com desvio" value={fmtNum(driftDegradado)} icon={GitBranch} accent={driftDegradado ? "warning" : "success"} hint="monitoramento contínuo" rf="RF-PRV-06" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Section
          className="lg:col-span-3"
          title={`Previsão — ${med.nome}`}
          rf="RF-PRV-02"
          description={`${getUnidade(sel.unidadeId)?.nome} · horizonte de ${sel.horizonteMeses} meses`}
          action={<Badge variant="outline" className="font-mono text-[10px]">{sel.modelo}</Badge>}
        >
          <ForecastChart serie={sel.serie} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Erro (MAPE)", v: fmtPct(sel.mape) },
              { l: "Horizonte", v: `${sel.horizonteMeses} meses` },
              { l: "Versão do modelo", v: sel.versaoModelo },
              { l: "Atualizado", v: sel.atualizadoEm },
            ].map((x) => (
              <div key={x.l} className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground">{x.l}</p>
                <p className="tabular text-sm font-semibold">{x.v}</p>
              </div>
            ))}
          </div>
          <AiInsight
            className="mt-4"
            {...insightPrevisao(sel.serie, med.nome, { mape: sel.mape, drift: sel.drift })}
          />
        </Section>

        <Section className="lg:col-span-2" title="Composição da previsão" rf="RF-PRV-03" description="Combinação de métodos estatísticos e de inteligência artificial.">
          <Tabs defaultValue="ensemble">
            <TabsList className="w-full">
              <TabsTrigger value="ensemble" className="flex-1">Composição</TabsTrigger>
              <TabsTrigger value="validacao" className="flex-1">Validação</TabsTrigger>
              <TabsTrigger value="versoes" className="flex-1">Versões</TabsTrigger>
            </TabsList>
            <TabsContent value="ensemble" className="space-y-3 pt-3">
              {[
                { n: "Sazonalidade epidemiológica", peso: 35, c: "var(--chart-1)" },
                { n: "Padrões de consumo (IA)", peso: 40, c: "var(--chart-2)" },
                { n: "Padrões de consumo — rápido (IA)", peso: 15, c: "var(--chart-4)" },
                { n: "Tendência histórica", peso: 10, c: "var(--chart-3)" },
              ].map((m) => (
                <div key={m.n}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{m.n}</span>
                    <span className="tabular text-muted-foreground">{m.peso}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${m.peso}%`, background: m.c }} />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">Pesos ajustados por validação histórica (RF-PRV-03/08).</p>
            </TabsContent>
            <TabsContent value="validacao" className="space-y-2 pt-3 text-sm">
              {[
                ["Método de validação", "Validação temporal (5 ciclos)"],
                ["Erro médio absoluto (MAE)", "284 un"],
                ["Erro quadrático (RMSE)", "412 un"],
                ["Erro percentual (MAPE)", fmtPct(sel.mape)],
                ["Janela de calibração", "24 meses móveis"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-1.5 last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="tabular font-medium">{v}</span>
                </div>
              ))}
              <RfTagLine rf="RF-PRV-08" />
            </TabsContent>
            <TabsContent value="versoes" className="space-y-2 pt-3">
              {["v4.2 (produção)", "v4.1", "v3.7", "v3.0"].map((v, i) => (
                <div key={v} className={cn("flex items-center justify-between rounded-lg border p-2.5", i === 0 && "border-primary/40 bg-primary/5")}>
                  <span className="font-mono text-xs">{v}</span>
                  {i === 0 ? <StatusBadge status="ok" label="Ativa" /> : <span className="text-[11px] text-muted-foreground">arquivada</span>}
                </div>
              ))}
              <RfTagLine rf="RF-PRV-09" />
            </TabsContent>
          </Tabs>
        </Section>
      </div>

      <Section
        title="Previsões por item e unidade"
        rf="RF-PRV-01 · RF-PRV-02"
        description="Selecione uma linha para visualizar a série completa. Itens de maior criticidade destacados."
      >
        <DataTable
          columns={columns}
          data={previsoes}
          searchKey="medicamentoId"
          searchPlaceholder="Buscar medicamento ou unidade…"
          pageSize={8}
          onRowClick={(r) => setSel(r)}
          dense
        />
      </Section>
    </>
  )
}

function RfTagLine({ rf }: { rf: string }) {
  return <p className="pt-1 font-mono text-[10px] text-muted-foreground">{rf}</p>
}
