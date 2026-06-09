import { CloudOff, FileJson, Gauge as GaugeIcon, Plug, RefreshCw, Server, Cpu } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { integracoes, provedoresIA } from "@/data"
import { fmtNum, fmtDataHora, fmtMoeda } from "@/lib/format"
import type { StatusKey } from "@/lib/status"

const apiStatus: Record<string, StatusKey> = { Operacional: "ok", Degradada: "atencao", Indisponível: "critico" }
const modoStatus: Record<string, StatusKey> = { Online: "ok", "Offline (buffer)": "critico", Reconciliando: "atencao" }

export default function IntegracaoPage() {
  const operacionais = integracoes.filter((i) => i.status === "Operacional").length
  const buffer = integracoes.reduce((s, i) => s + i.registrosBuffer, 0)
  const latenciaMedia = Math.round(integracoes.filter((i) => i.latenciaMs > 0).reduce((s, i) => s + i.latenciaMs, 0) / integracoes.filter((i) => i.latenciaMs > 0).length)

  return (
    <>
      <PageHeader
        icon={<Plug className="size-5" />}
        title="Integração com os Sistemas da EMSERH"
        rf="RF-INT"
        description="Interoperabilidade via APIs versionadas, sincronização segura, tolerância a instabilidades de rede e AI Gateway para provedores de IA generativa."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Integrações operacionais" value={`${operacionais}/${integracoes.length}`} icon={Server} accent="teal" rf="RF-INT-01" />
        <KpiCard label="Latência média" value={`${latenciaMedia} ms`} icon={GaugeIcon} accent="primary" rf="RF-INT-02" />
        <KpiCard label="Registros em buffer" value={fmtNum(buffer)} icon={CloudOff} accent={buffer > 0 ? "warning" : "success"} hint="modo offline" rf="RF-INT-05" />
        <KpiCard label="Provedores de IA" value={fmtNum(provedoresIA.length)} icon={Cpu} accent="primary" hint="via AI Gateway" rf="RF-INT-06" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* APIs / conexões */}
        <Section className="lg:col-span-3" title="Conexões e sincronização" rf="RF-INT-01 · RF-INT-04" description="APIs versionadas com contratos documentados; cache local e buffer persistente nas unidades com conectividade precária." noPadding>
          <div className="divide-y">
            {integracoes.map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Server className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{i.nome}</p>
                    <Badge variant="outline" className="font-mono text-[10px]">{i.versao}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    sync {fmtDataHora(i.ultimaSync)} {i.registrosBuffer > 0 && `· ${fmtNum(i.registrosBuffer)} no buffer`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={apiStatus[i.status]} label={i.status} />
                  <StatusBadge status={modoStatus[i.modo]} label={i.modo} dot={false} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Resiliência */}
        <Section className="lg:col-span-2 h-fit" title="Resiliência de conectividade" rf="RF-INT-03 · RF-INT-05" description="Tolerância a instabilidade e latência elevada.">
          <div className="space-y-3">
            {[
              { l: "Cache local + sync assíncrona", on: true, rf: "RF-INT-04" },
              { l: "Modo offline com reconciliação", on: true, rf: "RF-INT-05" },
              { l: "Importação/exportação por arquivos", on: true, rf: "RF-INT-03" },
              { l: "Buffer persistente por unidade", on: true, rf: "RF-INT-04" },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{r.l}</p>
                  <span className="font-mono text-[10px] text-muted-foreground">{r.rf}</span>
                </div>
                <Switch defaultChecked={r.on} />
              </div>
            ))}
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 text-sm text-muted-foreground hover:bg-muted/50">
              <FileJson className="size-4" /> Exportar contrato OpenAPI
            </button>
          </div>
        </Section>
      </div>

      {/* AI Gateway (RF-INT-06 / RF-SEG-04) */}
      <Section title="AI Gateway — provedores de IA generativa" rf="RF-INT-06 · RF-SEG-04" description="Abstrai provedores externos, permitindo substituição transparente. Dados sensíveis desacoplados das chamadas." icon={<Cpu className="size-4" />}>
        <div className="grid gap-3 md:grid-cols-3">
          {provedoresIA.map((p) => (
            <Card key={p.id} className={`gap-2 p-4 ${p.ativo ? "border-primary/30" : "opacity-70"}`}>
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-semibold">{p.nome}</p>
                <StatusBadge status={p.papel === "Primário" ? "ok" : p.papel === "Fallback" ? "info" : "neutro"} label={p.papel} dot={false} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-muted-foreground">Custo / 1k tokens</p>
                  <p className="tabular font-semibold">{fmtMoeda(p.custoPor1kTokens).replace("R$", "US$")}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-muted-foreground">Chamadas/mês</p>
                  <p className="tabular font-semibold">{fmtNum(p.chamadasMes)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <RefreshCw className="size-3" /> Anonimização ativa
                </span>
                <Switch defaultChecked={p.ativo} />
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}
