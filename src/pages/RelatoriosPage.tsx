import { useState } from "react"
import {
  BadgeCheck,
  BellRing,
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Filter,
  PackageX,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { PaginaIaInsight } from "@/components/shared/PaginaIaInsight"
import { BotaoAnaliseIa } from "@/components/shared/BotaoAnaliseIa"
import { GraficoInsightDialog } from "@/components/shared/GraficoInsightDialog"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePainelGerencial } from "@/hooks/use-painel"
import { useResumoIndicadores } from "@/hooks/use-indicadores"
import { useUnidades } from "@/hooks/use-unidades"
import type { TotaisRede } from "@/lib/painel"
import type { ResumoIndicadores } from "@/lib/indicadores"
import { mensagensAnalise } from "@/lib/ia-prompts"
import { fmtMoeda, fmtNum } from "@/lib/format"

/** Corpo do resumo executivo por IA: metas do projeto + situação consolidada da rede. */
function corpoRelatorio(totais: TotaisRede, resumoInd: ResumoIndicadores): string {
  return (
    `Escreva um resumo executivo para a direção da EMSERH sobre a gestão da cadeia farmacêutica ` +
    `da CAHOSP. Em 3 a 4 frases: (1) o estado geral (metas e riscos), (2) os números-chave, ` +
    `(3) a recomendação principal.\n\n` +
    `Metas do projeto: ${resumoInd.atingidas}/${resumoInd.total} atingidas, ` +
    `${resumoInd.emProgresso} em progresso.\n` +
    `Rede: ${fmtNum(totais.itensCriticos)} itens críticos, ${fmtNum(totais.alertasAtivos)} alertas ` +
    `ativos (${totais.alertasDesabastecimento} de desabastecimento, ${totais.alertasVencimento} de ` +
    `vencimento), ${totais.recomendacoesPendentes} recomendações pendentes, economia potencial ` +
    `${fmtMoeda(totais.economiaPotencial)}.`
  )
}

function corpoMetas(resumoInd: ResumoIndicadores): string {
  return (
    `Analise o progresso das metas do projeto (OPED).\n\n` +
    `Metas atingidas: ${resumoInd.atingidas} de ${resumoInd.total} (${resumoInd.emProgresso} em progresso).\n\n` +
    `O que esse nível de atingimento de metas sugere sobre a maturidade do projeto e onde a gestão deve focar seus esforços agora?`
  )
}

function corpoEconomiaRel(totais: TotaisRede): string {
  return (
    `Analise a economia potencial geral do projeto.\n\n` +
    `Economia potencial: ${fmtMoeda(totais.economiaPotencial)}.\n\n` +
    `Resuma de forma executiva como a plataforma tem atuado para gerar essa economia e qual a importância de aprovar rapidamente as recomendações para efetivá-la.`
  )
}

function corpoCriticosRel(totais: TotaisRede): string {
  return (
    `Faça um resumo executivo sobre a criticidade da rede.\n\n` +
    `Itens críticos: ${fmtNum(totais.itensCriticos)}.\n\n` +
    `Qual o risco estratégico de ter esse volume de itens em nível crítico e como a EMSERH pode atuar em nível macro para resolver isso?`
  )
}

function corpoAlertasRel(totais: TotaisRede): string {
  return (
    `Faça um resumo executivo sobre os alertas operacionais ativos.\n\n` +
    `Alertas ativos: ${fmtNum(totais.alertasAtivos)} (${fmtNum(totais.alertasDesabastecimento)} de desabastecimento, ${fmtNum(totais.alertasVencimento)} de vencimento).\n\n` +
    `Quais as implicações para a operação da rede se esses alertas não forem tratados com rapidez e que mensagem a direção deve passar aos operadores?`
  )
}

/** Categorias de insumo (enum de domínio) — opções do filtro. */
const CATEGORIAS = [
  "Antibióticos",
  "Analgésicos",
  "Antivirais",
  "Cardiovascular",
  "Soros e Vacinas",
  "Insumos Médicos",
  "Saúde Mental",
  "Antiparasitários",
]

const PERIODOS = ["Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses"]

