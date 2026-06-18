import { useState } from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  PackageX,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  Wrench,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { PaginaIaInsight } from "@/components/shared/PaginaIaInsight"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable, type ControleServidor } from "@/components/shared/DataTable"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { BarraFiltros, FiltroInsumo, FiltroUnidade, SelectFiltro } from "@/components/shared/filtros"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { ConfirmarAcaoAlertaDialog } from "@/components/alertas/ConfirmarAcaoAlertaDialog"
import { Paginacao } from "@/components/shared/Paginacao"
import { TAMANHO_PAGINA_PADRAO } from "@/lib/paginacao"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAlertas,
  useGerarAlertas,
  useLimiares,
  useResumoAlertas,
  useSalvarLimiares,
  useTratarAlerta,
} from "@/hooks/use-alertas"
import { useDebounce } from "@/hooks/use-debounce"
import { usePerfil } from "@/context/auth"
import { podeGerir } from "@/lib/permissoes"
import { ApiError } from "@/lib/api"
import type {
  Alerta,
  LimiarAlerta,
  ResumoAlertas,
  SeveridadeAlerta,
  StatusAlerta,
  TipoAlerta,
} from "@/lib/alertas"
import { mensagensAnalise } from "@/lib/ia-prompts"
import { fmtDataHora, fmtNum } from "@/lib/format"
import { severidadeStatus } from "@/lib/status"

/** Corpo da triagem por IA dos alertas: resumo + os ativos em destaque. */
function corpoAlertas(resumo: ResumoAlertas, alertas: Alerta[]): string {
  const ativos = alertas.filter((a) => a.status !== "Resolvido").slice(0, 6)
  const lista = ativos
    .map((a) => `- ${a.tipo} [${a.severidade}] ${a.insumoNome} @ ${a.unidadeSigla}: ${a.mensagem} (${a.status})`)
    .join("\n")
  return (
    `Faça a triagem dos alertas operacionais da rede hospitalar. Aponte: (1) o que tratar primeiro ` +
    `(prioridade), (2) o risco por tipo, (3) ações recomendadas.\n\n` +
    `Resumo: ${resumo.ativos} ativos (${resumo.abertos} abertos, ${resumo.emTratamento} em tratamento), ` +
    `${resumo.desabastecimento} de desabastecimento, ${resumo.vencimento} de vencimento, ` +
    `${resumo.criticos} críticos.\n\nAlertas ativos em destaque:\n${lista || "—"}`
  )
}

const statusMap = { Aberto: "critico", "Em tratamento": "atencao", Resolvido: "ok" } as const

/** Opções dos filtros isolados da seção "Alertas disparados". */
const STATUS_ALERTA_OPCOES = [
  { valor: "Aberto", rotulo: "Aberto" },
  { valor: "Em tratamento", rotulo: "Em tratamento" },
  { valor: "Resolvido", rotulo: "Resolvido" },
]
const SEVERIDADE_OPCOES = [
  { valor: "Crítico", rotulo: "Crítico" },
  { valor: "Alto", rotulo: "Alto" },
  { valor: "Médio", rotulo: "Médio" },
]

/** Coluna da tabela (id) → campo de ordenação no backend. */
const ORDENACAO_BACKEND: Record<string, string> = {
  tipo: "tipo",
  severidade: "severidade",
  insumoNome: "insumo.nome",
  unidadeSigla: "unidade.sigla",
  status: "status",
}

function mensagemDeErro(erro: unknown): string {
  return erro instanceof ApiError ? erro.message : "Erro inesperado. Tente novamente."
}

