import { Activity, Database, DatabaseZap, FileCheck2, ShieldCheck, Thermometer } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { fontes, qualidadeFamilias } from "@/data"
import { fmtNum, fmtDataHora } from "@/lib/format"
import type { StatusKey } from "@/lib/status"

const fonteStatus: Record<string, StatusKey> = { Sincronizado: "ok", Atrasado: "atencao", Erro: "critico" }

const epidemias = [
  { nome: "Dengue", intensidade: 86, periodo: "Jan–Abr (pico)" },
  { nome: "Leptospirose", intensidade: 64, periodo: "Mar–Mai (chuvas)" },
  { nome: "Malária", intensidade: 42, periodo: "Endêmica (interior)" },
  { nome: "Chikungunya", intensidade: 38, periodo: "Jan–Mar" },
]

export default function IngestaoPage() {
  const registros = fontes.reduce((s, f) => s + f.registros, 0)
  const qualidadeMedia = Math.round(fontes.reduce((s, f) => s + f.qualidade, 0) / fontes.length)
  const sincronizadas = fontes.filter((f) => f.status === "Sincronizado").length

  return (
    <>
      <PageHeader
        icon={<DatabaseZap className="size-5" />}
        title="Ingestão, Tratamento e Anonimização"
        rf="RF-DAD"
        description="Coleta e padronização das séries históricas de consumo e dispensação de fontes heterogêneas, com anonimização LGPD e enriquecimento epidemiológico."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Registros ingeridos" value={fmtNum(registros)} icon={Database} accent="primary" rf="RF-DAD-01" />
        <KpiCard label="Fontes sincronizadas" value={`${sincronizadas}/${fontes.length}`} icon={Activity} accent="teal" rf="RF-DAD-02" />
        <KpiCard label="Qualidade média" value={`${qualidadeMedia}%`} icon={FileCheck2} accent={qualidadeMedia >= 80 ? "success" : "warning"} rf="RF-DAD-04" />
        <KpiCard label="Anonimização LGPD" value="Ativa" icon={ShieldCheck} accent="success" hint="antes de envio à IA" rf="RF-DAD-03" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pipeline / fontes */}
        <Section className="lg:col-span-3" title="Fontes de dados & importação" rf="RF-DAD-02 · RF-DAD-07" description="Padronização de sistemas de gerações distintas, com rastreabilidade de origem." noPadding>
          <div className="divide-y">
            {fontes.map((f) => (
              <div key={f.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.geracao} · {f.procedencia}</p>
                  </div>
                  <StatusBadge status={fonteStatus[f.status]} label={f.status} />
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="tabular">{fmtNum(f.registros)} registros</span>
                  <span>última: {fmtDataHora(f.ultimaIngestao)}</span>
                  <span className="ml-auto flex items-center gap-2">
                    qualidade
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <span className={`block h-full rounded-full ${f.qualidade >= 80 ? "bg-success" : f.qualidade >= 65 ? "bg-warning" : "bg-danger"}`} style={{ width: `${f.qualidade}%` }} />
                    </span>
                    <span className="tabular font-medium text-foreground">{f.qualidade}%</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Sazonalidade epidemiológica */}
        <Section className="lg:col-span-2 h-fit" title="Sazonalidade epidemiológica local" rf="RF-DAD-05" description="Variáveis que enriquecem a base preditiva." icon={<Thermometer className="size-4" />}>
          <div className="space-y-4">
            {epidemias.map((e) => (
              <div key={e.nome}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{e.nome}</span>
                  <span className="text-xs text-muted-foreground">{e.periodo}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal to-primary" style={{ width: `${e.intensidade}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Integra calendário de campanhas de saúde pública e boletins da vigilância (RF-DAD-05).</p>
          </div>
        </Section>
      </div>

      {/* Qualidade por família (RF-DAD-04) + linha de base (RF-DAD-08) */}
      <Section title="Maturidade e qualidade por família terapêutica" rf="RF-DAD-04" description="Classificação da base histórica, sinalizando lacunas e granularidade.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {qualidadeFamilias.map((q) => (
            <div key={q.familia} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{q.familia}</p>
                <Badge variant="outline" className="text-[10px]">{q.granularidade}</Badge>
              </div>
              <div className="mt-3 space-y-2">
                <MetricRow label="Maturidade" value={q.maturidade} />
                <MetricRow label="Completude" value={q.completude} />
                <MetricRow label="Consistência" value={q.consistencia} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{q.lacunas} lacuna(s) sinalizada(s)</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Linha de base consolidada" rf="RF-DAD-08" description="Indicadores de partida calculados a partir dos dados ingeridos.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Desabastecimentos (12m)", v: "412 eventos" },
            { l: "Perdas por vencimento", v: "R$ 1,8 mi" },
            { l: "Compras emergenciais", v: "R$ 14,9 mi/ano" },
            { l: "Tempo médio de ressup.", v: "19,5 dias" },
          ].map((b) => (
            <div key={b.l} className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">{b.l}</p>
              <p className="tabular font-display text-lg font-bold">{b.v}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular font-medium">{value}%</span>
      </div>
      <Progress value={value} className="mt-1 h-1.5" />
    </div>
  )
}
