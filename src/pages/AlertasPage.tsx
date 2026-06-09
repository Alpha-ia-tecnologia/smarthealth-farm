import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { BellRing, CalendarClock, PackageX, Settings2, SlidersHorizontal } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { MedLabel, UniLabel } from "@/components/shared/MedLabel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { alertas, getMedicamento, getUnidade, totais } from "@/data"
import type { Alerta } from "@/types"
import { fmtNum, fmtDataHora } from "@/lib/format"
import { severidadeStatus } from "@/lib/status"

const statusMap = { Aberto: "critico", "Em tratamento": "atencao", Resolvido: "ok" } as const

export default function AlertasPage() {
  const [filtro, setFiltro] = useState<"Todos" | "Desabastecimento" | "Vencimento">("Todos")
  const dados = alertas.filter((a) => filtro === "Todos" || a.tipo === filtro)

  const columns: ColumnDef<Alerta>[] = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          {row.original.tipo === "Desabastecimento" ? <PackageX className="size-4 text-danger" /> : <CalendarClock className="size-4 text-warning" />}
          {row.original.tipo}
        </span>
      ),
    },
    { accessorKey: "severidade", header: "Severidade", cell: ({ row }) => <StatusBadge status={severidadeStatus[row.original.severidade]} label={row.original.severidade} /> },
    {
      header: "Medicamento",
      accessorFn: (r) => getMedicamento(r.medicamentoId)?.nome,
      cell: ({ row }) => <MedLabel id={row.original.medicamentoId} />,
    },
    { header: "Unidade", accessorFn: (r) => getUnidade(r.unidadeId)?.sigla, cell: ({ row }) => <UniLabel id={row.original.unidadeId} /> },
    { accessorKey: "mensagem", header: "Detalhe", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.mensagem}</span> },
    {
      accessorKey: "destinatarios",
      header: "Direcionado a",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.destinatarios.map((d) => (
            <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
          ))}
        </div>
      ),
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={statusMap[row.original.status]} label={row.original.status} /> },
  ]

  const limiares = [
    { id: "rup-dias", label: "Desabastecimento — cobertura mínima (dias)", valor: 7, tipo: "Desabastecimento" },
    { id: "rup-pct", label: "Desabastecimento — % do estoque mínimo", valor: 100, tipo: "Desabastecimento" },
    { id: "venc-dias", label: "Vencimento — antecedência (dias)", valor: 60, tipo: "Vencimento" },
    { id: "venc-crit", label: "Vencimento crítico (dias)", valor: 20, tipo: "Vencimento" },
  ]

  return (
    <>
      <PageHeader
        icon={<BellRing className="size-5" />}
        title="Alertas Operacionais"
        rf="RF-ALE"
        description="Alertas automáticos de risco de desabastecimento e de vencimento, com base nas previsões de demanda, configuração de limiares e direcionamento por perfil."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Alertas abertos" value={fmtNum(totais.alertasAbertos)} icon={BellRing} accent="danger" rf="RF-ALE-04" />
        <KpiCard label="Desabastecimento iminente" value={fmtNum(totais.alertasRuptura)} icon={PackageX} accent="danger" rf="RF-ALE-01" />
        <KpiCard label="Risco de vencimento" value={fmtNum(totais.alertasVencimento)} icon={CalendarClock} accent="warning" rf="RF-ALE-02" />
        <KpiCard label="Tratados (mês)" value="38" icon={SlidersHorizontal} accent="success" hint="histórico de tratamento" rf="RF-ALE-05" />
      </div>

      <Tabs defaultValue="ativos">
        <TabsList>
          <TabsTrigger value="ativos">Alertas ativos</TabsTrigger>
          <TabsTrigger value="config">Configuração de limiares</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="pt-4">
          <Section
            title="Alertas disparados"
            rf="RF-ALE-01 · RF-ALE-02"
            action={
              <div className="flex gap-1">
                {(["Todos", "Desabastecimento", "Vencimento"] as const).map((f) => (
                  <Button key={f} size="sm" variant={filtro === f ? "default" : "outline"} onClick={() => setFiltro(f)}>{f}</Button>
                ))}
              </div>
            }
          >
            <DataTable columns={columns} data={dados} searchKey="x" searchPlaceholder="Buscar alerta…" pageSize={10} dense />
          </Section>
        </TabsContent>

        <TabsContent value="config" className="pt-4">
          <Section title="Parâmetros e limiares de disparo" rf="RF-ALE-03" description="Configuração dos parâmetros que disparam cada tipo de alerta." icon={<Settings2 className="size-4" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {limiares.map((l) => (
                <div key={l.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={l.tipo === "Desabastecimento" ? "destructive" : "secondary"} className="text-[10px]">{l.tipo}</Badge>
                    <Switch defaultChecked />
                  </div>
                  <Label htmlFor={l.id} className="mt-3 block text-sm">{l.label}</Label>
                  <Input id={l.id} type="number" defaultValue={l.valor} className="mt-1.5 w-28 tabular" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button>Salvar limiares</Button>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="historico" className="pt-4">
          <Section title="Histórico de alertas" rf="RF-ALE-05" description="Quantidade e tratamento dado a cada alerta emitido." noPadding>
            <div className="divide-y">
              {alertas.slice(0, 12).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                  <StatusBadge status={severidadeStatus[a.severidade]} label={a.tipo} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.mensagem}</span>
                  <StatusBadge status={statusMap[a.status]} label={a.status} />
                  <span className="hidden text-xs text-muted-foreground sm:inline">{fmtDataHora(a.criadoEm)}</span>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </>
  )
}
