import { Activity, Database, DatabaseZap, FileCheck2, ShieldCheck, Thermometer } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useFontes, useQualidadeFamilias, useResumoIngestao } from "@/hooks/use-ingestao"
import type { StatusFonte } from "@/lib/ingestao"
import { fmtNum, fmtDataHora } from "@/lib/format"
import type { StatusKey } from "@/lib/status"

const fonteStatus: Record<StatusFonte, StatusKey> = {
  Sincronizado: "ok",
  Atrasado: "atencao",
  Erro: "critico",
}

/** Badge de seção sem endpoint na API — sinaliza que o conteúdo é demonstrativo. */
const BADGE_ILUSTRATIVO = (
  <Badge variant="outline" className="border-warning/40 bg-warning/10 text-[10px] text-warning">
    Dados ilustrativos
  </Badge>
)

// Sazonalidade epidemiológica e linha de base consolidada (RF-DAD-05/08) ainda não têm endpoint —
// mantidas como demonstração, marcadas na UI. Migram quando o backend expuser.
const epidemias = [
  { nome: "Dengue", intensidade: 86, periodo: "Jan–Abr (pico)" },
  { nome: "Leptospirose", intensidade: 64, periodo: "Mar–Mai (chuvas)" },
  { nome: "Malária", intensidade: 42, periodo: "Endêmica (interior)" },
  { nome: "Chikungunya", intensidade: 38, periodo: "Jan–Mar" },
]

const linhaBase = [
  { l: "Desabastecimentos (12m)", v: "412 eventos" },
  { l: "Perdas por vencimento", v: "R$ 1,8 mi" },
  { l: "Compras emergenciais", v: "R$ 14,9 mi/ano" },
  { l: "Tempo médio de ressup.", v: "19,5 dias" },
]

export default function IngestaoPage() {
  const resumoQuery = useResumoIngestao()
  const fontesQuery = useFontes()
  const qualidadeQuery = useQualidadeFamilias()

  const resumo = resumoQuery.data

  return (
    <>
      <Cabecalho />

      {/* KPIs (RF-DAD-01/02/04) — vindos de /ingestao/resumo */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores de ingestão."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Registros ingeridos" value={resumo ? fmtNum(resumo.registrosIngeridos) : ""} carregando={resumoQuery.isPending} icon={Database} accent="primary" info="Total de registros (linhas de dados) que o sistema já importou das planilhas e sistemas de origem." />
          <KpiCard label="Fontes sincronizadas" value={resumo ? `${fmtNum(resumo.fontesSincronizadas)}/${fmtNum(resumo.totalFontes)}` : ""} carregando={resumoQuery.isPending} icon={Activity} accent="teal" info="Quantas fontes de dados (sistemas e planilhas) estão atualizadas em relação ao total cadastrado." />
          <KpiCard label="Qualidade média" value={resumo ? `${resumo.qualidadeMedia}%` : ""} carregando={resumoQuery.isPending} icon={FileCheck2} accent={resumo && resumo.qualidadeMedia >= 80 ? "success" : "warning"} info="Nota geral de quão confiáveis e completos estão os dados importados. Quanto mais perto de 100%, melhor." />
          <KpiCard label="Anonimização LGPD" value={resumo ? (resumo.anonimizacaoAtiva ? "Ativa" : "Inativa") : ""} carregando={resumoQuery.isPending} icon={ShieldCheck} accent={resumo && !resumo.anonimizacaoAtiva ? "danger" : "success"} hint="antes de envio à IA" info="Indica se os dados pessoais são removidos antes de serem enviados à inteligência artificial, conforme a Lei Geral de Proteção de Dados (LGPD)." />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pipeline / fontes (RF-DAD-02/07) — vindas de /ingestao/fontes */}
        <Section className="lg:col-span-3" title="Fontes de dados & importação" info="Lista os sistemas e planilhas de onde os dados vêm. Mostra se cada origem está atualizada e a qualidade do que foi importado." description="Padronização de sistemas de gerações distintas, com rastreabilidade de origem." noPadding>
          {fontesQuery.isError ? (
            <div className="p-5">
              <ErroConsulta mensagem="Não foi possível carregar as fontes de dados." onTentarNovamente={() => fontesQuery.refetch()} />
            </div>
          ) : fontesQuery.isPending ? (
            <div className="flex justify-center py-16"><Spinner size={40} label="Carregando fontes" /></div>
          ) : fontesQuery.data.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma fonte de dados cadastrada.</p>
          ) : (
            <div className="divide-y">
              {fontesQuery.data.map((f) => (
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
          )}
        </Section>

        {/* Sazonalidade epidemiológica (RF-DAD-05) — sem endpoint, demonstrativo */}
        <Section className="lg:col-span-2 h-fit" title="Sazonalidade epidemiológica local" info="Mostra as épocas do ano em que doenças comuns na região aumentam. Esses períodos ajudam a prever a demanda por medicamentos." description="Variáveis que enriquecem a base preditiva." icon={<Thermometer className="size-4" />} action={BADGE_ILUSTRATIVO}>
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
            <p className="text-xs text-muted-foreground">Integra calendário de campanhas de saúde pública e boletins da vigilância.</p>
          </div>
        </Section>
      </div>

      {/* Qualidade por família (RF-DAD-04) — vinda de /ingestao/qualidade */}
      <Section title="Maturidade e qualidade por família terapêutica" info="Avalia a confiabilidade dos dados separados por grupo de medicamentos, apontando onde há informações faltando ou incompletas." description="Classificação da base histórica, sinalizando lacunas e granularidade.">
        {qualidadeQuery.isError ? (
          <ErroConsulta mensagem="Não foi possível carregar a qualidade por família." onTentarNovamente={() => qualidadeQuery.refetch()} />
        ) : qualidadeQuery.isPending ? (
          <div className="flex justify-center py-12"><Spinner size={40} label="Carregando qualidade" /></div>
        ) : qualidadeQuery.data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma família avaliada.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {qualidadeQuery.data.map((q) => (
              <div key={q.id} className="rounded-xl border p-4">
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
        )}
      </Section>

      {/* Linha de base consolidada (RF-DAD-08) — sem endpoint, demonstrativo */}
      <Section title="Linha de base consolidada" info="Resumo da situação atual calculado a partir dos dados importados. Serve como ponto de partida para comparar melhorias ao longo do tempo." description="Indicadores de partida calculados a partir dos dados ingeridos." action={BADGE_ILUSTRATIVO}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {linhaBase.map((b) => (
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

function Cabecalho() {
  return (
    <PageHeader
      icon={<DatabaseZap className="size-5" />}
      title="Ingestão, Tratamento e Anonimização"
      info="Tela onde os dados de consumo e distribuição de medicamentos são importados de vários sistemas, padronizados, limpos e têm os dados pessoais protegidos antes do uso."
      description="Coleta e padronização das séries históricas de consumo e dispensação de fontes heterogêneas, com anonimização LGPD e enriquecimento epidemiológico."
    />
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
