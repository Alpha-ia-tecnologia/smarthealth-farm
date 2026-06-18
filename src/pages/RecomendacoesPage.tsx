import { type Ref, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
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
import { BotaoAnaliseIa } from "@/components/shared/BotaoAnaliseIa"
import { PaginaIaInsight } from "@/components/shared/PaginaIaInsight"
import { GraficoInsightDialog } from "@/components/shared/GraficoInsightDialog"
import { MapaRede } from "@/components/charts/MapaRede"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { BarraFiltros, FiltroInsumo, FiltroUnidade, SelectFiltro } from "@/components/shared/filtros"
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
import { usePainelOperacional } from "@/hooks/use-painel"
import { useUnidades } from "@/hooks/use-unidades"
import { estoqueApi } from "@/lib/estoque"
import type { PontoMapa } from "@/components/charts/MapaRede"
import {
  SugestaoRemanejamentoIa,
  type UnidadeInsumo,
} from "@/components/charts/SugestaoRemanejamentoIa"
import { usePerfil } from "@/context/auth"
import { podeGerir } from "@/lib/permissoes"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import type {
  Recomendacao,
  ResumoRecomendacoes,
  StatusRecomendacao,
  TipoRecomendacao,
} from "@/lib/recomendacoes"
import { mensagensAnalise } from "@/lib/ia-prompts"
import { fmtMoeda, fmtNum } from "@/lib/format"
import { recomendacaoStatus } from "@/lib/status"

/** Corpo da análise por IA das recomendações: resumo + as pendentes em destaque. */
function corpoRecomendacoes(resumo: ResumoRecomendacoes, itens: Recomendacao[]): string {
  const pendentes = itens.filter((r) => r.status === "Pendente").slice(0, 6)
  const lista = pendentes
    .map(
      (r) =>
        `- ${r.tipo} de ${r.insumoNome} (${fmtNum(r.quantidade)} un) ` +
        `${r.unidadeOrigemSigla ? `${r.unidadeOrigemSigla}→` : ""}${r.unidadeDestinoSigla}: ` +
        `economia ${fmtMoeda(r.economiaEstimada)}, prioridade ${r.prioridade}, origem ${r.origemMotor}`,
    )
    .join("\n")
  return (
    `Analise as recomendações de reposição/redistribuição da rede e oriente a decisão do gestor. ` +
    `Aponte: (1) o que priorizar na aprovação, (2) o impacto/economia, (3) riscos a observar.\n\n` +
    `Resumo: ${resumo.pendentes} pendentes, economia potencial ${fmtMoeda(resumo.economiaPotencial)}, ` +
    `${resumo.geradasPorIA} geradas por IA, taxa de adesão ${resumo.taxaAdesao}%.\n\n` +
    `Pendentes em destaque:\n${lista || "—"}`
  )
}

function corpoPendentes(resumo: ResumoRecomendacoes): string {
  return (
    `Analise o volume de recomendações aguardando aprovação.\n\n` +
    `Recomendações pendentes: ${fmtNum(resumo.pendentes)}.\n\n` +
    `Qual o impacto de acumular um grande número de recomendações pendentes e quais ações gerenciais devem ser tomadas para dar vazão a essa fila?`
  )
}

function corpoEconomia(resumo: ResumoRecomendacoes): string {
  return (
    `Analise o potencial de economia gerado pelas recomendações.\n\n` +
    `Economia potencial estimada: ${fmtMoeda(resumo.economiaPotencial)}.\n\n` +
    `Comente sobre a importância desse planejamento para a sustentabilidade da rede e recomende práticas para maximizar ainda mais a economia (como evitar fretes emergenciais).`
  )
}

function corpoGeradasIA(resumo: ResumoRecomendacoes): string {
  return (
    `Analise o volume de sugestões logísticas originadas por Inteligência Artificial.\n\n` +
    `Geradas por IA: ${fmtNum(resumo.geradasPorIA)}.\n\n` +
    `O que a transição das recomendações baseadas em regras fixas para modelos de aprendizado de máquina traz de benefício para a rede hospitalar em termos de agilidade e assertividade?`
  )
}

function corpoAdesao(resumo: ResumoRecomendacoes): string {
  return (
    `Analise a taxa de adesão (aprovações e execuções) do sistema de recomendações pela equipe.\n\n` +
    `Taxa de adesão: ${resumo.taxaAdesao}%.\n\n` +
    `Avalie o nível de engajamento da equipe logística e proponha formas de aumentar a confiança e a adesão às sugestões de remanejamento geradas.`
  )
}

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
  destacado,
  innerRef,
}: {
  r: Recomendacao
  ehGestor: boolean
  onAprovar: (r: Recomendacao) => void
  onExecutar: (r: Recomendacao) => void
  onRecusar: (r: Recomendacao) => void
  onEditar: (r: Recomendacao) => void
  ocupada: boolean
  /** Cartão alvo (veio do "Avaliar" do painel): ganha realce visual. */
  destacado?: boolean
  /** Ref no cartão alvo, para rolar a tela até ele. */
  innerRef?: Ref<HTMLDivElement>
}) {
  // Cartões pendentes (para Gestor) são editáveis: clicar abre o modal de edição.
  const editavel = ehGestor && r.status === "Pendente"
  return (
    <Card
      ref={innerRef}
      className={cn(
        "gap-3 p-4 transition-shadow",
        editavel && "cursor-pointer transition-colors hover:border-primary/50",
        destacado && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
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
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">{r.insumoCodigo}</Badge>
          <span className="font-medium leading-tight">{r.insumoNome}</span>
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

  const [dialogOp, setDialogOp] = useState<string | null>(null)

  const [filtroTipo, setFiltroTipo] = useState<"todas" | TipoRecomendacao>("todas")
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(undefined)
  const [unidadeId, setUnidadeId] = useState<string | undefined>(undefined)
  const [insumoId, setInsumoId] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(TAMANHO_PAGINA_PADRAO)

  const resumoQuery = useResumoRecomendacoes({ unidadeId, insumoId })

  // Mapa da rede — a cor representa a condição do estoque por unidade. Sem insumo: condição geral
  // (painel operacional). Com insumo: estoque DESSE insumo por unidade (posições de estoque).
  const unidadesQuery = useUnidades()
  const painelOpQuery = usePainelOperacional()
  const posicoesInsumoQuery = useQuery({
    queryKey: ["estoque", "mapa-insumo", insumoId],
    queryFn: () => estoqueApi.listarPosicoes({ insumoId }, { tamanho: 50 }),
    enabled: Boolean(insumoId),
  })

  const recomendacoesQuery = useRecomendacoes(
    {
      tipo: filtroTipo === "todas" ? undefined : filtroTipo,
      status: filtroStatus as StatusRecomendacao | undefined,
      unidadeId,
      insumoId,
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
  function aoFiltrarInsumo(v: string | undefined) {
    setInsumoId(v)
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

  const itens = useMemo(() => recomendacoesQuery.data?.itens ?? [], [recomendacoesQuery.data])
  const total = recomendacoesQuery.data?.total ?? 0
  const totalPaginas = Math.ceil(total / tamanho)

  // "Avaliar" no painel operacional chega aqui com ?rec=<id>: realça o cartão e rola até ele,
  // poupando o usuário de procurar a transferência na lista.
  const [searchParams, setSearchParams] = useSearchParams()
  const [destaqueId] = useState<string | undefined>(() => searchParams.get("rec") ?? undefined)
  const cardDestaqueRef = useRef<HTMLDivElement>(null)
  const rolouRef = useRef(false)

  // Consome o param da URL (evita re-rolar a cada refetch/refresh); o realce vive em `destaqueId`.
  useEffect(() => {
    if (!searchParams.has("rec")) return
    searchParams.delete("rec")
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Quando o cartão alvo aparece na página atual, rola até ele uma única vez (respeita reduced-motion).
  useEffect(() => {
    if (!destaqueId || rolouRef.current) return
    if (!itens.some((r) => r.id === destaqueId)) return
    rolouRef.current = true
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    cardDestaqueRef.current?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "center" })
  }, [destaqueId, itens])

  // Pontos do mapa: por insumo (posições) quando há filtro de insumo; senão, condição geral.
  const pontosMapa: PontoMapa[] = useMemo(() => {
    const porId = new Map((unidadesQuery.data ?? []).map((u) => [u.id, u]))
    if (insumoId) {
      return (posicoesInsumoQuery.data?.itens ?? []).flatMap((p) => {
        const u = porId.get(p.unidadeId)
        if (!u || u.hub) return []
        return [
          {
            unidadeId: p.unidadeId,
            sigla: p.unidadeSigla,
            nome: p.unidadeNome,
            municipio: u.municipio,
            status: p.status,
            detalhes: [
              { rotulo: "Em estoque", valor: `${fmtNum(p.quantidade)} un` },
              { rotulo: "Nível crítico", valor: fmtNum(p.nivelCritico) },
              { rotulo: "Estoque máximo", valor: fmtNum(p.estoqueMaximo) },
              { rotulo: "Consumo/dia", valor: fmtNum(p.consumoMedioDiario) },
            ],
          },
        ]
      })
    }
    return (painelOpQuery.data?.unidades ?? []).map((u) => ({
      unidadeId: u.unidadeId,
      sigla: u.sigla,
      nome: u.nome,
      municipio: u.municipio,
      status: u.statusUnidade,
      detalhes: [
        { rotulo: "Cobertura", valor: `${u.cobertura}%` },
        { rotulo: "Itens críticos", valor: fmtNum(u.criticos) },
        { rotulo: "Alertas ativos", valor: fmtNum(u.alertasAtivos) },
        { rotulo: "Conectividade", valor: u.conectividade },
      ],
    }))
  }, [insumoId, unidadesQuery.data, posicoesInsumoQuery.data, painelOpQuery.data])

  const mapaErro = unidadesQuery.isError || (insumoId ? posicoesInsumoQuery.isError : painelOpQuery.isError)
  const mapaCarregando =
    unidadesQuery.isPending || (insumoId ? posicoesInsumoQuery.isPending : painelOpQuery.isPending)

  // Dados do insumo por unidade (números crus) p/ a sugestão de remanejamento por IA abaixo do mapa.
  const unidadesInsumo: UnidadeInsumo[] = useMemo(() => {
    if (!insumoId) return []
    const porId = new Map((unidadesQuery.data ?? []).map((u) => [u.id, u]))
    return (posicoesInsumoQuery.data?.itens ?? []).flatMap((p) => {
      const u = porId.get(p.unidadeId)
      if (!u || u.hub) return []
      return [
        {
          sigla: p.unidadeSigla,
          municipio: u.municipio,
          status: p.status,
          quantidade: p.quantidade,
          nivelCritico: p.nivelCritico,
          consumoMedioDiario: p.consumoMedioDiario,
        },
      ]
    })
  }, [insumoId, unidadesQuery.data, posicoesInsumoQuery.data])
  const insumoNomeMapa = posicoesInsumoQuery.data?.itens[0]?.insumoNome ?? "o insumo selecionado"

  return (
    <>
      <PageHeader
        icon={<ArrowLeftRight className="size-5" />}
        title="Reposição & Redistribuição"
        info="Sugere o que comprar e como remanejar estoque entre unidades, com base na previsão de demanda — para reduzir compras de urgência e equilibrar os estoques críticos. Gestores aprovam e executam cada recomendação."
        description="Módulo de recomendação dimensionado pela previsão de demanda — reduz compras emergenciais e equilibra estoques críticos entre unidades."
        actions={
          resumoQuery.data ? (
            <PaginaIaInsight
              rotulo="Recomendações"
              titulo="Análise das recomendações"
              descricao="Leitura por IA das recomendações pendentes para apoiar a decisão do gestor."
              mensagens={mensagensAnalise(corpoRecomendacoes(resumoQuery.data, itens))}
            />
          ) : undefined
        }
      />

      <BarraFiltros>
        <FiltroUnidade valor={unidadeId} onChange={aoFiltrarUnidade} />
        <FiltroInsumo valor={insumoId} onChange={aoFiltrarInsumo} unidadeId={unidadeId} />
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
          <KpiCard label="Recomendações pendentes" value={resumoQuery.data ? fmtNum(resumoQuery.data.pendentes) : ""} carregando={resumoQuery.isPending} icon={ArrowLeftRight} accent="warning" info="Quantidade de sugestões aguardando aprovação de um gestor." action={resumoQuery.data ? <BotaoAnaliseIa rotulo="Pendentes" onClick={() => setDialogOp("pendentes")} /> : undefined} />
          <KpiCard label="Economia potencial" value={resumoQuery.data ? fmtMoeda(resumoQuery.data.economiaPotencial) : ""} carregando={resumoQuery.isPending} icon={Coins} accent="success" info="Quanto a rede pode economizar ao seguir estas recomendações. A economia existe porque comprar de forma programada sai mais barato: compras de urgência pagam frete e preços maiores. Planejar a reposição com antecedência reduz esse custo extra." action={resumoQuery.data ? <BotaoAnaliseIa rotulo="Economia" onClick={() => setDialogOp("economia")} /> : undefined} />
          <KpiCard label="Geradas por IA" value={resumoQuery.data ? fmtNum(resumoQuery.data.geradasPorIA) : ""} carregando={resumoQuery.isPending} icon={BrainCircuit} accent="primary" hint="evolução de regras → IA" info="Quantas recomendações foram criadas por inteligência artificial, e não apenas por regras fixas." action={resumoQuery.data ? <BotaoAnaliseIa rotulo="Iniciativas de IA" onClick={() => setDialogOp("ia")} /> : undefined} />
          <KpiCard label="Taxa de adesão" value={resumoQuery.data ? `${resumoQuery.data.taxaAdesao}%` : ""} carregando={resumoQuery.isPending} icon={BadgeCheck} accent="teal" hint="aprovadas + executadas" info="Percentual de recomendações que foram aprovadas ou executadas — indica o quanto as sugestões estão sendo aproveitadas." action={resumoQuery.data ? <BotaoAnaliseIa rotulo="Adesão" onClick={() => setDialogOp("adesao")} /> : undefined} />
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
                    destacado={r.id === destaqueId}
                    innerRef={r.id === destaqueId ? cardDestaqueRef : undefined}
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

        <div className="space-y-6 lg:col-span-1">
        {/* Mapa da rede — condição de estoque por unidade (RF-DASH-02 / RF-REC). */}
        <Section
          className="h-fit"
          title="Mapa da rede"
          info="Mostra cada unidade da rede no mapa do Maranhão. A cor do marcador indica a condição do estoque (adequado, atenção ou crítico). Ao filtrar por um insumo, o mapa passa a mostrar a condição daquele insumo em cada unidade. Passe o cursor para ver os detalhes e clique num marcador para filtrar por aquela unidade."
          description={
            insumoId
              ? "Estoque do insumo selecionado, por unidade. Cursor para detalhes; clique para filtrar."
              : "Condição geral do estoque por unidade. Cursor para detalhes; clique para filtrar."
          }
        >
          {mapaErro ? (
            <ErroConsulta
              mensagem="Não foi possível carregar o mapa da rede."
              onTentarNovamente={() => {
                unidadesQuery.refetch()
                painelOpQuery.refetch()
                posicoesInsumoQuery.refetch()
              }}
            />
          ) : mapaCarregando ? (
            <div className="flex justify-center py-16">
              <Spinner size={40} label="Carregando mapa" />
            </div>
          ) : pontosMapa.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sem dados de estoque para o mapa.
            </p>
          ) : (
            <>
              <MapaRede
                pontos={pontosMapa}
                unidadeSelecionadaId={unidadeId}
                onSelecionar={aoFiltrarUnidade}
              />
              {insumoId && unidadesInsumo.length > 0 && (
                <SugestaoRemanejamentoIa
                  key={insumoId}
                  insumoNome={insumoNomeMapa}
                  unidades={unidadesInsumo}
                />
              )}
            </>
          )}
        </Section>

        {/* Desempenho do módulo (RF-REC-05) — dados ilustrativos (sem endpoint dedicado). */}
        <Section
          className="h-fit"
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

      {resumoQuery.data && (
        <>
          <GraficoInsightDialog
            aberto={dialogOp === "pendentes"}
            onOpenChange={(a) => setDialogOp(a ? "pendentes" : null)}
            titulo="Recomendações pendentes — análise por IA"
            descricao="Avaliação do gargalo de aprovações logísticas."
            mensagens={mensagensAnalise(corpoPendentes(resumoQuery.data))}
            chave="rec-pend"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "economia"}
            onOpenChange={(a) => setDialogOp(a ? "economia" : null)}
            titulo="Economia potencial — análise por IA"
            descricao="Análise dos impactos financeiros da repriorização de estoques."
            mensagens={mensagensAnalise(corpoEconomia(resumoQuery.data))}
            chave="rec-econ"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "ia"}
            onOpenChange={(a) => setDialogOp(a ? "ia" : null)}
            titulo="Geradas por IA — análise por IA"
            descricao="Otimização do trabalho humano via aprendizado de máquina."
            mensagens={mensagensAnalise(corpoGeradasIA(resumoQuery.data))}
            chave="rec-ia"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "adesao"}
            onOpenChange={(a) => setDialogOp(a ? "adesao" : null)}
            titulo="Taxa de adesão — análise por IA"
            descricao="Engajamento humano e aceitação das recomendações."
            mensagens={mensagensAnalise(corpoAdesao(resumoQuery.data))}
            chave="rec-adesao"
          />
        </>
      )}
    </>
  )
}
