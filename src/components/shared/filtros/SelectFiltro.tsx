import { useId } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/** Opção de um filtro: valor enviado à API e rótulo (pt-BR) exibido. */
export interface OpcaoFiltro {
  valor: string
  rotulo: string
}

interface Props {
  /** Rótulo curto acima do controle (ex.: "Unidade"). Opcional. */
  label?: string
  /** Valor selecionado; `undefined` = "todos" (sem filtro). */
  valor: string | undefined
  /** Emite o novo valor, ou `undefined` ao limpar. */
  onChange: (valor: string | undefined) => void
  opcoes: OpcaoFiltro[]
  placeholder?: string
  /** Rótulo da opção "limpar" (ex.: "Todas as unidades"). */
  todosRotulo?: string
  carregando?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

/**
 * Select de filtro controlado, reutilizável em todas as telas. Sempre inclui a opção de limpar
 * ("todos"), que emite `undefined`. Acessível (label associada, foco contínuo do tema). O gatilho
 * tem visual de campo discreto — borda fina, cantos arredondados e seta que gira suavemente ao abrir.
 *
 * O Radix Select não aceita item de valor vazio; usamos um sentinel interno para a opção "todos".
 */
const SENTINEL_TODOS = "__todos__"

export function SelectFiltro({
  label,
  valor,
  onChange,
  opcoes,
  placeholder,
  todosRotulo = "Todas",
  carregando,
  disabled,
  className,
  id,
}: Props) {
  const reactId = useId()
  const campoId = id ?? reactId

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label
          htmlFor={campoId}
          className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground"
        >
          {label}
        </Label>
      )}
      <Select
        value={valor ?? SENTINEL_TODOS}
        onValueChange={(v) => onChange(v === SENTINEL_TODOS ? undefined : v)}
        disabled={disabled || carregando}
      >
        <SelectTrigger
          id={campoId}
          aria-label={label ?? placeholder ?? todosRotulo}
          className={cn(
            "h-9 w-full min-w-44 rounded-lg border-border/60 bg-background/70 px-3 text-sm font-medium shadow-none",
            "transition-[color,box-shadow,border-color] duration-150",
            "hover:border-border hover:bg-background",
            "data-[state=open]:border-ring/50 data-[state=open]:bg-background data-[state=open]:ring-[3px] data-[state=open]:ring-ring/15",
            // Seta mais elegante: discreta, e gira ao abrir.
            "[&>svg]:size-4 [&>svg]:text-muted-foreground/70 [&>svg]:opacity-100 [&>svg]:transition-transform [&>svg]:duration-200",
            "data-[state=open]:[&>svg]:rotate-180 data-[state=open]:[&>svg]:text-foreground/80",
          )}
        >
          <SelectValue placeholder={carregando ? "Carregando…" : placeholder ?? todosRotulo} />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectItem value={SENTINEL_TODOS} className="rounded-md text-muted-foreground">
            {todosRotulo}
          </SelectItem>
          {opcoes.map((o) => (
            <SelectItem key={o.valor} value={o.valor} className="rounded-md">
              {o.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
