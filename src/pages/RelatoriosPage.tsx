import { CheckCircle2, Circle, Clock, Download, FileBarChart, FileSpreadsheet, FileText, Filter } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
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
import { familiasTerapeuticas, unidadesAtendidas, rotuloMes } from "@/data"
import { toast } from "sonner"

const relatorios = [
  { id: "r1", nome: "Relatório Estratégico CAHOSP — 2º Trimestre", desc: "Visão consolidada para a direção da EMSERH: desabastecimentos, perdas, compras e assertividade.", tipo: "Estratégico", rf: "RF-DASH-04" },
  { id: "r2", nome: "Demanda prevista por família terapêutica", desc: "Projeção de consumo dos próximos 3 meses por família e unidade.", tipo: "Tático", rf: "RF-DASH-01" },
  { id: "r3", nome: "Lotes e rastreabilidade sanitária", desc: "Movimentação por lote para controle sanitário e auditoria.", tipo: "Operacional", rf: "RF-DASH-03" },
  { id: "r4", nome: "Indicadores vs. linha de base", desc: "Comparativo das metas do projeto frente ao baseline consolidado.", tipo: "Estratégico", rf: "RF-IND-01" },
]

const marcos = [
  { fase: "Ingestão e anonimização da base histórica", status: "concluido", pct: 100 },
  { fase: "Calibração dos modelos de previsão", status: "concluido", pct: 100 },
  { fase: "Geração automática de previsões em produção", status: "andamento", pct: 78 },
  { fase: "Módulo de redistribuição assistido por IA", status: "andamento", pct: 45 },
  { fase: "Integração plena com sistemas EMSERH", status: "andamento", pct: 60 },
  { fase: "Operação em paralelo (piloto)", status: "pendente", pct: 15 },
]

export default function RelatoriosPage() {
  return (
    <>
      <PageHeader
        icon={<FileBarChart className="size-5" />}
        title="Relatórios & Visualização"
        rf="RF-DASH-04 · RF-DASH-07"
        description="Relatórios estratégicos para a direção da EMSERH, painel de progresso do projeto (OPED) e exportação em formatos estruturados."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Exportando planilha…")}><FileSpreadsheet className="size-4" /> Planilha</Button>
            <Button onClick={() => toast.success("Gerando PDF…")}><FileText className="size-4" /> PDF</Button>
          </>
        }
      />

      {/* Filtros (RF-DASH-06) */}
      <Section title="Filtros" rf="RF-DASH-06" icon={<Filter className="size-4" />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect label="Unidade" itens={["Todas", ...unidadesAtendidas.map((u) => u.sigla)]} />
          <FilterSelect label="Família terapêutica" itens={["Todas", ...familiasTerapeuticas]} />
          <FilterSelect label="Período" itens={["Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses", ...Object.values(rotuloMes).slice(0, 4)]} />
          <FilterSelect label="Tipo de relatório" itens={["Todos", "Estratégico", "Tático", "Operacional"]} />
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Catálogo de relatórios */}
        <div className="space-y-3 lg:col-span-3">
          {relatorios.map((r) => (
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
                  <span className="mt-1 inline-block font-mono text-[10px] text-muted-foreground">{r.rf}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => toast.success("Download iniciado")}>
                <Download className="size-4" />
              </Button>
            </Card>
          ))}
        </div>

        {/* Painel OPED (RF-DASH-05) */}
        <Section className="lg:col-span-2 h-fit" title="Progresso do projeto · OPED" rf="RF-DASH-05" description="Indicadores de progresso acessíveis ao Órgão Parceiro de Estado Demandante.">
          <div className="space-y-4">
            {marcos.map((m) => (
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
