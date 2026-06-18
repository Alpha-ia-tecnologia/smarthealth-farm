import { useMemo } from "react"
import { useUnidades } from "@/hooks/use-unidades"
import { SelectFiltroBuscavel } from "./SelectFiltroBuscavel"

interface Props {
  /** Unidade selecionada; `undefined` = todas. */
  valor: string | undefined
  onChange: (unidadeId: string | undefined) => void
  label?: string
  todosRotulo?: string
  className?: string
}

/** Filtro de unidade (RF-DASH/RF-EST…): lista as unidades ativas para um SelectFiltro. */
export function FiltroUnidade({
  valor,
  onChange,
  label = "Unidade",
  todosRotulo = "Todas as unidades",
  className,
}: Props) {
  const { data, isPending } = useUnidades({ ativo: true })
  const opcoes = useMemo(
    () =>
      (data ?? [])
        .filter((u) => u.ativo)
        .map((u) => ({ valor: u.id, rotulo: `${u.sigla} · ${u.municipio}` })),
    [data],
  )

  return (
    <SelectFiltroBuscavel
      label={label}
      valor={valor}
      onChange={onChange}
      opcoes={opcoes}
      carregando={isPending}
      todosRotulo={todosRotulo}
      placeholder={todosRotulo}
      buscarPlaceholder="Pesquisar unidade…"
      vazioRotulo="Nenhuma unidade encontrada."
      className={className}
    />
  )
}