export default function AlertasPage() {
  const perfil = usePerfil()
  // "Gestor ou Admin" — quem pode gerar alertas e editar limiares.
  const ehGestor = podeGerir(perfil)

  // Filtros compartilhados (unidade + insumo) — valem para ativos e histórico.
  const [unidadeId, setUnidadeId] = useState<string | undefined>(undefined)
  const [insumoId, setInsumoId] = useState<string | undefined>(undefined)

  // Aba "ativos": filtro por tipo/status/severidade + paginação/ordenação/busca server-side.
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoAlerta>("Todos")
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(undefined)
  const [filtroSeveridade, setFiltroSeveridade] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(TAMANHO_PAGINA_PADRAO)
  const [sorting, setSorting] = useState<SortingState>([])
  const [busca, setBusca] = useState("")
  const buscaDebounced = useDebounce(busca, 350)

  // Aba "histórico": paginação própria, mais recentes primeiro.
  const [pagHistorico, setPagHistorico] = useState(0)
  const [tamanhoHistorico, setTamanhoHistorico] = useState(TAMANHO_PAGINA_PADRAO)

  const ordenacao = sorting[0]
  const resumoQuery = useResumoAlertas({ unidadeId, insumoId })
  const alertasQuery = useAlertas(
    {
      tipo: filtroTipo === "Todos" ? undefined : filtroTipo,
      status: filtroStatus as StatusAlerta | undefined,
      severidade: filtroSeveridade as SeveridadeAlerta | undefined,
      unidadeId,
      insumoId,
      busca: buscaDebounced || undefined,
    },
    {
      pagina,
      tamanho,
      ordenarPor: ordenacao ? ORDENACAO_BACKEND[ordenacao.id] : undefined,
      ordem: ordenacao?.desc ? "desc" : "asc",
    },
  )
  const historicoQuery = useAlertas(
    { unidadeId, insumoId },
    { pagina: pagHistorico, tamanho: tamanhoHistorico, ordenarPor: "criadoEm", ordem: "desc" },
  )
  const limiaresQuery = useLimiares()

  /** Mudou unidade/insumo → reseta as duas listas; status/severidade só a de ativos. */
  function aoFiltrarUnidade(v: string | undefined) {
    setUnidadeId(v)
    setPagina(0)
    setPagHistorico(0)
  }
  function aoFiltrarInsumo(v: string | undefined) {
    setInsumoId(v)
    setPagina(0)
    setPagHistorico(0)
  }
  function aoFiltrarStatus(v: string | undefined) {
    setFiltroStatus(v)
    setPagina(0)
  }
  function aoFiltrarSeveridade(v: string | undefined) {
    setFiltroSeveridade(v)
    setPagina(0)
  }

  const tratar = useTratarAlerta()
  const gerar = useGerarAlertas()

  // Ação de tratamento aguardando confirmação no modal (null = nenhum modal aberto).
  const [acaoPendente, setAcaoPendente] = useState<{ alerta: Alerta; status: Alerta["status"] } | null>(null)

  function confirmarAcao() {
    if (!acaoPendente) return
    const { alerta, status } = acaoPendente
    tratar.mutate(
      { id: alerta.id, status },
      {
        onSuccess: () => {
          toast.success(`Alerta ${status === "Resolvido" ? "resolvido" : "em tratamento"}.`)
          setAcaoPendente(null)
        },
        onError: (erro) => toast.error(mensagemDeErro(erro)),
      },
    )
  }

  function aoGerar() {
    gerar.mutate(undefined, {
      onSuccess: (resultado) => toast.success(resultado.mensagem),
      onError: (erro) => toast.error(mensagemDeErro(erro)),
    })
  }

  const columns: ColumnDef<Alerta>[] = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          {row.original.tipo === "Desabastecimento" ? (
            <PackageX className="size-4 text-danger" />
          ) : (
            <CalendarClock className="size-4 text-warning" />
          )}
          {row.original.tipo}
        </span>
      ),
    },
    {
      accessorKey: "severidade",
      header: "Severidade",
      cell: ({ row }) => (
        <StatusBadge status={severidadeStatus[row.original.severidade]} label={row.original.severidade} />
      ),
    },
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
        <span className="inline-flex items-center gap-1.5">
          <span className="font-medium">{row.original.unidadeSigla}</span>
        </span>
      ),
    },
    {
      accessorKey: "mensagem",
      header: "Detalhe",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.mensagem}</span>,
    },
    {
      accessorKey: "destinatarios",
      header: "Direcionado a",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.destinatarios.map((d) => (
            <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={statusMap[row.original.status]} label={row.original.status} />,
    },
    {
      id: "acoes",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original
        if (a.status === "Resolvido") return null
        return a.status === "Aberto" ? (
          <Button size="xs" variant="outline" disabled={tratar.isPending} onClick={() => setAcaoPendente({ alerta: a, status: "Em tratamento" })}>
            <Wrench className="size-3" />
            Tratar
          </Button>
        ) : (
          <Button size="xs" variant="outline" disabled={tratar.isPending} onClick={() => setAcaoPendente({ alerta: a, status: "Resolvido" })}>
            <CheckCheck className="size-3" />
            Resolver
          </Button>
        )
      },
    },
  ]

  const servidorAlertas: ControleServidor = {
    paginaAtual: pagina,
    tamanhoPagina: tamanho,
    totalRegistros: alertasQuery.data?.total ?? 0,
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

  const historico = historicoQuery.data?.itens ?? []
  const totalHistorico = historicoQuery.data?.total ?? 0
  const totalPagHistorico = Math.ceil(totalHistorico / tamanhoHistorico)

  return (
    <>
      <PageHeader
        icon={<BellRing className="size-5" />}
        title="Alertas Operacionais"
        info="Aqui o sistema avisa, de forma automática, quando algum insumo corre risco de acabar ou de vencer. Use esta tela para ver os avisos, ajustar quando eles devem disparar e acompanhar o que já foi resolvido."
        description="Alertas automáticos de risco de desabastecimento e de vencimento, com base nas previsões de demanda, configuração de limiares e direcionamento por perfil."
        actions={
          resumoQuery.data ? (
            <PaginaIaInsight
              rotulo="Alertas"
              titulo="Triagem inteligente dos alertas"
              descricao="A IA prioriza os alertas ativos e sugere as primeiras ações."
              mensagens={mensagensAnalise(corpoAlertas(resumoQuery.data, alertasQuery.data?.itens ?? []))}
            />
          ) : undefined
        }
      />

      <BarraFiltros>
        <FiltroUnidade valor={unidadeId} onChange={aoFiltrarUnidade} />
        <FiltroInsumo valor={insumoId} onChange={aoFiltrarInsumo} unidadeId={unidadeId} />
      </BarraFiltros>

      {/* KPIs */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores de alertas."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Alertas ativos" value={resumoQuery.data ? fmtNum(resumoQuery.data.ativos) : ""} carregando={resumoQuery.isPending} icon={BellRing} accent="danger" hint="abertos + em tratamento" info="Total de avisos que ainda exigem atenção: os que ninguém começou a tratar somados aos que já estão em tratamento. Quanto maior o número, mais situações de risco aguardam uma providência." />
          <KpiCard label="Desabastecimento iminente" value={resumoQuery.data ? fmtNum(resumoQuery.data.desabastecimento) : ""} carregando={resumoQuery.isPending} icon={PackageX} accent="danger" info="Quantos insumos estão prestes a faltar no estoque, segundo a previsão de consumo. São os casos mais urgentes, porque a falta afeta diretamente o atendimento." />
          <KpiCard label="Risco de vencimento" value={resumoQuery.data ? fmtNum(resumoQuery.data.vencimento) : ""} carregando={resumoQuery.isPending} icon={CalendarClock} accent="warning" info="Quantos insumos têm lotes perto da data de validade. São itens que precisam ser usados ou remanejados a tempo para não serem descartados." />
          <KpiCard label="Tratados" value={resumoQuery.data ? fmtNum(resumoQuery.data.resolvidos) : ""} carregando={resumoQuery.isPending} icon={SlidersHorizontal} accent="success" hint="alertas resolvidos" info="Quantidade de avisos que já foram resolvidos. Serve para acompanhar o quanto a equipe vem dando conta dos riscos identificados." />
        </div>
      )}

      <Tabs defaultValue="ativos">
        <TabsList>
          <TabsTrigger value="ativos">Alertas ativos</TabsTrigger>
          <TabsTrigger value="config">Configuração de limiares</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="pt-4">
          <Section
            title="Alertas disparados"
            info="Lista dos avisos que o sistema gerou e que ainda estão em aberto ou em tratamento. Você pode filtrar por tipo (falta de estoque ou risco de vencimento) e, em cada linha, marcar como em tratamento ou resolvido."
          >
            {/* Barra de controles: abas de tipo à esquerda; status/severidade e ação à direita. */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {(["Todos", "Desabastecimento", "Vencimento"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filtroTipo === f ? "default" : "outline"}
                    onClick={() => {
                      setFiltroTipo(f)
                      setPagina(0)
                    }}
                  >
                    {f}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SelectFiltro
                  valor={filtroStatus}
                  onChange={aoFiltrarStatus}
                  opcoes={STATUS_ALERTA_OPCOES}
                  todosRotulo="Todos os status"
                  className="w-40"
                />
                <SelectFiltro
                  valor={filtroSeveridade}
                  onChange={aoFiltrarSeveridade}
                  opcoes={SEVERIDADE_OPCOES}
                  todosRotulo="Todas as severidades"
                  className="w-44"
                />
                {ehGestor && (
                  <Button size="sm" variant="secondary" disabled={gerar.isPending} onClick={aoGerar}>
                    <RefreshCw className={gerar.isPending ? "size-3.5 animate-spin" : "size-3.5"} />
                    Gerar alertas
                  </Button>
                )}
              </div>
            </div>

            {alertasQuery.isError ? (
              <ErroConsulta
                mensagem="Não foi possível carregar os alertas."
                onTentarNovamente={() => alertasQuery.refetch()}
              />
            ) : !alertasQuery.data ? (
              <div className="flex justify-center py-20">
                <Spinner size={40} label="Carregando alertas" />
              </div>
            ) : (
              <AreaAtualizavel atualizando={alertasQuery.isFetching}>
                <DataTable
                  columns={columns}
                  data={alertasQuery.data.itens}
                  searchKey="insumoNome"
                  searchPlaceholder="Buscar alerta…"
                  dense
                  servidor={servidorAlertas}
                />
              </AreaAtualizavel>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="config" className="pt-4">
          <Section
            title="Parâmetros e limiares de disparo"
            info="Aqui se define em que momento o sistema deve disparar um aviso, por exemplo, com quantos dias de estoque restante ou de antecedência da validade. Ajustar esses limites torna os alertas mais ou menos sensíveis."
            description={
              ehGestor
                ? "Os valores configurados aqui são usados pelo motor na próxima geração de alertas."
                : "Somente o perfil Gestor pode alterar os limiares; os valores abaixo são a configuração vigente."
            }
            icon={<Settings2 className="size-4" />}
          >
            {limiaresQuery.isError ? (
              <ErroConsulta
                mensagem="Não foi possível carregar os limiares."
                onTentarNovamente={() => limiaresQuery.refetch()}
              />
            ) : limiaresQuery.isPending ? (
              <div className="flex justify-center py-16">
                <Spinner size={40} label="Carregando limiares" />
              </div>
            ) : (
              <FormularioLimiares
                key={limiaresQuery.data.atualizadoEm}
                limiares={limiaresQuery.data}
                podeEditar={ehGestor}
              />
            )}
          </Section>
        </TabsContent>

        <TabsContent value="historico" className="pt-4">
          <Section title="Histórico de alertas" info="Registro de todos os avisos já emitidos, com o tratamento que cada um recebeu. Serve para consultar o que aconteceu antes e como foi resolvido." description="Quantidade e tratamento dado a cada alerta emitido." noPadding>
            {historicoQuery.isError ? (
              <div className="p-5">
                <ErroConsulta
                  mensagem="Não foi possível carregar o histórico."
                  onTentarNovamente={() => historicoQuery.refetch()}
                />
              </div>
            ) : !historicoQuery.data ? (
              <div className="flex justify-center py-16">
                <Spinner size={40} label="Carregando histórico" />
              </div>
            ) : historico.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nenhum alerta emitido ainda.
              </p>
            ) : (
              <AreaAtualizavel atualizando={historicoQuery.isFetching}>
                <div className="divide-y">
                  {historico.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                      <StatusBadge status={severidadeStatus[a.severidade]} label={a.tipo} />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.mensagem}</span>
                      <StatusBadge status={statusMap[a.status]} label={a.status} />
                      <span className="hidden text-xs text-muted-foreground sm:inline">{fmtDataHora(a.criadoEm)}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3">
                  <Paginacao
                    paginaAtual={pagHistorico}
                    totalPaginas={totalPagHistorico}
                    onMudarPagina={setPagHistorico}
                    tamanhoPagina={tamanhoHistorico}
                    onMudarTamanho={(t) => {
                      setTamanhoHistorico(t)
                      setPagHistorico(0)
                    }}
                    totalRegistros={totalHistorico}
                  />
                </div>
              </AreaAtualizavel>
            )}
          </Section>
        </TabsContent>
      </Tabs>

      <ConfirmarAcaoAlertaDialog
        aberto={acaoPendente !== null}
        onOpenChange={(aberto) => {
          // Não fecha por clique fora/Esc enquanto a mutação está em andamento.
          if (!aberto && !tratar.isPending) setAcaoPendente(null)
        }}
        alerta={acaoPendente?.alerta ?? null}
        novoStatus={acaoPendente?.status ?? "Em tratamento"}
        onConfirmar={confirmarAcao}
        processando={tratar.isPending}
      />
    </>
  )
}

/** Campo numérico do formulário de limiares. */
function CampoLimiar({
  id,
  label,
  valor,
  onChange,
  disabled,
}: {
  id: string
  label: string
  valor: number
  onChange: (novo: number) => void
  disabled: boolean
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input
        id={id}
        type="number"
        min={1}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="mt-1.5 w-28 tabular"
      />
    </div>
  )
}

/**
 * Formulário de limiares (RF-ALE-03). Inicializa do valor vigente (remontado via `key` quando a
 * configuração muda no servidor). Edição restrita ao Gestor — o backend é a barreira real.
 */
function FormularioLimiares({ limiares, podeEditar }: { limiares: LimiarAlerta; podeEditar: boolean }) {
  const [form, setForm] = useState(() => ({
    percentualEstoqueMinimo: limiares.percentualEstoqueMinimo,
    coberturaCriticaDias: limiares.coberturaCriticaDias,
    coberturaAltaDias: limiares.coberturaAltaDias,
    antecedenciaVencimentoDias: limiares.antecedenciaVencimentoDias,
    vencimentoCriticoDias: limiares.vencimentoCriticoDias,
    vencimentoAltoDias: limiares.vencimentoAltoDias,
    desabastecimentoAtivo: limiares.desabastecimentoAtivo,
    vencimentoAtivo: limiares.vencimentoAtivo,
  }))
  const salvar = useSalvarLimiares()

  function aoSalvar() {
    salvar.mutate(form, {
      onSuccess: () => toast.success("Limiares salvos. Valem a partir da próxima geração de alertas."),
      onError: (erro) => toast.error(mensagemDeErro(erro)),
    })
  }

  const desabilitado = !podeEditar || salvar.isPending

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Badge variant="destructive" className="text-[10px]">Desabastecimento</Badge>
            <Switch
              checked={form.desabastecimentoAtivo}
              onCheckedChange={(v) => setForm((f) => ({ ...f, desabastecimentoAtivo: v }))}
              disabled={desabilitado}
              aria-label="Alertas de desabastecimento ativos"
            />
          </div>
          <div className="mt-3 space-y-3">
            <CampoLimiar id="lim-pct" label="Dispara abaixo de (% do estoque mínimo)" valor={form.percentualEstoqueMinimo} onChange={(v) => setForm((f) => ({ ...f, percentualEstoqueMinimo: v }))} disabled={desabilitado} />
            <CampoLimiar id="lim-cob-crit" label="Severidade Crítico — cobertura até (dias)" valor={form.coberturaCriticaDias} onChange={(v) => setForm((f) => ({ ...f, coberturaCriticaDias: v }))} disabled={desabilitado} />
            <CampoLimiar id="lim-cob-alta" label="Severidade Alto — cobertura até (dias)" valor={form.coberturaAltaDias} onChange={(v) => setForm((f) => ({ ...f, coberturaAltaDias: v }))} disabled={desabilitado} />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px]">Vencimento</Badge>
            <Switch
              checked={form.vencimentoAtivo}
              onCheckedChange={(v) => setForm((f) => ({ ...f, vencimentoAtivo: v }))}
              disabled={desabilitado}
              aria-label="Alertas de vencimento ativos"
            />
          </div>
          <div className="mt-3 space-y-3">
            <CampoLimiar id="lim-venc-janela" label="Antecedência do alerta (dias)" valor={form.antecedenciaVencimentoDias} onChange={(v) => setForm((f) => ({ ...f, antecedenciaVencimentoDias: v }))} disabled={desabilitado} />
            <CampoLimiar id="lim-venc-crit" label="Severidade Crítico — vence em até (dias)" valor={form.vencimentoCriticoDias} onChange={(v) => setForm((f) => ({ ...f, vencimentoCriticoDias: v }))} disabled={desabilitado} />
            <CampoLimiar id="lim-venc-alto" label="Severidade Alto — vence em até (dias)" valor={form.vencimentoAltoDias} onChange={(v) => setForm((f) => ({ ...f, vencimentoAltoDias: v }))} disabled={desabilitado} />
          </div>
        </div>
      </div>

      {podeEditar && (
        <div className="mt-4 flex justify-end">
          <Button onClick={aoSalvar} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando…" : "Salvar limiares"}
          </Button>
        </div>
      )}
    </>
  )
}
