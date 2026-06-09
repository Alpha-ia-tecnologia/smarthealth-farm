import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { InsightTone } from "@/lib/insights"

const TONE: Record<InsightTone, string> = {
  info: "var(--primary)",
  positivo: "var(--success)",
  alerta: "var(--warning)",
}

/**
 * Caixa de "Análise por IA" — comentário automático que auxilia a leitura
 * dos dados. Identidade visual consistente (gradiente sutil + ícone de IA),
 * com o tom (info/positivo/alerta) refletido na cor do ícone.
 */
export function AiInsight({
  text,
  tone = "info",
  className,
}: {
  text: string
  tone?: InsightTone
  className?: string
}) {
  const c = TONE[tone]
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border bg-gradient-to-br from-primary/5 to-teal/5 p-3",
        className,
      )}
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-md"
        style={{ color: c, backgroundColor: `color-mix(in oklch, ${c} 14%, transparent)` }}
      >
        <Sparkles className="size-3.5" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: c }}>
          Análise por IA
        </p>
        <p className="text-xs leading-relaxed text-foreground/80">{text}</p>
      </div>
    </div>
  )
}
