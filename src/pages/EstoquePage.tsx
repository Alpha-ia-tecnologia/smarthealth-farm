import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Boxes, CalendarClock, Clock, PackageX, Layers } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { MedLabel, UniLabel } from "@/components/shared/MedLabel"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  posicoes,
  lotes,
  movimentacoes,
  getMedicamento,
  getUnidade,
  statusEstoque,
  diasAte,
} from "@/data"
import type { PosicaoEstoque } from "@/types"
import { fmtNum } from "@/lib/format"
import { fmtData, fmtDataHora } from "@/lib/format"

export default function EstoquePage() {
  const [sel, setSel] = useState<PosicaoEstoque | null>(null)

  const criticos = posicoes.filter((p) => statusEstoque(p) === "critico").length
  const proxVenc = lotes.filter((l) => l.quantidade > 0 && diasAte(l.validade) <= 60).length
  const leadMedio = Math.round(posicoes.reduce((s, p) => s + p.tempoMedioRessuprimentoDias, 0) / posicoes.length)
  const totalUnidades = posicoes.reduce((s, p) => s + p.quantidade, 0)

  const columns: ColumnDef<PosicaoEstoque>[] = [
    {
      header: "Medicamento",
      accessorFn: (r) => getMedicamento(r.medicamentoId)?.nome,
      cell: ({ row }) => <MedLabel id={row.original.medicamentoId} sub />,
    },
    {
      header: "Unidade",
      accessorFn: (r) => getUnidade(r.unidadeId)?.sigla,
      cell: ({ row }) => <UniLabel id={row.original.unidadeId} />,
    },
    {
      accessorKey: "quantidade",
      header: "Estoque",
      cell: ({ row }) => {
        const p = row.original
        const pct = Math.min(100, Math.round((p.quantidade / p.estoqueMaximo) * 100))
        const st = statusEstoque(p)
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs">
              <span className="tabular font-medium">{fmtNum(p.quantidade)}</span>
              <span className="tabular text-muted-foreground">/ {fmtNum(p.estoqueMaximo)}</span>
            </div>
            <Progress value={pct} className={`mt-1 h-1.5 ${st === "critico" ? "[&>div]:bg-danger" : st === "atencao" ? "[&>div]:bg-warning" : "[&>div]:bg-success"}`} />
          </div>
        )
      },
    },
    {
      accessorKey: "nivelCritico",
      header: "Estoque mínimo",
      cell: ({ row }) => <span className="tabular text-sm">{fmtNum(row.original.nivelCritico)}</span>,
    },
    {
      accessorKey: "tempoMedioRessuprimentoDias",
      header: "Ressup. (dias)",
      cell: ({ row }) => <span className="tabular text-sm">{row.original.tempoMedioRessuprimentoDias}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (r) => statusEstoque(r),
      cell: ({ row }) => <StatusBadge status={statusEstoque(row.original)} />,
    },
  ]

  const lotesVenc = useMemo(
    () =>
      lotes
        .filter((l) => l.quantidade > 0)
        .map((l) => ({ ...l, dias: diasAte(l.validade) }))
        .filter((l) => l.dias <= 90)
        .sort((a, b) => a.dias - b.dias),
    [],
  )

  // Lotes/movimentações da posição selecionada
  const lotesSel = sel ? lotes.filter((l) => l.medicamentoId === sel.medicamentoId && l.unidadeId === sel.unidadeId) : []
  const movsSel = sel
    ? movimentacoes
        .filter((m) => m.medicamentoId === sel.medicamentoId && m.unidadeId === sel.unidadeId)
        .sort((a, b) => (a.data < b.data ? 1 : -1))
    : []

  return (
    <>
      <PageHeader
        icon={<Boxes className="size-5" />}
        title="Estoque & Rastreabilidade por Lote"
        rf="RF-EST"
        description="Níveis de estoque por unidade, rastreabilidade por lote com controle de validade e histórico de movimentação para auditoria sanitária."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Itens abaixo do mínimo" value={fmtNum(criticos)} icon={PackageX} accent="danger" rf="RF-EST-04" />
        <KpiCard label="Lotes próx. do vencimento" value={fmtNum(proxVenc)} icon={CalendarClock} accent="warning" hint="≤ 60 dias" rf="RF-EST-04" />
        <KpiCard label="Tempo médio de ressup." value={`${leadMedio} dias`} icon={Clock} accent="teal" rf="RF-EST-05" />
        <KpiCard label="Unidades em estoque" value={fmtNum(totalUnidades)} icon={Layers} accent="primary" rf="RF-EST-01" />
      </div>

      <Tabs defaultValue="posicoes">
        <TabsList>
          <TabsTrigger value="posicoes">Posições de estoque</TabsTrigger>
          <TabsTrigger value="vencimento">Controle de validade</TabsTrigger>
        </TabsList>

        <TabsContent value="posicoes" className="pt-4">
          <Section
            title="Posição por item e unidade"
            rf="RF-EST-01 · RF-EST-04"
            description="Estoque mínimo calculado a partir da previsão de demanda. Clique para ver os lotes e a movimentação."
          >
            <DataTable
              columns={columns}
              data={posicoes}
              searchKey="x"
              searchPlaceholder="Buscar medicamento ou unidade…"
              pageSize={10}
              onRowClick={(r) => setSel(r)}
              dense
            />
          </Section>
        </TabsContent>

        <TabsContent value="vencimento" className="pt-4">
          <Section
            title="Lotes próximos do vencimento"
            rf="RF-EST-02"
            description="Lotes com validade em até 90 dias — priorizados para uso ou redistribuição."
            noPadding
          >
            <div className="divide-y">
              {lotesVenc.map((l) => {
                const st = l.dias <= 20 ? "critico" : l.dias <= 45 ? "atencao" : "info"
                return (
                  <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{l.numeroLote}</span>
                    <div className="min-w-0 flex-1">
                      <MedLabel id={l.medicamentoId} />
                      <p className="text-xs text-muted-foreground">
                        <UniLabel id={l.unidadeId} /> · {l.fabricante} · {fmtNum(l.quantidade)} un
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{fmtData(l.validade)}</p>
                      <StatusBadge status={st} label={`${l.dias} dias`} dot={false} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      {/* Drill-down de lote (RF-EST-03 / RF-EST-06) */}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-2xl">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>{getMedicamento(sel.medicamentoId)?.nome}</DialogTitle>
                <DialogDescription>
                  {getUnidade(sel.unidadeId)?.nome} — rastreabilidade por lote e histórico de movimentação (RF-EST-03 · RF-EST-06)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lotes</p>
                  <div className="space-y-2">
                    {lotesSel.map((l) => {
                      const d = diasAte(l.validade)
                      return (
                        <div key={l.id} className="flex items-center justify-between rounded-lg border p-2.5">
                          <div>
                            <p className="font-mono text-xs font-medium">{l.numeroLote}</p>
                            <p className="text-[11px] text-muted-foreground">{l.fabricante}</p>
                          </div>
                          <div className="text-right text-xs">
                            <p className="tabular font-medium">{fmtNum(l.quantidade)} un</p>
                            <span className={d <= 30 ? "text-danger" : "text-muted-foreground"}>val. {fmtData(l.validade)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Movimentações recentes</p>
                  <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                    {movsSel.slice(0, 12).map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant={m.tipo === "Entrada" ? "secondary" : m.tipo === "Transferência" ? "outline" : "default"} className="text-[10px]">{m.tipo}</Badge>
                          <span className="text-muted-foreground">{m.documento} · {m.responsavel}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular">{fmtNum(m.quantidade)} un</span>
                          <span className="text-muted-foreground">{fmtDataHora(m.data)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