/** Catálogo de relatórios — ilustrativo (não há endpoint de geração/export). */
const RELATORIOS = [
  { id: "r1", nome: "Relatório Estratégico CAHOSP — 2º Trimestre", desc: "Visão consolidada para a direção da EMSERH: desabastecimentos, perdas, compras e assertividade.", tipo: "Estratégico" },
  { id: "r2", nome: "Demanda prevista por categoria de insumo", desc: "Projeção de consumo dos próximos 3 meses por categoria e unidade.", tipo: "Tático" },
  { id: "r3", nome: "Lotes e rastreabilidade sanitária", desc: "Movimentação por lote para controle sanitário e auditoria.", tipo: "Operacional" },
  { id: "r4", nome: "Indicadores vs. linha de base", desc: "Comparativo das metas do projeto frente ao baseline consolidado.", tipo: "Estratégico" },
]

/** Marcos do projeto (OPED) — ilustrativo (não há endpoint de progresso). */
const MARCOS = [
  { fase: "Ingestão e anonimização da base histórica", status: "concluido", pct: 100 },
  { fase: "Calibração dos modelos de previsão", status: "concluido", pct: 100 },
  { fase: "Geração automática de previsões em produção", status: "andamento", pct: 78 },
  { fase: "Módulo de redistribuição assistido por IA", status: "andamento", pct: 45 },
  { fase: "Integração plena com sistemas EMSERH", status: "andamento", pct: 60 },
  { fase: "Operação em paralelo (piloto)", status: "pendente", pct: 15 },
]

