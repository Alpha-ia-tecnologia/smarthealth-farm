import { CloudOff, FileJson, Gauge as GaugeIcon, Plug, RefreshCw, Server, Cpu } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ErroConsulta } from "@/components/shared/ErroConsulta"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { useIntegracoes, useProvedoresIa, useResumoIntegracoes } from "@/hooks/use-integracoes"
import type { ModoIntegracao, StatusIntegracao } from "@/lib/integracoes"
import { fmtNum, fmtDataHora, fmtMoeda } from "@/lib/format"
import type { StatusKey } from "@/lib/status"

const apiStatus: Record<StatusIntegracao, StatusKey> = {
  Operacional: "ok",
  Degradada: "atencao",
  Indisponível: "critico",
}
const modoStatus: Record<ModoIntegracao, StatusKey> = {
  Online: "ok",
  "Offline (buffer)": "critico",
  Reconciliando: "atencao",
}

/** Badge de seção sem endpoint na API — sinaliza que o conteúdo é demonstrativo. */
const BADGE_ILUSTRATIVO = (
  <Badge variant="outline" className="border-warning/40 bg-warning/10 text-[10px] text-warning">
    Dados ilustrativos
  </Badge>
)

// Capacidades de resiliência (RF-INT-03/04/05) — descrição estática do desenho da plataforma,
// sem endpoint de configuração. Exibidas como status (read-only), não como controles editáveis.
const resiliencia = [
  { l: "Cache local + sync assíncrona", on: true },
  { l: "Modo offline com reconciliação", on: true },
  { l: "Importação/exportação por arquivos", on: true },
  { l: "Buffer persistente por unidade", on: true },
]

export default function IntegracaoPage() {
  const resumoQuery = useResumoIntegracoes()
  const integracoesQuery = useIntegracoes()
  const provedoresQuery = useProvedoresIa()

  const resumo = resumoQuery.data

  return (
    <>
      <Cabecalho />

      {/* KPIs (RF-INT-01/02/05/06) — vindos de /integracoes/resumo */}
      {resumoQuery.isError ? (
        <ErroConsulta
          mensagem="Não foi possível carregar os indicadores de integração."
          onTentarNovamente={() => resumoQuery.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Integrações operacionais" value={resumo ? `${fmtNum(resumo.operacionais)}/${fmtNum(resumo.totalIntegracoes)}` : ""} carregando={resumoQuery.isPending} icon={Server} accent="teal" info="Quantas conexões com sistemas externos estão funcionando, do total cadastrado. Exemplo: 4/5 significa que 4 de 5 estão operando normalmente." />
          <KpiCard label="Latência média" value={resumo ? `${fmtNum(resumo.latenciaMediaMs)} ms` : ""} carregando={resumoQuery.isPending} icon={GaugeIcon} accent="primary" info="Tempo médio que as conexões levam para responder, em milissegundos. Quanto menor, mais rápida é a troca de informações com os outros sistemas." />
          <KpiCard label="Registros em buffer" value={resumo ? fmtNum(resumo.registrosBuffer) : ""} carregando={resumoQuery.isPending} icon={CloudOff} accent={resumo && resumo.registrosBuffer > 0 ? "warning" : "success"} hint="modo offline" info="Dados que ficaram guardados localmente porque a internet caiu ou o sistema externo estava fora do ar. Eles serão enviados automaticamente quando a conexão voltar." />
          <KpiCard label="Provedores de IA" value={resumo ? fmtNum(resumo.provedoresIa) : ""} carregando={resumoQuery.isPending} icon={Cpu} accent="primary" hint="via AI Gateway" info="Número de serviços de inteligência artificial conectados à plataforma para gerar análises e previsões." />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* APIs / conexões (RF-INT-01/04) — vindas de /integracoes */}
        <Section className="lg:col-span-3" title="Conexões e sincronização" info="Lista cada sistema externo conectado à plataforma, mostrando se está funcionando e quando trocou dados pela última vez. Em locais com internet instável, as informações ficam guardadas e são sincronizadas depois." description="APIs versionadas com contratos documentados; cache local e buffer persistente nas unidades com conectividade precária." noPadding>
          {integracoesQuery.isError ? (
            <div className="p-5">
              <ErroConsulta mensagem="Não foi possível carregar as conexões." onTentarNovamente={() => integracoesQuery.refetch()} />
            </div>
          ) : integracoesQuery.isPending ? (
            <div className="flex justify-center py-16"><Spinner size={40} label="Carregando conexões" /></div>
          ) : integracoesQuery.data.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma integração cadastrada.</p>
          ) : (
            <div className="divide-y">
              {integracoesQuery.data.map((i) => (
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
          )}
        </Section>

        {/* Resiliência (RF-INT-03/05) — descrição estática do desenho, sem endpoint */}
        <Section className="lg:col-span-2 h-fit" title="Resiliência de conectividade" info="Recursos que mantêm o sistema funcionando mesmo quando a internet está lenta ou cai, como guardar dados localmente e reenviá-los quando a conexão voltar." description="Tolerância a instabilidade e latência elevada." action={BADGE_ILUSTRATIVO}>
          <div className="space-y-3">
            {resiliencia.map((r) => (
              <div key={r.l} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{r.l}</p>
                </div>
                <Switch checked={r.on} disabled aria-label={`${r.l} (ativo)`} />
              </div>
            ))}
            <button type="button" disabled className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 text-sm text-muted-foreground opacity-60">
              <FileJson className="size-4" /> Exportar contrato OpenAPI
            </button>
          </div>
        </Section>
      </div>

      {/* AI Gateway (RF-INT-06 / RF-SEG-04) — vindo de /integracoes/provedores-ia */}
      <Section title="AI Gateway — provedores de IA generativa" info="Camada que conecta a plataforma aos serviços de inteligência artificial. Permite trocar de fornecedor sem afetar o sistema e protege os dados sensíveis, que não são enviados diretamente para fora." description="Abstrai provedores externos, permitindo substituição transparente. Dados sensíveis desacoplados das chamadas." icon={<Cpu className="size-4" />}>
        {provedoresQuery.isError ? (
          <ErroConsulta mensagem="Não foi possível carregar os provedores de IA." onTentarNovamente={() => provedoresQuery.refetch()} />
        ) : provedoresQuery.isPending ? (
          <div className="flex justify-center py-12"><Spinner size={40} label="Carregando provedores" /></div>
        ) : provedoresQuery.data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum provedor de IA registrado.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {provedoresQuery.data.map((p) => (
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
                  {p.anonimizacao ? (
                    <span className="flex items-center gap-1.5 text-xs text-success">
                      <RefreshCw className="size-3" /> Anonimização ativa
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RefreshCw className="size-3" /> Sem anonimização
                    </span>
                  )}
                  <StatusBadge status={p.ativo ? "ok" : "neutro"} label={p.ativo ? "Ativo" : "Inativo"} dot={false} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  )
}

function Cabecalho() {
  return (
    <PageHeader
      icon={<Plug className="size-5" />}
      title="Integração com os Sistemas da EMSERH"
      info="Esta tela mostra como a plataforma se conecta e troca informações com os outros sistemas da EMSERH de forma automática e segura, mesmo quando a internet falha."
      description="Interoperabilidade via APIs versionadas, sincronização segura, tolerância a instabilidades de rede e AI Gateway para provedores de IA generativa."
    />
  )
}
