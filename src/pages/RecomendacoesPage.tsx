import { useState } from "react"
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  Ban,
  Boxes,
  BrainCircuit,
  CheckCheck,
  Coins,
  Plus,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { BarraFiltros, FiltroMedicamento, FiltroUnidade, SelectFiltro } from "@/components/shared/filtros"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import {
  ConfirmarAcaoRecomendacaoDialog,
  type AcaoRecomendacao,
} from "@/components/recomendacoes/ConfirmarAcaoRecomendacaoDialog"
import { TransferenciaFormDialog } from "@/components/recomendacoes/TransferenciaFormDialog"
import { Paginacao } from "@/components/shared/Paginacao"
import { TAMANHO_PAGINA_PADRAO } from "@/lib/paginacao"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAprovarRecomendacao,
  useExecutarRecomendacao,
  useGerarRecomendacoes,
  useRecomendacoes,
  useRecusarRecomendacao,
  useResumoRecomendacoes,
} from "@/hooks/use-recomendacoes"
import { usePerfil } from "@/context/auth"
import { podeGerir } from "@/lib/permissoes"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Recomendacao, StatusRecomendacao, TipoRecomendacao } from "@/lib/recomendacoes"
import { fmtMoeda, fmtNum } from "@/lib/format"
import { recomendacaoStatus } from "@/lib/status"

/** Opções do filtro de status da listagem. */
const STATUS_REC_OPCOES = [
  { valor: "Pendente", rotulo: "Pendente" },
  { valor: "Aprovada", rotulo: "Aprovada" },
  { valor: "Executada", rotulo: "Executada" },
  { valor: "Recusada", rotulo: "Recusada" },
]

function mensagemDeErro(erro: unknown): string {
  return erro instanceof ApiError ? erro.message : "Erro inesperado. Tente novamente."
}

