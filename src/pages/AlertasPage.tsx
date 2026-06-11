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
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable, type ControleServidor } from "@/components/shared/DataTable"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
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
import { ApiError } from "@/lib/api"
import type { Alerta, LimiarAlerta, TipoAlerta } from "@/lib/alertas"
import { fmtDataHora, fmtNum } from "@/lib/format"
import { severidadeStatus } from "@/lib/status"

const statusMap = { Aberto: "critico", "Em tratamento": "atencao", Resolvido: "ok" } as const

/** Coluna da tabela (id) → campo de ordenação no backend. */
const ORDENACAO_BACKEND: Record<string, string> = {
  tipo: "tipo",
  severidade: "severidade",
  medicamentoNome: "medicamento.nome",
  unidadeSigla: "unidade.sigla",
  status: "status",
}

function mensagemDeErro(erro: unknown): string {
  return erro instanceof ApiError ? erro.message : "Erro inesperado. Tente novamente."
}

export default function AlertasPage() {
  const perfil = usePerfil()
  const ehGestor = perfil === "Gestor"

  // Aba "ativos": filtro por tipo + paginação/ordenação/busca server-side.
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoAlerta>("Todos")
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(TAMANHO_PAGINA_PADRAO)
  const [sorting, setSorting] = useState<SortingState>([])
  const [busca, setBusca] = useState("")
  const buscaDebounced = useDebounce(busca, 350)

  // Aba "histórico": paginação própria, mais recentes primeiro.
  const [pagHistorico, setPagHistorico] = useState(0)
  const [tamanhoHistorico, setTamanhoHistorico] = useState(TAMANHO_PAGINA_PADRAO)

  const ordenacao = sorting[0]
  const resumoQuery = useResumoAlertas()
  const alertasQuery = useAlertas(
    {
      tipo: filtroTipo === "Todos" ? undefined : filtroTipo,
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
    {},
    { pagina: pagHistorico, tamanho: tamanhoHistorico, ordenarPor: "criadoEm", ordem: "desc" },
  )
  const limiaresQuery = useLimiares()

  const tratar = useTratarAlerta()
  const gerar = useGerarAlertas()

  function aoTratar(alerta: Alerta, novoStatus: Alerta["status"]) {
    tratar.mutate(
      { id: alerta.id, status: novoStatus },
      {
        onSuccess: () => toast.success(`Alerta ${novoStatus === "Resolvido" ? "resolvido" : "em tratamento"}.`),
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
      accessorKey: "medicamentoNome",
      header: "Medicamento",
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="font-medium leading-tight">{row.original.medicamentoNome}</span>
          <span className="text-xs text-muted-foreground">{row.original.medicamentoCodigo}</span>
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
          <Button size="xs" variant="outline" disabled={tratar.isPending} onClick={() => aoTratar(a, "Em tratamento")}>
            <Wrench className="size-3" />
            Tratar
          </Button>
        ) : (
          <Button size="xs" variant="outline" disabled={tratar.isPending} onClick={() => aoTratar(a, "Resolvido")}>
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
        rf="RF-ALE"
        description="Alertas automáticos de risco de desabastecimento e de vencimento, com base nas previsões de demanda, configuração de limiares e direcionamento por perfil."
      />

      {/* KPIs */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores de alertas."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Alertas ativos" value={resumoQuery.data ? fmtNum(resumoQuery.data.ativos) : ""} carregando={resumoQuery.isPending} icon={BellRing} accent="danger" hint="abertos + em tratamento" rf="RF-ALE-04" />
          <KpiCard label="Desabastecimento iminente" value={resumoQuery.data ? fmtNum(resumoQuery.data.desabastecimento) : ""} carregando={resumoQuery.isPending} icon={PackageX} accent="danger" rf="RF-ALE-01" />
          <KpiCard label="Risco de vencimento" value={resumoQuery.data ? fmtNum(resumoQuery.data.vencimento) : ""} carregando={resumoQuery.isPending} icon={CalendarClock} accent="warning" rf="RF-ALE-02" />
          <KpiCard label="Tratados" value={resumoQuery.data ? fmtNum(resumoQuery.data.resolvidos) : ""} carregando={resumoQuery.isPending} icon={SlidersHorizontal} accent="success" hint="alertas resolvidos" rf="RF-ALE-05" />
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
            rf="RF-ALE-01 · RF-ALE-02"
            action={
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
                {ehGestor && (
                  <Button size="sm" variant="secondary" disabled={gerar.isPending} onClick={aoGerar}>
                    <RefreshCw className={gerar.isPending ? "size-3.5 animate-spin" : "size-3.5"} />
                    Gerar alertas
                  </Button>
                )}
              </div>
            }
          >
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
                  searchKey="medicamentoNome"
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
            rf="RF-ALE-03"
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
          <Section title="Histórico de alertas" rf="RF-ALE-05" description="Quantidade e tratamento dado a cada alerta emitido." noPadding>
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
