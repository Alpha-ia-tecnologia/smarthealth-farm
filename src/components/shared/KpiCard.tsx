import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, ChevronRight, Sparkles, type LucideIcon } from "lucide-react"
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
  /**
   * Torna o card clicável (vira um botão acessível). Quando definido, mostra uma chamada para
   * abrir os detalhes — usado para revelar os números reais e a análise por IA num modal, em vez
   * de poluir o card com textos secundários.
   */
  onClick?: () => void
  /** Texto da chamada de ação exibida no rodapé quando o card é clicável. */
  acaoLabel?: string
  /** Ação adicional renderizada no topo direito do card. */
  action?: React.ReactNode
}

const accents: Record<NonNullable<Props["accent"]>, string> = {
  primary: "text-primary bg-primary/10 ring-primary/15",
  teal: "text-teal bg-teal/10 ring-teal/15",
  success: "text-success bg-success/10 ring-success/15",
  warning: "text-warning bg-warning/10 ring-warning/15",
  danger: "text-danger bg-danger/10 ring-danger/15",
}

/**
 * Tamanho do valor conforme o comprimento — números grandes (ex.: "R$ 812.000", "R$ 11.367.572")
 * encolhem para caber numa linha dentro do card (4 colunas), em vez de quebrar/transbordar.
 * Determinístico, sem depender da viewport.
 */
function tamanhoValor(value: string): string {
  const n = value.length
  if (n <= 6) return "text-3xl"
  if (n <= 9) return "text-2xl"
  if (n <= 12) return "text-xl"
  return "text-lg"
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  info,
  accent = "primary",
  footer,
  carregando,
  onClick,
  acaoLabel = "Números reais e análise IA",
  action,
}: Props) {
  const interativo = !!onClick && !carregando
  const propsInterativas = onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": `Ver números e análise de ${label}`,
        onClick,
        onKeyDown: (evento: React.KeyboardEvent) => {
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault()
            onClick()
          }
        },
      }
    : {}

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col gap-0 overflow-hidden p-5",
        onClick &&
          "group cursor-pointer transition-[color,background-color,border-color,box-shadow] duration-200 hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      {...propsInterativas}
    >
      <div className="flex flex-1 items-start justify-between gap-3">
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
        {(action || Icon) && (
          <div className="flex shrink-0 items-center gap-2">
            {action}
            {Icon && (
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl ring-1", accents[accent])}>
                <Icon className="size-5" />
              </div>
            )}
          </div>
        )}
      </div>
      {!carregando && (delta || hint) && (
        <div className="mt-3 flex items-center gap-2 w-full">
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular ml-auto",
                delta.positivo ? "bg-success/12 text-success" : "bg-danger/12 text-danger",
              )}
            >
              {delta.positivo ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {delta.value}
            </span>
          )}
        </div>
      )}
      {interativo && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary/85">
          <Sparkles className="size-3.5" />
          <span>{acaoLabel}</span>
          <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />
        </div>
      )}
      {footer && <div className="mt-auto pt-3 border-t">{footer}</div>}
    </Card>
  )
}
