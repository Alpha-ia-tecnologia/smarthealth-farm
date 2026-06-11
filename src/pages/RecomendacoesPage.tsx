import { useState } from "react"
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  Boxes,
  BrainCircuit,
  CheckCheck,
  Coins,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AreaAtualizavel } from "@/components/shared/AreaAtualizavel"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
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
  useResumoRecomendacoes,
} from "@/hooks/use-recomendacoes"
import { usePerfil } from "@/context/auth"
import { ApiError } from "@/lib/api"
import type { Recomendacao, TipoRecomendacao } from "@/lib/recomendacoes"
import { fmtMoeda, fmtNum } from "@/lib/format"

const statusMap = { Pendente: "atencao", Aprovada: "info", Executada: "ok" } as const

function mensagemDeErro(erro: unknown): string {
  return erro instanceof ApiError ? erro.message : "Erro inesperado. Tente novamente."
}

function RecCard({
  r,
  ehGestor,
  onAprovar,
  onExecutar,
  ocupada,
}: {
  r: Recomendacao
  ehGestor: boolean
  onAprovar: (r: Recomendacao) => void
  onExecutar: (r: Recomendacao) => void
  ocupada: boolean
}) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between">
        <Badge variant={r.tipo === "Redistribuição" ? "secondary" : "outline"}>{r.tipo}</Badge>
        <div className="flex items-center gap-2">
          {r.origemMotor === "Aprendizado de Máquina" ? (
            <Badge className="gap-1 bg-primary/15 text-primary text-[10px]"><BrainCircuit className="size-3" /> IA</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Regras</Badge>
          )}
          <Badge variant="outline" className="text-[10px]">{r.prioridade}</Badge>
        </div>
      </div>

      <div className="text-sm">
        <span className="flex flex-col">
          <span className="font-medium leading-tight">{r.medicamentoNome}</span>
          <span className="text-xs text-muted-foreground">{r.medicamentoCodigo}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
        {r.unidadeOrigemSigla ? (
          <>
            <span className="font-medium">{r.unidadeOrigemSigla}</span>
            <ArrowRight className="size-3.5 text-primary" />
            <span className="font-medium">{r.unidadeDestinoSigla}</span>
          </>
        ) : (
          <>
            <Boxes className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Reposição →</span>
            <span className="font-medium">{r.unidadeDestinoSigla}</span>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{r.justificativa}</p>

      <div className="flex items-center justify-between border-t pt-3">
        <div>
          <p className="tabular text-sm font-semibold">{fmtNum(r.quantidade)} un</p>
          <p className="text-[11px] text-success">economia {fmtMoeda(r.economiaEstimada)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={statusMap[r.status]} label={r.status} />
          {ehGestor && r.status === "Pendente" && (
            <Button size="sm" disabled={ocupada} onClick={() => onAprovar(r)}>
              <BadgeCheck className="size-3.5" />
              Aprovar
            </Button>
          )}
          {ehGestor && r.status === "Aprovada" && (
            <Button size="sm" variant="secondary" disabled={ocupada} onClick={() => onExecutar(r)}>
              <CheckCheck className="size-3.5" />
              Executar
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function RecomendacoesPage() {
  const perfil = usePerfil()
  const ehGestor = perfil === "Gestor"

  const [filtroTipo, setFiltroTipo] = useState<"todas" | TipoRecomendacao>("todas")
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(TAMANHO_PAGINA_PADRAO)

  const resumoQuery = useResumoRecomendacoes()
  const recomendacoesQuery = useRecomendacoes(
    { tipo: filtroTipo === "todas" ? undefined : filtroTipo },
    { pagina, tamanho },
  )

  const aprovar = useAprovarRecomendacao()
  const executar = useExecutarRecomendacao()
  const gerar = useGerarRecomendacoes()
  const ocupada = aprovar.isPending || executar.isPending

  function aoAprovar(r: Recomendacao) {
    aprovar.mutate(r.id, {
      onSuccess: () => toast.success("Recomendação aprovada."),
      onError: (erro) => toast.error(mensagemDeErro(erro)),
    })
  }

  function aoExecutar(r: Recomendacao) {
    executar.mutate(r.id, {
      onSuccess: () => toast.success("Recomendação executada."),
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
        rf="RF-REC"
        description="Módulo de recomendação dimensionado pela previsão de demanda — reduz compras emergenciais e equilibra estoques críticos entre unidades."
        actions={
          ehGestor && (
            <Button variant="outline" disabled={gerar.isPending} onClick={aoGerar}>
              <RefreshCw className={gerar.isPending ? "size-4 animate-spin" : "size-4"} />
              Gerar recomendações
            </Button>
          )
        }
      />

      {/* KPIs */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores de recomendações."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Recomendações pendentes" value={resumoQuery.data ? fmtNum(resumoQuery.data.pendentes) : ""} carregando={resumoQuery.isPending} icon={ArrowLeftRight} accent="warning" rf="RF-REC-01" />
          <KpiCard label="Economia potencial" value={resumoQuery.data ? fmtMoeda(resumoQuery.data.economiaPotencial) : ""} carregando={resumoQuery.isPending} icon={Coins} accent="success" rf="RF-REC-02" />
          <KpiCard label="Geradas por IA" value={resumoQuery.data ? fmtNum(resumoQuery.data.geradasPorIA) : ""} carregando={resumoQuery.isPending} icon={BrainCircuit} accent="primary" hint="evolução de regras → IA" rf="RF-REC-03" />
          <KpiCard label="Taxa de adesão" value={resumoQuery.data ? `${resumoQuery.data.taxaAdesao}%` : ""} carregando={resumoQuery.isPending} icon={BadgeCheck} accent="teal" hint="aprovadas + executadas" rf="RF-REC-05" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <Tabs value={filtroTipo} onValueChange={(v) => mudarTipo(v as "todas" | TipoRecomendacao)}>
              <TabsList>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="Reposição">Reposição</TabsTrigger>
                <TabsTrigger value="Redistribuição">Redistribuição</TabsTrigger>
              </TabsList>
            </Tabs>
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
          rf="RF-REC-05"
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
              Regras configuráveis em produção; transição assistida por inteligência artificial em curso (RF-REC-03).
            </div>
          </div>
        </Section>
      </div>
    </>
  )
}