export default function RelatoriosPage() {
  const painelQuery = usePainelGerencial()
  const resumoIndQuery = useResumoIndicadores()
  const unidadesQuery = useUnidades()

  const [dialogOp, setDialogOp] = useState<string | null>(null)

  const totais = painelQuery.data?.totais
  const resumoInd = resumoIndQuery.data
  const erroResumo = painelQuery.isError || resumoIndQuery.isError
  const unidadesAtendidas = (unidadesQuery.data ?? []).filter((u) => !u.hub).map((u) => u.sigla)

  return (
    <>
      <PageHeader
        icon={<FileBarChart className="size-5" />}
        title="Relatórios & Visualização"
        info="Reúne relatórios executivos para a direção, acompanha o progresso do projeto e permite baixar os dados em planilha ou PDF."
        description="Relatórios estratégicos para a direção da EMSERH, painel de progresso do projeto (OPED) e exportação em formatos estruturados."
        actions={
          <>
            {totais && resumoInd && (
              <PaginaIaInsight
                rotulo="Relatórios"
                titulo="Resumo executivo por IA"
                descricao="Síntese do estado da rede e das metas para a direção da EMSERH."
                mensagens={mensagensAnalise(corpoRelatorio(totais, resumoInd))}
              />
            )}
            <Button variant="outline" onClick={() => toast.success("Exportando planilha…")}><FileSpreadsheet className="size-4" /> Planilha</Button>
            <Button onClick={() => toast.success("Gerando PDF…")}><FileText className="size-4" /> PDF</Button>
          </>
        }
      />

      {/* Resumo executivo (real) — compõe /painel + /indicadores */}
      {erroResumo ? (
        <ErroConsulta
          mensagem="Não foi possível carregar o resumo executivo."
          onTentarNovamente={() => {
            painelQuery.refetch()
            resumoIndQuery.refetch()
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Metas atingidas" value={resumoInd ? `${resumoInd.atingidas}/${resumoInd.total}` : ""} carregando={resumoIndQuery.isPending} icon={BadgeCheck} accent="success" info="Quantas metas do projeto já foram alcançadas em relação ao total acompanhado." footer={resumoInd ? <div className="flex justify-end"><BotaoAnaliseIa rotulo="Metas" onClick={() => setDialogOp("metas")} /></div> : undefined} />
          <KpiCard label="Economia potencial" value={totais ? fmtMoeda(totais.economiaPotencial) : ""} carregando={painelQuery.isPending} icon={Coins} accent="teal" info="Valor que pode ser economizado seguindo as recomendações de redistribuição e compra." footer={totais ? <div className="flex justify-end"><BotaoAnaliseIa rotulo="Economia" onClick={() => setDialogOp("economia")} /></div> : undefined} />
          <KpiCard label="Itens críticos" value={totais ? fmtNum(totais.itensCriticos) : ""} carregando={painelQuery.isPending} icon={PackageX} accent="danger" info="Número de insumos em situação crítica de estoque, com risco de faltar." footer={totais ? <div className="flex justify-end"><BotaoAnaliseIa rotulo="Itens críticos" onClick={() => setDialogOp("criticos")} /></div> : undefined} />
          <KpiCard label="Alertas ativos" value={totais ? fmtNum(totais.alertasAtivos) : ""} carregando={painelQuery.isPending} icon={BellRing} accent="warning" info="Quantidade de avisos abertos que ainda precisam de atenção da equipe." footer={totais ? <div className="flex justify-end"><BotaoAnaliseIa rotulo="Alertas" onClick={() => setDialogOp("alertas")} /></div> : undefined} />
        </div>
      )}

      {/* Filtros (RF-DASH-06) — ilustrativos: aplicam-se ao catálogo/exportação, que não têm
          endpoint. A lista de unidades é real (API); a aplicação do filtro virá com o gerador. */}
      <Section title="Filtros" info="Permite refinar os relatórios por unidade, categoria de insumos, período e tipo, mostrando só o que interessa." icon={<Filter className="size-4" />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect label="Unidade" itens={["Todas", ...unidadesAtendidas]} />
          <FilterSelect label="Categoria de insumo" itens={["Todas", ...CATEGORIAS]} />
          <FilterSelect label="Período" itens={PERIODOS} />
          <FilterSelect label="Tipo de relatório" itens={["Todos", "Estratégico", "Tático", "Operacional"]} />
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Catálogo de relatórios (ilustrativo) */}
        <div className="space-y-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Catálogo de relatórios</p>
          </div>
          {/* NOTA: catálogo e exportação ilustrativos — não há endpoint de geração de relatório. */}
          {RELATORIOS.map((r) => (
            <Card key={r.id} className="flex flex-row items-center justify-between gap-4 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileBarChart className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{r.nome}</p>
                    <Badge variant="outline" className="text-[10px]">{r.tipo}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Baixar ${r.nome}`}
                onClick={() => toast.success("Download iniciado")}
              >
                <Download className="size-4" />
              </Button>
            </Card>
          ))}
        </div>

        {/* Painel OPED (ilustrativo) */}
        <Section
          className="lg:col-span-2 h-fit"
          title="Progresso do projeto · OPED"
          info="Mostra o andamento das etapas do projeto, para que o órgão parceiro acompanhe o quanto já foi entregue."
          description="Indicadores de progresso acessíveis ao Órgão Parceiro de Estado Demandante."
        >
          {/* NOTA: marcos do projeto ilustrativos — não há endpoint de progresso/OPED. */}
          <div className="space-y-4">
            {MARCOS.map((m) => (
              <div key={m.fase}>
                <div className="flex items-center gap-2 text-sm">
                  {m.status === "concluido" ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : m.status === "andamento" ? (
                    <Clock className="size-4 text-warning" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" />
                  )}
                  <span className="flex-1">{m.fase}</span>
                  <span className="tabular text-xs text-muted-foreground">{m.pct}%</span>
                </div>
                <Progress value={m.pct} className="mt-1.5 h-1.5" />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Progresso global</span>
              <StatusBadge status="atencao" label="66% concluído" dot={false} />
            </div>
          </div>
        </Section>
      </div>

      {resumoInd && (
        <GraficoInsightDialog
          aberto={dialogOp === "metas"}
          onOpenChange={(a) => setDialogOp(a ? "metas" : null)}
          titulo="Metas atingidas — resumo executivo"
          descricao="Avaliação da maturidade do projeto e próximos passos."
          mensagens={mensagensAnalise(corpoMetas(resumoInd))}
          chave="rel-metas"
        />
      )}
      {totais && (
        <>
          <GraficoInsightDialog
            aberto={dialogOp === "economia"}
            onOpenChange={(a) => setDialogOp(a ? "economia" : null)}
            titulo="Economia potencial — resumo executivo"
            descricao="Impacto financeiro das recomendações na rede."
            mensagens={mensagensAnalise(corpoEconomiaRel(totais))}
            chave="rel-econ"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "criticos"}
            onOpenChange={(a) => setDialogOp(a ? "criticos" : null)}
            titulo="Itens críticos — resumo executivo"
            descricao="Risco estratégico do desabastecimento na rede."
            mensagens={mensagensAnalise(corpoCriticosRel(totais))}
            chave="rel-crit"
          />
          <GraficoInsightDialog
            aberto={dialogOp === "alertas"}
            onOpenChange={(a) => setDialogOp(a ? "alertas" : null)}
            titulo="Alertas ativos — resumo executivo"
            descricao="Implicações operacionais dos alertas pendentes."
            mensagens={mensagensAnalise(corpoAlertasRel(totais))}
            chave="rel-ale"
          />
        </>
      )}
    </>
  )
}

function FilterSelect({ label, itens }: { label: string; itens: string[] }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select defaultValue={itens[0]}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {itens.map((i) => (
            <SelectItem key={i} value={i}>{i}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
