import { RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AnaliseIaPainel } from "@/components/shared/AnaliseIaPainel"
import { TrendChart } from "@/components/charts/TrendChart"
import { useAnaliseIaAuto } from "@/hooks/use-analise-ia"
import type { MensagemChat } from "@/lib/ia"
import { formatarValorIndicador, type Indicador } from "@/lib/indicadores"
import { fmtNum } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Props {
  /** Indicador a detalhar. Quando `null`, o modal não renderiza conteúdo. */
  indicador: Indicador | null
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

/**
 * Modal de um KPI de indicador: mostra os **números reais** (atual, base, meta, variação,
 * progresso e o lastro absoluto) sem poluir o card, e uma **análise gerada por IA**. RF-IND ·
 * RF-INT-06 · RF-SEG-04.
 */
export function IndicadorInsightDialog({ indicador, aberto, onOpenChange }: Props) {
  const mensagens = indicador ? construirMensagens(indicador) : []
  const { analise, carregando, erro, gerar } = useAnaliseIaAuto(mensagens, aberto, indicador?.codigo ?? null)

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {indicador && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
                {indicador.nome}
                <StatusBadge
                  status={indicador.atingiu ? "ok" : "atencao"}
                  label={indicador.atingiu ? "Meta atingida" : "Em progresso"}
                  dot={false}
                />
              </DialogTitle>
              <DialogDescription>
                {indicador.melhorMenor ? "Quanto menor o valor, melhor." : "Quanto maior o valor, melhor."}{" "}
                Números reais do indicador e uma análise gerada por IA.
              </DialogDescription>
            </DialogHeader>

            <NumerosReais indicador={indicador} />

            {indicador.historico.length > 1 && (
              <div className="rounded-lg border p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Evolução recente</p>
                <TrendChart
                  data={indicador.historico}
                  meta={indicador.meta}
                  height={120}
                  label={indicador.nome}
                  color={indicador.atingiu ? "var(--chart-4)" : "var(--chart-3)"}
                />
              </div>
            )}

            <AnaliseIaPainel carregando={carregando} erro={erro} analise={analise} onTentarNovamente={gerar} />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Fechar</Button>
              </DialogClose>
              <Button variant="outline" onClick={gerar} disabled={carregando}>
                <RefreshCw className={cn("size-4", carregando && "animate-spin")} />
                Gerar novamente
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Grade com os números reais do indicador (todos entregues prontos pelo backend) + progresso. */
function NumerosReais({ indicador }: { indicador: Indicador }) {
  const {
    unidade,
    atual,
    baseline,
    meta,
    metaReducaoPct,
    melhorMenor,
    variacaoPct,
    progresso,
    atingiu,
    numeradorAbsoluto,
    denominadorAbsoluto,
    unidadeAbsoluta,
  } = indicador
  const melhora = variacaoPct == null ? null : melhorMenor ? variacaoPct < 0 : variacaoPct > 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile rotulo="Atual" valor={formatarValorIndicador(unidade, atual)} destaque />
        <Tile rotulo="Linha de base" valor={formatarValorIndicador(unidade, baseline)} sub="antes do projeto" />
        <Tile
          rotulo="Meta"
          valor={formatarValorIndicador(unidade, meta)}
          sub={metaReducaoPct > 0 ? `−${metaReducaoPct}% vs. base` : "alvo"}
        />
        <Tile
          rotulo="Variação vs. base"
          valor={variacaoPct == null ? "—" : `${variacaoPct}%`}
          tom={melhora == null ? undefined : melhora ? "success" : "danger"}
        />
      </div>
      {numeradorAbsoluto != null && denominadorAbsoluto != null && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-dashed bg-muted/20 p-3">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Em números reais</span>
          <span className="tabular text-sm">
            <span className="font-display text-lg font-bold">{fmtNum(numeradorAbsoluto)}</span>
            <span className="text-muted-foreground"> de </span>
            <span className="font-display text-lg font-bold">{fmtNum(denominadorAbsoluto)}</span>{" "}
            <span className="text-muted-foreground">{unidadeAbsoluta}</span>
          </span>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progresso até a meta</span>
          <span className="tabular">{progresso}%</span>
        </div>
        <BarraProgressoMeta progresso={progresso} atingiu={atingiu} />
      </div>
    </div>
  )
}

/**
 * Barra de "progresso até a meta" com **marcador da meta**. A meta é o ponto de 100% nesta escala;
 * como o progresso pode passar de 100% (ex.: 112%), a barra é redimensionada para
 * `escala = max(progresso, 110)` — assim o marcador da meta nunca encosta na ponta e o quanto se
 * passou dela fica visível. Ex.: progresso 112% → preenchimento cheio e marcador da meta em ~89%.
 */
function BarraProgressoMeta({ progresso, atingiu }: { progresso: number; atingiu: boolean }) {
  const escala = Math.max(progresso, 110)
  const preenchimento = Math.max(0, Math.min(100, (progresso / escala) * 100))
  const posicaoMeta = (100 / escala) * 100

  return (
    <div className="mt-1.5">
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Progresso até a meta: ${progresso}%. A meta corresponde a 100% (${atingiu ? "atingida" : "não atingida"}).`}
      >
        <div
          className={cn("h-full rounded-full transition-all", atingiu ? "bg-success" : "bg-warning")}
          style={{ width: `${preenchimento}%` }}
        />
        {/* Marcador da meta (100% nesta escala). */}
        <div
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-foreground/80"
          style={{ left: `${posicaoMeta}%` }}
          aria-hidden
        />
      </div>
      {/* Régua: início (0%) e a posição da meta. */}
      <div className="relative mt-1 h-3.5 text-[10px] text-muted-foreground" aria-hidden>
        <span className="absolute left-0">0%</span>
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap font-medium text-foreground/80"
          style={{ left: `${posicaoMeta}%` }}
        >
          Meta
        </span>
      </div>
    </div>
  )
}

function Tile({
  rotulo,
  valor,
  sub,
  destaque,
  tom,
}: {
  rotulo: string
  valor: string
  sub?: string
  destaque?: boolean
  tom?: "success" | "danger"
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p
        className={cn(
          "tabular font-display text-lg font-bold leading-tight break-words",
          destaque && "text-primary",
          tom === "success" && "text-success",
          tom === "danger" && "text-danger",
        )}
      >
        {valor}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

/** Monta as mensagens enviadas ao AI Gateway com os números reais do indicador (sem dado pessoal). */
function construirMensagens(ind: Indicador): MensagemChat[] {
  const sistema: MensagemChat = {
    papel: "system",
    conteudo:
      "Você é um analista da plataforma Smart Health CAHOSP, de gestão preditiva da cadeia " +
      "farmacêutica hospitalar (EMSERH-MA). Analise indicadores de desempenho e responda em " +
      "português do Brasil, de forma objetiva e executiva (3 a 4 frases), sem inventar dados " +
      "além dos fornecidos.",
  }

  const direcao = ind.melhorMenor ? "quanto menor, melhor" : "quanto maior, melhor"
  const variacao = ind.variacaoPct == null ? "indisponível" : `${ind.variacaoPct}% em relação à linha de base`
  const absoluto =
    ind.numeradorAbsoluto != null && ind.denominadorAbsoluto != null
      ? `Em números absolutos: ${fmtNum(ind.numeradorAbsoluto)} de ${fmtNum(ind.denominadorAbsoluto)} ${ind.unidadeAbsoluta}\n`
      : ""

  const usuario: MensagemChat = {
    papel: "user",
    conteudo:
      `Analise o indicador "${ind.nome}" e dê um parecer com: (1) o que o valor atual indica, ` +
      `(2) avaliação frente à linha de base e à meta, (3) uma recomendação prática.\n\n` +
      `Unidade de medida: ${ind.unidade}\n` +
      `Valor atual: ${formatarValorIndicador(ind.unidade, ind.atual)}\n` +
      absoluto +
      `Linha de base (antes do projeto): ${formatarValorIndicador(ind.unidade, ind.baseline)}\n` +
      `Meta: ${formatarValorIndicador(ind.unidade, ind.meta)}` +
      `${ind.metaReducaoPct > 0 ? ` (redução de ${ind.metaReducaoPct}% em relação à base)` : ""}\n` +
      `Direção desejada: ${direcao}\n` +
      `Variação atual: ${variacao}\n` +
      `Progresso até a meta: ${ind.progresso}%\n` +
      `Meta atingida: ${ind.atingiu ? "sim" : "não"}`,
  }

  return [sistema, usuario]
}