function RecCard({
  r,
  ehGestor,
  onAprovar,
  onExecutar,
  onRecusar,
  onEditar,
  ocupada,
}: {
  r: Recomendacao
  ehGestor: boolean
  onAprovar: (r: Recomendacao) => void
  onExecutar: (r: Recomendacao) => void
  onRecusar: (r: Recomendacao) => void
  onEditar: (r: Recomendacao) => void
  ocupada: boolean
}) {
  // Cartões pendentes (para Gestor) são editáveis: clicar abre o modal de edição.
  const editavel = ehGestor && r.status === "Pendente"
  return (
    <Card
      className={cn("gap-3 p-4", editavel && "cursor-pointer transition-colors hover:border-primary/50")}
      onClick={editavel ? () => onEditar(r) : undefined}
      title={editavel ? "Clique para editar esta transferência" : undefined}
    >
      {/* Cabeçalho: identidade do item à esquerda, contexto (prioridade/motor) à direita */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={r.tipo === "Redistribuição" ? "secondary" : "outline"}>{r.tipo}</Badge>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">{r.prioridade}</Badge>
            {r.origemMotor === "Aprendizado de Máquina" ? (
              <Badge className="gap-1 bg-primary/15 text-primary text-[10px]"><BrainCircuit className="size-3" /> IA</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">Regras</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">{r.medicamentoCodigo}</Badge>
          <span className="font-medium leading-tight">{r.medicamentoNome}</span>
        </div>

        {/* Fluxo de movimentação como subtítulo limpo */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {r.unidadeOrigemSigla ? (
            <>
              <span className="font-medium text-foreground">{r.unidadeOrigemSigla}</span>
              <ArrowRight className="size-3.5 text-primary" />
              <span className="font-medium text-foreground">{r.unidadeDestinoSigla}</span>
            </>
          ) : (
            <>
              <Boxes className="size-3.5" />
              <span>Reposição</span>
              <ArrowRight className="size-3.5 text-primary" />
              <span className="font-medium text-foreground">{r.unidadeDestinoSigla}</span>
            </>
          )}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{r.justificativa}</p>

      {/* Bloco de métricas — dados quantitativos separados das ações */}
      <div className="grid grid-cols-3 gap-3 border-t pt-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Qtd requerida</p>
          <p className="tabular text-sm font-semibold">{fmtNum(r.quantidade)} un</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Economia prevista</p>
          <p className="tabular text-sm font-semibold text-success">{fmtMoeda(r.economiaEstimada)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
          <StatusBadge status={recomendacaoStatus[r.status]} label={r.status} />
        </div>
      </div>

      {/* Ações — isoladas do bloco numérico */}
      {ehGestor && (r.status === "Pendente" || r.status === "Aprovada") && (
        <div className="flex items-center justify-end gap-2 border-t pt-3">
          {r.status === "Pendente" && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={ocupada}
                onClick={(e) => {
                  e.stopPropagation()
                  onRecusar(r)
                }}
              >
                <Ban className="size-3.5" />
                Recusar
              </Button>
              <Button
                size="sm"
                disabled={ocupada}
                onClick={(e) => {
                  e.stopPropagation()
                  onAprovar(r)
                }}
              >
                <BadgeCheck className="size-3.5" />
                Aprovar
              </Button>
            </>
          )}
          {r.status === "Aprovada" && (
            <Button
              size="sm"
              variant="secondary"
              disabled={ocupada}
              onClick={(e) => {
                e.stopPropagation()
                onExecutar(r)
              }}
            >
              <CheckCheck className="size-3.5" />
              Executar
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default function RecomendacoesPage() {
  const perfil = usePerfil()
  // "Gestor ou Admin" — quem pode aprovar/executar recomendações.
  const ehGestor = podeGerir(perfil)

  const [filtroTipo, setFiltroTipo] = useState<"todas" | TipoRecomendacao>("todas")
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(undefined)
  const [unidadeId, setUnidadeId] = useState<string | undefined>(undefined)
  const [medicamentoId, setMedicamentoId] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(TAMANHO_PAGINA_PADRAO)

  const resumoQuery = useResumoRecomendacoes({ unidadeId, medicamentoId })
  const recomendacoesQuery = useRecomendacoes(
    {
      tipo: filtroTipo === "todas" ? undefined : filtroTipo,
      status: filtroStatus as StatusRecomendacao | undefined,
      unidadeId,
      medicamentoId,
    },
    { pagina, tamanho },
  )

  /** Mudou um filtro → volta à primeira página. */
  function aoFiltrarStatus(v: string | undefined) {
    setFiltroStatus(v)
    setPagina(0)
  }
  function aoFiltrarUnidade(v: string | undefined) {
    setUnidadeId(v)
    setPagina(0)
  }
  function aoFiltrarMedicamento(v: string | undefined) {
    setMedicamentoId(v)
    setPagina(0)
  }

  const aprovar = useAprovarRecomendacao()
  const executar = useExecutarRecomendacao()
  const recusar = useRecusarRecomendacao()
  const gerar = useGerarRecomendacoes()
  const ocupada = aprovar.isPending || executar.isPending || recusar.isPending

  // Ação (aprovar/executar/recusar) aguardando confirmação no modal (null = nenhum modal aberto).
  const [acaoPendente, setAcaoPendente] = useState<{ recomendacao: Recomendacao; acao: AcaoRecomendacao } | null>(null)
  // Modal de criar/editar transferência: aberto + recomendação em edição (null = criação).
  const [formAberto, setFormAberto] = useState(false)
  const [recEdicao, setRecEdicao] = useState<Recomendacao | null>(null)

  function aoAprovar(r: Recomendacao) {
    setAcaoPendente({ recomendacao: r, acao: "aprovar" })
  }

  function aoExecutar(r: Recomendacao) {
    setAcaoPendente({ recomendacao: r, acao: "executar" })
  }

  function aoRecusar(r: Recomendacao) {
    setAcaoPendente({ recomendacao: r, acao: "recusar" })
  }

  function aoEditar(r: Recomendacao) {
    setRecEdicao(r)
    setFormAberto(true)
  }

  function aoCriar() {
    setRecEdicao(null)
    setFormAberto(true)
  }

  const MUTACOES: Record<AcaoRecomendacao, { mutation: typeof aprovar; mensagem: string }> = {
    aprovar: { mutation: aprovar, mensagem: "Recomendação aprovada." },
    executar: { mutation: executar, mensagem: "Recomendação executada." },
    recusar: { mutation: recusar, mensagem: "Recomendação recusada." },
  }

  function confirmarAcao() {
    if (!acaoPendente) return
    const { recomendacao, acao } = acaoPendente
    const { mutation, mensagem } = MUTACOES[acao]
    mutation.mutate(recomendacao.id, {
      onSuccess: () => {
        toast.success(mensagem)
        setAcaoPendente(null)
      },
      onError: (erro) => toast.error(mensagemDeErro(erro)),
    })
  }

  function aoGerar() {
    gerar.mutate(undefined, {
      onSuccess: (resultado) => toast.success(resultado.mensagem),
      onError: (erro) => toast.error(mensagemDeErro(erro)),
    })
  }

  function mudarTipo(t: "todas" | TipoRecomendacao) {
    setFiltroTipo(t)
    setPagina(0)
  }

  const itens = recomendacoesQuery.data?.itens ?? []
  const total = recomendacoesQuery.data?.total ?? 0
  const totalPaginas = Math.ceil(total / tamanho)

  return (
    <>
      <PageHeader
        icon={<ArrowLeftRight className="size-5" />}
        title="Reposição & Redistribuição"
        info="Sugere o que comprar e como remanejar estoque entre unidades, com base na previsão de demanda — para reduzir compras de urgência e equilibrar os estoques críticos. Gestores aprovam e executam cada recomendação."
        description="Módulo de recomendação dimensionado pela previsão de demanda — reduz compras emergenciais e equilibra estoques críticos entre unidades."
      />

      <BarraFiltros>
        <FiltroUnidade valor={unidadeId} onChange={aoFiltrarUnidade} />
        <FiltroMedicamento valor={medicamentoId} onChange={aoFiltrarMedicamento} unidadeId={unidadeId} />
        <SelectFiltro
          label="Status"
          valor={filtroStatus}
          onChange={aoFiltrarStatus}
          opcoes={STATUS_REC_OPCOES}
          todosRotulo="Todos os status"
        />
      </BarraFiltros>

      {/* KPIs */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores de recomendações."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Recomendações pendentes" value={resumoQuery.data ? fmtNum(resumoQuery.data.pendentes) : ""} carregando={resumoQuery.isPending} icon={ArrowLeftRight} accent="warning" info="Quantidade de sugestões aguardando aprovação de um gestor." />
          <KpiCard label="Economia potencial" value={resumoQuery.data ? fmtMoeda(resumoQuery.data.economiaPotencial) : ""} carregando={resumoQuery.isPending} icon={Coins} accent="success" info="Quanto a rede pode economizar ao seguir estas recomendações. A economia existe porque comprar de forma programada sai mais barato: compras de urgência pagam frete e preços maiores. Planejar a reposição com antecedência reduz esse custo extra." />
          <KpiCard label="Geradas por IA" value={resumoQuery.data ? fmtNum(resumoQuery.data.geradasPorIA) : ""} carregando={resumoQuery.isPending} icon={BrainCircuit} accent="primary" hint="evolução de regras → IA" info="Quantas recomendações foram criadas por inteligência artificial, e não apenas por regras fixas." />
          <KpiCard label="Taxa de adesão" value={resumoQuery.data ? `${resumoQuery.data.taxaAdesao}%` : ""} carregando={resumoQuery.isPending} icon={BadgeCheck} accent="teal" hint="aprovadas + executadas" info="Percentual de recomendações que foram aprovadas ou executadas — indica o quanto as sugestões estão sendo aproveitadas." />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs value={filtroTipo} onValueChange={(v) => mudarTipo(v as "todas" | TipoRecomendacao)}>
              <TabsList>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="Reposição">Reposição</TabsTrigger>
                <TabsTrigger value="Redistribuição">Redistribuição</TabsTrigger>
              </TabsList>
            </Tabs>
            {ehGestor && (
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={gerar.isPending} onClick={aoGerar}>
                  <RefreshCw className={gerar.isPending ? "size-4 animate-spin" : "size-4"} />
                  Gerar recomendações
                </Button>
                <Button onClick={aoCriar}>
                  <Plus className="size-4" />
                  Criar transferência
                </Button>
              </div>
            )}
          </div>

          {recomendacoesQuery.isError ? (
            <ErroConsulta
              mensagem="Não foi possível carregar as recomendações."
              onTentarNovamente={() => recomendacoesQuery.refetch()}
            />
          ) : !recomendacoesQuery.data ? (
            <div className="flex justify-center py-20">
              <Spinner size={40} label="Carregando recomendações" />
            </div>
          ) : itens.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Nenhuma recomendação para este filtro.
            </p>
          ) : (
            <AreaAtualizavel atualizando={recomendacoesQuery.isFetching}>
              <div className="grid gap-3 md:grid-cols-2">
                {itens.map((r) => (
                  <RecCard
                    key={r.id}
                    r={r}
                    ehGestor={ehGestor}
                    onAprovar={aoAprovar}
                    onExecutar={aoExecutar}
                    onRecusar={aoRecusar}
                    onEditar={aoEditar}
                    ocupada={ocupada}
                  />
                ))}
              </div>
              <div className="pt-4">
                <Paginacao
                  paginaAtual={pagina}
                  totalPaginas={totalPaginas}
                  onMudarPagina={setPagina}
                  tamanhoPagina={tamanho}
                  onMudarTamanho={(t) => {
                    setTamanho(t)
                    setPagina(0)
                  }}
                  totalRegistros={total}
                />
              </div>
            </AreaAtualizavel>
          )}
        </div>

        {/* Desempenho do módulo (RF-REC-05) — dados ilustrativos (sem endpoint dedicado). */}
        <Section
          className="lg:col-span-1 h-fit"
          title="Desempenho do módulo"
          info="Acompanha a qualidade do módulo: o quanto as recomendações têm acertado, quantas redistribuições foram aceitas e a cobertura por regras e por inteligência artificial."
          description="Acompanhamento e auditoria."
          action={
            <Badge variant="outline" className="border-warning/40 bg-warning/10 text-[10px] text-warning">
              Dados ilustrativos
            </Badge>
          }
        >
          {/* NOTA: métricas ilustrativas (mock) — não há endpoint que sirva assertividade /
              redistribuições aceitas / cobertura. Fora do escopo da Fase 5 (ver ROADMAP). */}
          <div className="space-y-4">
            {[
              { l: "Assertividade das recomendações", v: 87, c: "var(--chart-4)" },
              { l: "Redistribuições aceitas", v: 72, c: "var(--chart-2)" },
              { l: "Cobertura por regras", v: 60, c: "var(--chart-1)" },
              { l: "Cobertura assistida por IA", v: 40, c: "var(--chart-3)" },
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
              Regras configuráveis em produção; transição assistida por inteligência artificial em curso.
            </div>
          </div>
        </Section>
      </div>

      <ConfirmarAcaoRecomendacaoDialog
        aberto={acaoPendente !== null}
        onOpenChange={(aberto) => {
          // Não fecha por clique fora/Esc enquanto a mutação está em andamento.
          if (!aberto && !ocupada) setAcaoPendente(null)
        }}
        recomendacao={acaoPendente?.recomendacao ?? null}
        acao={acaoPendente?.acao ?? "aprovar"}
        onConfirmar={confirmarAcao}
        processando={ocupada}
      />

      <TransferenciaFormDialog
        open={formAberto}
        onOpenChange={setFormAberto}
        recomendacao={recEdicao}
      />
    </>
  )
}
