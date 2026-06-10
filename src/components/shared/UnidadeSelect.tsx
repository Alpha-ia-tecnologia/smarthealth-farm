import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUnidades } from "@/hooks/use-unidades"
import { cn } from "@/lib/utils"

interface UnidadeSelectProps {
  /** Valor selecionado: id da unidade ou "todas". */
  value: string
  onValueChange: (value: string) => void
  className?: string
}

/**
 * Seletor de unidade da rede, alimentado pela API. Lista as unidades atendidas (exclui a CAHOSP
 * central / hub) com a opção "Todas as unidades". Trata carregando, erro e vazio.
 */
export function UnidadeSelect({ value, onValueChange, className }: UnidadeSelectProps) {
  const { data, isPending, isError } = useUnidades({ ativo: true })
  const atendidas = (data ?? []).filter((u) => !u.hub)

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isPending || isError}>
      <SelectTrigger className={cn("w-[150px]", className)} aria-label="Unidade">
        {isPending ? (
          <span className="text-muted-foreground">Carregando…</span>
        ) : isError ? (
          <span className="text-danger">Erro ao carregar</span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todas as unidades</SelectItem>
        {atendidas.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma unidade</div>
        ) : (
          atendidas.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.sigla} · {u.municipio}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
