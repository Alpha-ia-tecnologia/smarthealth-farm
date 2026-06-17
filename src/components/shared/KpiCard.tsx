import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { InfoHint } from "./InfoHint"

interface Props {
  label: string
  value: string
  icon?: LucideIcon
  delta?: { value: string; positivo: boolean }
  hint?: string
  /** Explicação em linguagem simples do que este indicador representa (ícone ⓘ ao lado do rótulo). */
  info?: string
  accent?: "primary" | "teal" | "success" | "warning" | "danger"
  footer?: React.ReactNode
  /** Mostra um spinner no lugar do valor enquanto a API carrega. */
  carregando?: boolean
}

const accents: Record<NonNullable<Props["accent"]>, string> = {
  primary: "text-primary bg-primary/10 ring-primary/15",
  teal: "text-teal bg-teal/10 ring-teal/15",
  success: "text-success bg-success/10 ring-success/15",
  warning: "text-warning bg-warning/10 ring-warning/15",
  danger: "text-danger bg-danger/10 ring-danger/15",
}

/**
 * Tamanho do valor conforme o comprimento — números grandes (ex.: "R$ 11.367.572") encolhem
 * para não invadir o ícone, em vez de transbordar o card. Determinístico, sem depender da viewport.
 */
function tamanhoValor(value: string): string {
  const n = value.length
  if (n <= 9) return "text-3xl"
  if (n <= 13) return "text-2xl"
  return "text-xl"
}

export function KpiCard({ label, value, icon: Icon, delta, hint, info, accent = "primary", footer, carregando }: Props) {
  return (
    <Card className="relative gap-0 overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            {info && <InfoHint texto={info} />}
          </div>
          {carregando ? (
            <div className="flex h-9 items-center">
              <Spinner size={26} label={`Carregando ${label}`} />
            </div>
          ) : (
            <p className={cn("tabular font-display font-bold leading-tight break-words", tamanhoValor(value))}>
              {value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl ring-1", accents[accent])}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {!carregando && (delta || hint) && (
        <div className="mt-3 flex items-center gap-2">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular",
                delta.positivo ? "bg-success/12 text-success" : "bg-danger/12 text-danger",
              )}
            >
              {delta.positivo ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {delta.value}
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      )}
      {footer && <div className="mt-3 border-t pt-3">{footer}</div>}
    </Card>
  )
}
