import { useState } from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { Boxes, CalendarClock, Clock, Layers, PackageX } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable, type ControleServidor } from "@/components/shared/DataTable"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { Paginacao } from "@/components/shared/Paginacao"
import { TAMANHO_PAGINA_PADRAO } from "@/lib/paginacao"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePosicaoDetalhe, usePosicoes, useResumoEstoque, useLotes } from "@/hooks/use-estoque"
import { useDebounce } from "@/hooks/use-debounce"
import type { PosicaoEstoque } from "@/lib/estoque"
import type { StatusKey } from "@/lib/status"
import { fmtData, fmtDataHora, fmtNum } from "@/lib/format"

/** Coluna da tabela (id) → campo de ordenação no backend. Status é derivado: não ordenável. */
const ORDENACAO_BACKEND: Record<string, string> = {
  medicamentoNome: "medicamento.nome",
  unidadeSigla: "unidade.sigla",
  quantidade: "quantidade",
  nivelCritico: "nivelCritico",
  tempoMedioRessuprimentoDias: "tempoMedioRessuprimentoDias",
}

export default function EstoquePage() {
  const [sel, setSel] = useState<PosicaoEstoque | null>(null)

  // Estado da tabela de posições (paginação/ordenação/busca server-side).
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(TAMANHO_PAGINA_PADRAO)
  const [sorting, setSorting] = useState<SortingState>([])
  const [busca, setBusca] = useState("")
  const buscaDebounced = useDebounce(busca, 350)

  // Estado da aba de validade (paginação server-side).
  const [pagVenc, setPagVenc] = useState(0)
  const [tamanhoVenc, setTamanhoVenc] = useState(TAMANHO_PAGINA_PADRAO)

  const ordenacao = sorting[0]
  const resumoQuery = useResumoEstoque()
  const posicoesQuery = usePosicoes(
    { busca: buscaDebounced || undefined },
    {
      pagina,
      tamanho,
      ordenarPor: ordenacao ? ORDENACAO_BACKEND[ordenacao.id] : undefined,
      ordem: ordenacao?.desc ? "desc" : "asc",
    },
  )
  const lotesQuery = useLotes(
    { comSaldo: true, validadeAteDias: 90 },
    { pagina: pagVenc, tamanho: tamanhoVenc },
  )
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
      enableSorting: false, // status é derivado no backend; não há coluna para ordenar
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]

  const servidorPosicoes: ControleServidor = {
    paginaAtual: pagina,
    tamanhoPagina: tamanho,
    totalRegistros: posicoesQuery.data?.total ?? 0,
    onMudarPagina: setPagina,
    onMudarTamanho: (t) => {
      setTamanho(t)
      setPagina(0)
    },
    sorting,
    onSortingChange: (s) => {
      setSorting(s)
      setPagina(0)
    },
    busca,
    onBuscaChange: (b) => {
      setBusca(b)
      setPagina(0)
    },
  }

  const lotesVenc = lotesQuery.data?.itens ?? []
  const totalLotes = lotesQuery.data?.total ?? 0
  const totalPagVenc = Math.ceil(totalLotes / tamanhoVenc)

  return (
    <>
      <PageHeader
        icon={<Boxes className="size-5" />}
        title="Estoque & Rastreabilidade por Lote"
        rf="RF-EST"
        description="Níveis de estoque por unidade, rastreabilidade por lote com controle de validade e histórico de movimentação para auditoria sanitária."
      />

      {/* KPIs — cada card mostra um spinner enquanto a API carrega */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores do estoque."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Itens abaixo do mínimo" value={resumoQuery.data ? fmtNum(resumoQuery.data.itensCriticos) : ""} carregando={resumoQuery.isPending} icon={PackageX} accent="danger" rf="RF-EST-04" />
          <KpiCard label="Lotes próx. do vencimento" value={resumoQuery.data ? fmtNum(resumoQuery.data.lotesProximosVencimento) : ""} carregando={resumoQuery.isPending} icon={CalendarClock} accent="warning" hint="≤ 60 dias" rf="RF-EST-04" />
          <KpiCard label="Tempo médio de ressup." value={resumoQuery.data ? `${resumoQuery.data.tempoMedioRessuprimentoDias} dias` : ""} carregando={resumoQuery.isPending} icon={Clock} accent="teal" rf="RF-EST-05" />
          <KpiCard label="Unidades em estoque" value={resumoQuery.data ? fmtNum(resumoQuery.data.totalUnidadesEstoque) : ""} carregando={resumoQuery.isPending} icon={Layers} accent="primary" rf="RF-EST-01" />
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
              <ErroConsulta
                mensagem="Não foi possível carregar as posições de estoque."
                onTentarNovamente={() => posicoesQuery.refetch()}
              />
            ) : !posicoesQuery.data ? (
              <div className="flex justify-center py-20">
                <Spinner size={40} label="Carregando posições" />
              </div>
            ) : (
              <AreaAtualizavel atualizando={posicoesQuery.isFetching}>
                <DataTable
                  columns={columns}
                  data={posicoesQuery.data.itens}
                  searchKey="medicamentoNome"
                  searchPlaceholder="Buscar medicamento ou unidade…"
                  onRowClick={(r) => setSel(r)}
                  dense
                  servidor={servidorPosicoes}
                />
              </AreaAtualizavel>
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
                <ErroConsulta
                  mensagem="Não foi possível carregar os lotes."
                  onTentarNovamente={() => lotesQuery.refetch()}
                />
              </div>
            ) : !lotesQuery.data ? (
              <div className="flex justify-center py-16">
                <Spinner size={40} label="Carregando lotes" />
              </div>
            ) : lotesVenc.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nenhum lote vence nos próximos 90 dias.
              </p>
            ) : (
              <AreaAtualizavel atualizando={lotesQuery.isFetching}>
                <div className="divide-y">
                  {lotesVenc.map((l) => {
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
                    paginaAtual={pagVenc}
                    totalPaginas={totalPagVenc}
                    onMudarPagina={setPagVenc}
                    tamanhoPagina={tamanhoVenc}
                    onMudarTamanho={(t) => {
                      setTamanhoVenc(t)
                      setPagVenc(0)
                    }}
                    totalRegistros={totalLotes}
                  />
                </div>
              </AreaAtualizavel>
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
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
                  <Spinner size={32} />
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
                        detalheQuery.data.movimentacoes.map((m) => (
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
