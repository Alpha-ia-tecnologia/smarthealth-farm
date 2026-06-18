import { RefreshCw, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AnaliseConteudo } from "@/components/shared/AnaliseConteudo"
import type { ModoResposta } from "@/lib/ia"

interface Props {
  carregando: boolean
  erro: boolean
  analise: { content: string; mode: ModoResposta } | null
  onTentarNovamente: () => void
}

/**
 * Bloco visual da análise por IA: carregando / erro (com retry) / texto da resposta. Sinaliza o
 * "modo demo" (sem provedor) e o aviso de anonimização (LGPD). Reutilizado por KPIs e gráficos.
 */
export function AnaliseIaPainel({ carregando, erro, analise, onTentarNovamente }: Props) {
  return (
    <section className="rounded-lg border border-primary/20 bg-primary/5 p-4" aria-live="polite">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </span>
        <p className="text-sm font-semibold">Análise por IA</p>
        {analise?.mode === "demo" && (
          <Badge variant="outline" className="text-[10px]">
            Modo demo
          </Badge>
        )}
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size={18} label="Gerando análise" />
          Gerando análise…
        </div>
      ) : erro ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Não foi possível gerar a análise agora.</p>
          <Button size="sm" variant="outline" onClick={onTentarNovamente}>
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : analise ? (
        <AnaliseConteudo texto={analise.content} />
      ) : (
        <p className="text-sm text-muted-foreground">Preparando análise…</p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" />
        Dados anonimizados antes do envio à IA.
      </p>
    </section>
  )
}
