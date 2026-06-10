import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { AlertCircle, Boxes, CalendarClock, Clock, Layers, Loader2, PackageX } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"
import { Paginacao } from "@/components/shared/Paginacao"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePosicaoDetalhe, usePosicoes, useResumoEstoque, useLotes } from "@/hooks/use-estoque"
import type { PosicaoEstoque } from "@/lib/estoque"
import type { StatusKey } from "@/lib/status"
import { fmtData, fmtDataHora, fmtNum } from "@/lib/format"

const LOTES_POR_PAGINA = 8

/** Mensagem de erro padrão de uma consulta. */
function ErroConsulta({ mensagem }: { mensagem?: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" />
      {mensagem ?? "Não foi possível carregar os dados. Tente novamente."}
    </div>
  )
}

export default function EstoquePage() {
  const [sel, setSel] = useState<PosicaoEstoque | null>(null)
  const [pagVenc, setPagVenc] = useState(0)

  const resumoQuery = useResumoEstoque()
  const posicoesQuery = usePosicoes()
  const lotesQuery = useLotes({ comSaldo: true, validadeAteDias: 90 })
  const detalheQuery = usePosicaoDetalhe(sel?.medicamentoId, sel?.unidadeId)

  const columns: ColumnDef<PosicaoEstoque>[] = [
    {
      header: "Medicamento",
      accessorKey: "medicamentoNome",
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="font-medium leading-tight">{row.original.medicamentoNome}</span>
          <span className="text-xs text-muted-foreground">{row.original.medicamentoCodigo}</span>
        </span>
      ),
    },
    {
      header: "Unidade",
      accessorKey: "unidadeSigla",
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="font-medium">{row.original.unidadeSigla}</span>
          <span className="text-xs text-muted-foreground">{row.original.unidadeNome}</span>
        </span>
      ),
    },
    {
      accessorKey: "quantidade",
      header: "Estoque",
      cell: ({ row }) => {
        const p = row.original
        const pct = Math.min(100, Math.round((p.quantidade / p.estoqueMaximo) * 100))
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs">
              <span className="tabular font-medium">{fmtNum(p.quantidade)}</span>
              <span className="tabular text-muted-foreground">/ {fmtNum(p.estoqueMaximo)}</span>
            </div>
            <Progress
              value={pct}
              className={`mt-1 h-1.5 ${p.status === "critico" ? "[&>div]:bg-danger" : p.status === "atencao" ? "[&>div]:bg-warning" : "[&>div]:bg-success"}`}
            />
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]

  const lotesVenc = [...(lotesQuery.data ?? [])].sort((a, b) => a.diasParaVencer - b.diasParaVencer)
  const totalPagVenc = Math.ceil(lotesVenc.length / LOTES_POR_PAGINA)
  const pagVencSegura = Math.min(pagVenc, Math.max(0, totalPagVenc - 1))
  const lotesVencPagina = lotesVenc.slice(
    pagVencSegura * LOTES_POR_PAGINA,
    pagVencSegura * LOTES_POR_PAGINA + LOTES_POR_PAGINA,
  )

  return (
    <>
      <PageHeader
        icon={<Boxes className="size-5" />}
        title="Estoque & Rastreabilidade por Lote"
        rf="RF-EST"
        description="Níveis de estoque por unidade, rastreabilidade por lote com controle de validade e histórico de movimentação para auditoria sanitária."
      />

      {/* KPIs */}
      {resumoQuery.isError ? (
        <ErroConsulta mensagem="Não foi possível carregar os indicadores do estoque." />
      ) : resumoQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Itens abaixo do mínimo" value={fmtNum(resumoQuery.data.itensCriticos)} icon={PackageX} accent="danger" rf="RF-EST-04" />
          <KpiCard label="Lotes próx. do vencimento" value={fmtNum(resumoQuery.data.lotesProximosVencimento)} icon={CalendarClock} accent="warning" hint="≤ 60 dias" rf="RF-EST-04" />
          <KpiCard label="Tempo médio de ressup." value={`${resumoQuery.data.tempoMedioRessuprimentoDias} dias`} icon={Clock} accent="teal" rf="RF-EST-05" />
          <KpiCard label="Unidades em estoque" value={fmtNum(resumoQuery.data.totalUnidadesEstoque)} icon={Layers} accent="primary" rf="RF-EST-01" />
        </div>
      )}

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
            {posicoesQuery.isError ? (
              <ErroConsulta mensagem="Não foi possível carregar as posições de estoque." />
            ) : posicoesQuery.isPending ? (
              <Skeleton className="h-96" />
            ) : (
              <DataTable
                columns={columns}
                data={posicoesQuery.data}
                searchKey="medicamentoNome"
                searchPlaceholder="Buscar medicamento ou unidade…"
                pageSize={10}
                onRowClick={(r) => setSel(r)}
                dense
              />
            )}
          </Section>
        </TabsContent>

        <TabsContent value="vencimento" className="pt-4">
          <Section
            title="Lotes próximos do vencimento"
            rf="RF-EST-02"
            description="Lotes com validade em até 90 dias — priorizados para uso ou redistribuição."
            noPadding
          >
            {lotesQuery.isError ? (
              <div className="p-5">
                <ErroConsulta mensagem="Não foi possível carregar os lotes." />
              </div>
            ) : lotesQuery.isPending ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : lotesVenc.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nenhum lote vence nos próximos 90 dias.
              </p>
            ) : (
              <>
                <div className="divide-y">
                  {lotesVencPagina.map((l) => {
                    const st: StatusKey =
                      l.diasParaVencer <= 20 ? "critico" : l.diasParaVencer <= 45 ? "atencao" : "info"
                    return (
                      <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{l.numeroLote}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-tight">{l.medicamentoNome}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.unidadeSigla} · {l.fabricante} · {fmtNum(l.quantidade)} un
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{fmtData(l.validade)}</p>
                          <StatusBadge status={st} label={`${l.diasParaVencer} dias`} dot={false} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="px-5 py-3">
                  <Paginacao
                    paginaAtual={pagVencSegura}
                    totalPaginas={totalPagVenc}
                    onMudarPagina={setPagVenc}
                    totalRegistros={lotesVenc.length}
                  />
                </div>
              </>
            )}
          </Section>
        </TabsContent>
      </Tabs>

      {/* Drill-down de lote (RF-EST-03 / RF-EST-06) */}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-2xl">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>{sel.medicamentoNome}</DialogTitle>
                <DialogDescription>
                  {sel.unidadeNome} — rastreabilidade por lote e histórico de movimentação (RF-EST-03 · RF-EST-06)
                </DialogDescription>
              </DialogHeader>

              {detalheQuery.isError ? (
                <ErroConsulta mensagem="Não foi possível carregar o detalhe da posição." />
              ) : detalheQuery.isPending ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando lotes e movimentações…
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lotes</p>
                    <div className="space-y-2">
                      {detalheQuery.data.lotes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem lotes para esta posição.</p>
                      ) : (
                        detalheQuery.data.lotes.map((l) => (
                          <div key={l.id} className="flex items-center justify-between rounded-lg border p-2.5">
                            <div>
                              <p className="font-mono text-xs font-medium">{l.numeroLote}</p>
                              <p className="text-xs text-muted-foreground">{l.fabricante}</p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="tabular font-medium">{fmtNum(l.quantidade)} un</p>
                              <span className={l.diasParaVencer <= 30 ? "text-danger" : "text-muted-foreground"}>
                                val. {fmtData(l.validade)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Movimentações recentes</p>
                    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {detalheQuery.data.movimentacoes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem movimentações registradas.</p>
                      ) : (
                        detalheQuery.data.movimentacoes.slice(0, 12).map((m) => (
                          <div key={m.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant={m.tipo === "Entrada" ? "secondary" : m.tipo === "Transferência" ? "outline" : "default"} className="text-[10px]">{m.tipo}</Badge>
                              <span className="text-muted-foreground">{m.documento} · {m.responsavel}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="tabular">{fmtNum(m.quantidade)} un</span>
                              <span className="text-muted-foreground">{fmtDataHora(m.dataHora)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
