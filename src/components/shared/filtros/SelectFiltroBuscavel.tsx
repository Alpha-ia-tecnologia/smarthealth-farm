import { useId, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn, normalizarTexto } from "@/lib/utils"
import type { OpcaoFiltro } from "./SelectFiltro"

interface Props {
  /** Rótulo curto acima do controle (ex.: "Insumo"). Opcional. */
  label?: string
  /** Valor selecionado; `undefined` = "todos" (sem filtro). */
  valor: string | undefined
  /** Emite o novo valor, ou `undefined` ao limpar. */
  onChange: (valor: string | undefined) => void
  opcoes: OpcaoFiltro[]
  placeholder?: string
  /** Rótulo da opção "limpar" (ex.: "Todos os insumos"). */
  todosRotulo?: string
  /** Texto do campo de busca dentro do popover. */
  buscarPlaceholder?: string
  /** Mensagem quando a busca não casa com nenhuma opção. */
  vazioRotulo?: string
  carregando?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

/**
 * Filtro em formato combobox: como o {@link SelectFiltro}, mas com campo de busca. O usuário digita
 * para filtrar; a busca é insensível a maiúsculas/minúsculas e a acentos (via {@link normalizarTexto}),
 * casando por trecho do rótulo. Ideal para listas longas (insumos, unidades). Mesma API do
 * SelectFiltro — drop-in. A opção de limpar ("todos") fica sempre no topo, fora do filtro de busca.
 */
const SENTINEL_TODOS = "__todos__"

export function SelectFiltroBuscavel({
  label,
  valor,
  onChange,
  opcoes,
  placeholder,
  todosRotulo = "Todas",
  buscarPlaceholder = "Pesquisar…",
  vazioRotulo = "Nada encontrado.",
  carregando,
  disabled,
  className,
  id,
}: Props) {
  const reactId = useId()
  const campoId = id ?? reactId
  const [aberto, setAberto] = useState(false)

  const selecionada = opcoes.find((o) => o.valor === valor)
  const rotuloGatilho = carregando
    ? "Carregando…"
    : (selecionada?.rotulo ?? placeholder ?? todosRotulo)

  function selecionar(novoValor: string | undefined) {
    onChange(novoValor)
    setAberto(false)
  }

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
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger
          id={campoId}
          role="combobox"
          aria-expanded={aberto}
          aria-label={label ?? placeholder ?? todosRotulo}
          disabled={disabled || carregando}
          className={cn(
            "flex h-9 w-full min-w-44 items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/70 px-3 text-sm font-medium shadow-none",
            "transition-[color,box-shadow,border-color] duration-150",
            "hover:border-border hover:bg-background",
            "focus-visible:border-ring/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
            "data-[state=open]:border-ring/50 data-[state=open]:bg-background data-[state=open]:ring-[3px] data-[state=open]:ring-ring/15",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <span className={cn("truncate", !selecionada && "text-muted-foreground")}>
            {rotuloGatilho}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground/70" />
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0">
          <Command
            filter={(_itemValor, busca, keywords) => {
              const alvo = normalizarTexto((keywords ?? []).join(" "))
              return alvo.includes(normalizarTexto(busca)) ? 1 : 0
            }}
          >
            <CommandInput placeholder={buscarPlaceholder} />
            <CommandList>
              <CommandEmpty>{vazioRotulo}</CommandEmpty>
              <CommandItem
                value={SENTINEL_TODOS}
                keywords={[todosRotulo]}
                onSelect={() => selecionar(undefined)}
                className="text-muted-foreground"
              >
                <CheckIcon
                  className={cn("size-4", valor == null ? "opacity-100" : "opacity-0")}
                />
                {todosRotulo}
              </CommandItem>
              {opcoes.map((o) => (
                <CommandItem
                  key={o.valor}
                  value={o.valor}
                  keywords={[o.rotulo]}
                  onSelect={() => selecionar(o.valor)}
                >
                  <CheckIcon
                    className={cn("size-4", valor === o.valor ? "opacity-100" : "opacity-0")}
                  />
                  {o.rotulo}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
