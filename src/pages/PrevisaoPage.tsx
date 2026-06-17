import { useRef, useState } from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { Boxes, BrainCircuit, GitBranch, RefreshCw, Target, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable, type ControleServidor } from "@/components/shared/DataTable"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { BarraFiltros, FiltroInsumo, FiltroUnidade, SelectFiltro } from "@/components/shared/filtros"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { ForecastChart } from "@/components/charts/ForecastChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  usePrevisaoDetalhe,
  usePrevisoes,
  useRecalibrarPrevisoes,
  useResumoPrevisao,
} from "@/hooks/use-previsoes"
import { useDebounce } from "@/hooks/use-debounce"
import { usePerfil } from "@/context/auth"
import { podeGerir } from "@/lib/permissoes"
import { ApiError } from "@/lib/api"
import { TAMANHO_PAGINA_PADRAO } from "@/lib/paginacao"
import { META_MAPE, type Previsao } from "@/lib/previsoes"
import type { StatusKey } from "@/lib/status"
import { fmtData, fmtNum, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"

const driftStatus: Record<Previsao["drift"], StatusKey> = {
  Estável: "ok",
  Atenção: "atencao",
  Degradado: "critico",
}

/** Coluna da tabela (id) → campo de ordenação no backend. */
const ORDENACAO_BACKEND: Record<string, string> = {
  insumoNome: "insumo.nome",
  unidadeSigla: "unidade.sigla",
  mape: "mape",
  criticidade: "insumo.criticidade",
  drift: "drift",
}

/** Cor do MAPE pela meta do projeto (RF-PRV-05): dentro da meta (< 15%) ou fora. */
function mapeStatus(mape: number): StatusKey {
  return mape < META_MAPE ? "ok" : "critico"
}

function mensagemDeErro(erro: unknown): string {
  return erro instanceof ApiError ? erro.message : "Erro inesperado. Tente novamente."
}

/**
 * "Composição da previsão" usa dados ilustrativos (sem endpoint que sirva o ensemble/validação).
 * Oculta da tela por ora — o código fica preservado para reativar quando o backend expuser.
 */
const MOSTRAR_COMPOSICAO = false

/** Opções do filtro de status (desvio do modelo / drift) na tabela de previsões. */
const DRIFT_OPCOES = [
  { valor: "Estável", rotulo: "Estável" },
  { valor: "Atenção", rotulo: "Atenção" },
  { valor: "Degradado", rotulo: "Degradado" },
]

export default function PrevisaoPage() {
  const perfil = usePerfil()
  // "Gestor ou Admin" — quem pode tomar decisões de gestão (recalibrar, etc.).
  const ehGestor = podeGerir(perfil)

  // Guarda só a chave do item escolhido; a linha é derivada da página (default: a primeira).
  const [selKey, setSelKey] = useState<{ insumoId: string; unidadeId: string } | null>(null)
  // Referência ao gráfico de topo: ao clicar numa linha, rolamos até ele (o gráfico troca de item).
  const graficoRef = useRef<HTMLDivElement>(null)

  // Filtros (unidade + insumo) — repassados ao backend, que já os aceita.
  const [unidadeId, setUnidadeId] = useState<string | undefined>(undefined)
  const [insumoId, setInsumoId] = useState<string | undefined>(undefined)
  // Filtro de status do desvio do modelo (drift), isolado na tabela de previsões.
  const [drift, setDrift] = useState<string | undefined>(undefined)

  // Estado da tabela (paginação/ordenação/busca server-side).
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(TAMANHO_PAGINA_PADRAO)
  const [sorting, setSorting] = useState<SortingState>([])
  const [busca, setBusca] = useState("")
  const buscaDebounced = useDebounce(busca, 350)

  const ordenacao = sorting[0]
  const resumoQuery = useResumoPrevisao({ unidadeId, insumoId })
  const previsoesQuery = usePrevisoes(
    { unidadeId, insumoId, drift: drift as Previsao["drift"] | undefined, busca: buscaDebounced || undefined },
    {
      pagina,
      tamanho,
      ordenarPor: ordenacao ? ORDENACAO_BACKEND[ordenacao.id] : undefined,
      ordem: ordenacao?.desc ? "desc" : "asc",
    },
  )

  /** Filtro mudou → volta para a primeira página (evita página vazia). */
  function aoFiltrarUnidade(v: string | undefined) {
    setUnidadeId(v)
    setPagina(0)
  }
  function aoFiltrarInsumo(v: string | undefined) {
    setInsumoId(v)
    setPagina(0)
  }
  function aoFiltrarDrift(v: string | undefined) {
    setDrift(v)
    setPagina(0)
  }

  /** Seleciona o item e rola até o gráfico de topo, deixando claro que ele reflete o clique. */
  function selecionarItem(insumoId: string, unidadeId: string) {
    setSelKey({ insumoId, unidadeId })
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    graficoRef.current?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" })
  }
  const recalibrar = useRecalibrarPrevisoes()

  const itens = previsoesQuery.data?.itens
  const sel: Previsao | null =
    itens && itens.length > 0
      ? itens.find(
          (p) => p.insumoId === selKey?.insumoId && p.unidadeId === selKey?.unidadeId,
        ) ?? itens[0]
      : null
  const detalheQuery = usePrevisaoDetalhe(sel?.insumoId, sel?.unidadeId)

  const servidorPrevisoes: ControleServidor = {
    paginaAtual: pagina,
    tamanhoPagina: tamanho,
    totalRegistros: previsoesQuery.data?.total ?? 0,
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

  function aoRecalibrar() {
    recalibrar.mutate(undefined, {
      onSuccess: (resultado) => toast.success(resultado.mensagem),
      onError: (erro) => toast.error(mensagemDeErro(erro)),
    })
  }

  const columns: ColumnDef<Previsao>[] = [
    {
      accessorKey: "insumoNome",
      header: "Insumo",
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="font-medium leading-tight">{row.original.insumoNome}</span>
          <span className="text-xs text-muted-foreground">{row.original.insumoCodigo}</span>
        </span>
      ),
    },
    {
      accessorKey: "unidadeSigla",
      header: "Unidade",
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="font-medium">{row.original.unidadeSigla}</span>
          <span className="text-xs text-muted-foreground">{row.original.unidadeNome}</span>
        </span>
      ),
    },
    {
      accessorKey: "mape",
      header: "Erro (MAPE)",
      cell: ({ row }) => (
        <StatusBadge status={mapeStatus(row.original.mape)} label={fmtPct(row.original.mape)} dot={false} />
      ),
    },
    {
      accessorKey: "criticidade",
      header: "Criticidade",
      cell: ({ row }) => {
        const c = row.original.criticidade
        return <Badge variant={c === "Alta" ? "destructive" : "outline"} className="text-[10px]">{c}</Badge>
      },
    },
    {
      accessorKey: "modelo",
      header: "Modelo",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.modelo}</span>,
    },
    {
      accessorKey: "drift",
      header: "Desvio do modelo",
      cell: ({ row }) => <StatusBadge status={driftStatus[row.original.drift]} label={row.original.drift} />,
    },
  ]

  return (
    <>
      <PageHeader
        icon={<TrendingUp className="size-5" />}
        title="Previsão de Demanda"
        info="Estima quanto de cada insumo será consumido em cada unidade nos próximos meses. A assertividade é medida pelo erro MAPE (meta: abaixo de 15% nos itens de maior criticidade). Quanto melhor a previsão, menos faltas e menos desperdício."
        description="Estima a demanda futura por insumo, unidade e horizonte, com assertividade aferida (meta de erro MAPE < 15% nos itens de maior criticidade)."
        actions={
          ehGestor && (
            <Button variant="outline" disabled={recalibrar.isPending} onClick={aoRecalibrar}>
              <RefreshCw className={recalibrar.isPending ? "size-4 animate-spin" : "size-4"} />
              Recalibrar previsões
            </Button>
          )
        }
      />

      <BarraFiltros>
        <FiltroUnidade valor={unidadeId} onChange={aoFiltrarUnidade} />
        <FiltroInsumo valor={insumoId} onChange={aoFiltrarInsumo} unidadeId={unidadeId} />
      </BarraFiltros>

      {/* KPIs */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores de previsão."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Erro médio (MAPE)" value={resumoQuery.data ? fmtPct(resumoQuery.data.mapeMedio) : ""} carregando={resumoQuery.isPending} icon={Target} accent="success" hint="alvo < 15%" info="Erro médio das previsões: o quanto, em média, elas erram para mais ou para menos. Quanto menor, melhor — o alvo é ficar abaixo de 15%." />
          <KpiCard label="Itens críticos na meta" value={resumoQuery.data ? `${resumoQuery.data.criticosNaMeta}/${resumoQuery.data.totalCriticos}` : ""} carregando={resumoQuery.isPending} icon={Boxes} accent="teal" info="Quantos dos insumos de maior criticidade já estão com a previsão dentro da meta de erro (abaixo de 15%)." />
          <KpiCard label="Previsões ativas" value={resumoQuery.data ? fmtNum(resumoQuery.data.previsoesAtivas) : ""} carregando={resumoQuery.isPending} icon={BrainCircuit} accent="primary" hint="geradas automaticamente" info="Total de previsões geradas automaticamente e em uso no momento, uma para cada combinação de insumo e unidade." />
          <KpiCard label="Itens com desvio" value={resumoQuery.data ? fmtNum(resumoQuery.data.itensComDesvio) : ""} carregando={resumoQuery.isPending} icon={GitBranch} accent={resumoQuery.data?.itensComDesvio ? "warning" : "success"} hint="monitoramento contínuo" info="Itens cujo consumo recente se afastou do que o modelo previa (desvio). Sinalizam que a previsão pode precisar de recalibração." />
        </div>
      )}

      {previsoesQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar as previsões."
          onTentarNovamente={() => previsoesQuery.refetch()}
        />
      ) : !previsoesQuery.data ? (
        <div className="flex justify-center py-20">
          <Spinner size={40} label="Carregando previsões" />
        </div>
      ) : previsoesQuery.data.itens.length === 0 ? (
        <Section title="Previsões por item e unidade" info="Lista todas as previsões por insumo e unidade, com o erro (MAPE), a criticidade e o desvio do modelo. Clique em uma linha para ver a série completa.">
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma previsão disponível no momento.
          </p>
        </Section>
      ) : (
        <>
          <div className={cn("grid gap-6", MOSTRAR_COMPOSICAO && "lg:grid-cols-5")}>
            <div ref={graficoRef} className={cn("scroll-mt-4", MOSTRAR_COMPOSICAO && "lg:col-span-3")}>
            <Section
              title={sel ? `Previsão — ${sel.insumoNome}` : "Previsão"}
              info="Série temporal do item selecionado: consumo histórico, previsão e projeção futura. Selecione uma linha na tabela abaixo para trocar o item."
              description={sel ? `${sel.unidadeNome} · horizonte de ${sel.horizonteMeses} meses` : undefined}
              action={sel && <Badge variant="outline" className="font-mono text-[10px]">{sel.modelo}</Badge>}
            >
              {!sel || detalheQuery.isPending ? (
                <div className="flex justify-center py-20">
                  <Spinner size={40} label="Carregando série" />
                </div>
              ) : detalheQuery.isError ? (
                <ErroConsulta
                  mensagem="Não foi possível carregar a série temporal."
                  onTentarNovamente={() => detalheQuery.refetch()}
                />
              ) : (
                <AreaAtualizavel atualizando={detalheQuery.isFetching}>
                  <ForecastChart serie={detalheQuery.data.serie} />
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { l: "Erro (MAPE)", v: fmtPct(sel.mape) },
                      { l: "Horizonte", v: `${sel.horizonteMeses} meses` },
                      { l: "Versão do modelo", v: sel.versaoModelo },
                      { l: "Calibrado em", v: fmtData(sel.calibradoEm) },
                    ].map((x) => (
                      <div key={x.l} className="rounded-lg bg-muted/50 p-3">
                        <p className="text-[11px] text-muted-foreground">{x.l}</p>
                        <p className="tabular text-sm font-semibold">{x.v}</p>
                      </div>
                    ))}
                  </div>
                </AreaAtualizavel>
              )}
            </Section>
            </div>

            {MOSTRAR_COMPOSICAO && (
            <Section
              className="lg:col-span-2"
              title="Composição da previsão"
              info="Mostra como a previsão é montada: a combinação de métodos estatísticos e de inteligência artificial, com o peso de cada um, além de métricas de validação e o histórico de versões do modelo."
              description="Combinação de métodos estatísticos e de inteligência artificial."
              action={
                <Badge variant="outline" className="border-warning/40 bg-warning/10 text-[10px] text-warning">
                  Dados ilustrativos
                </Badge>
              }
            >
              {/* NOTA: este painel ainda usa dados ilustrativos (mock) embutidos — não há endpoint
                  que sirva composição do ensemble, métricas de validação (MAE/RMSE) nem histórico de
                  versões. Fica fora do escopo da Fase 5 (ver ROADMAP); migra quando o backend expuser. */}
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
                  <p className="pt-1 text-xs text-muted-foreground">Pesos ajustados por validação histórica.</p>
                </TabsContent>
                <TabsContent value="validacao" className="space-y-2 pt-3 text-sm">
                  {[
                    ["Método de validação", "Validação temporal (5 ciclos)"],
                    ["Erro médio absoluto (MAE)", "284 un"],
                    ["Erro quadrático (RMSE)", "412 un"],
                    ["Janela de calibração", "24 meses móveis"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b py-1.5 last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="tabular font-medium">{v}</span>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="versoes" className="space-y-2 pt-3">
                  {["v4.2 (produção)", "v4.1", "v3.7", "v3.0"].map((v, i) => (
                    <div key={v} className={cn("flex items-center justify-between rounded-lg border p-2.5", i === 0 && "border-primary/40 bg-primary/5")}>
                      <span className="font-mono text-xs">{v}</span>
                      {i === 0 ? <StatusBadge status="ok" label="Ativa" /> : <span className="text-[11px] text-muted-foreground">arquivada</span>}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </Section>
            )}
          </div>

          <Section
            title="Previsões por item e unidade"
            info="Lista todas as previsões por insumo e unidade, com o erro (MAPE), a criticidade e o desvio do modelo. Clique em uma linha para ver a série completa."
            description="Selecione uma linha para visualizar a série completa. Itens de maior criticidade destacados."
            action={
              <SelectFiltro
                valor={drift}
                onChange={aoFiltrarDrift}
                opcoes={DRIFT_OPCOES}
                todosRotulo="Todos os status"
                className="w-44"
              />
            }
          >
            <AreaAtualizavel atualizando={previsoesQuery.isFetching}>
              <DataTable
                columns={columns}
                data={previsoesQuery.data.itens}
                searchKey="insumoNome"
                searchPlaceholder="Buscar insumo ou unidade…"
                onRowClick={(r) => selecionarItem(r.insumoId, r.unidadeId)}
                dense
                servidor={servidorPrevisoes}
              />
            </AreaAtualizavel>
          </Section>
        </>
      )}
    </>
  )
}
