import { useEffect, useMemo, useRef } from "react"
import { useInsumos } from "@/hooks/use-insumos"
import { SelectFiltro } from "./SelectFiltro"

interface Props {
  /** Insumo selecionado; `undefined` = todos. */
  valor: string | undefined
  onChange: (insumoId: string | undefined) => void
  /** Unidade selecionada — restringe a lista aos insumos com estoque nela (dependente). */
  unidadeId?: string
  label?: string
  todosRotulo?: string
  className?: string
}

/**
 * Filtro de insumo, dependente da unidade: sem unidade, lista o catálogo todo; com unidade,
 * apenas os insumos com posição de estoque nela (GET /insumos?unidadeId=). Ao trocar a
 * unidade, limpa a seleção que não existir mais na nova lista.
 */
export function FiltroInsumo({
  valor,
  onChange,
  unidadeId,
  label = "Insumo",
  todosRotulo = "Todos os insumos",
  className,
}: Props) {
  const { data, isPending, isFetching } = useInsumos({ ativo: true, unidadeId })
  const insumos = useMemo(() => data ?? [], [data])
  const opcoes = useMemo(
    () => insumos.map((m) => ({ valor: m.id, rotulo: `${m.nome} (${m.codigo})` })),
    [insumos],
  )

  // Só reavaliamos a seleção quando a UNIDADE muda (não ao escolher/reabrir o insumo).
  // 1) detecta a troca de unidade e arma a revalidação; 2) ao terminar de carregar a nova lista,
  // limpa o insumo que não existir mais nela. Todo o estado de controle fica em refs, e só é
  // lido/escrito dentro de efeitos (nunca em render).
  const unidadeAnteriorRef = useRef(unidadeId)
  const precisaRevalidarRef = useRef(false)

  useEffect(() => {
    if (unidadeAnteriorRef.current !== unidadeId) {
      unidadeAnteriorRef.current = unidadeId
      precisaRevalidarRef.current = true
    }
  }, [unidadeId])

  useEffect(() => {
    if (!precisaRevalidarRef.current || isFetching) return
    precisaRevalidarRef.current = false
    if (valor != null && !insumos.some((m) => m.id === valor)) {
      onChange(undefined)
    }
  }, [isFetching, valor, insumos, onChange])

  return (
    <SelectFiltro
      label={label}
      valor={valor}
      onChange={onChange}
      opcoes={opcoes}
      carregando={isPending}
      todosRotulo={todosRotulo}
      placeholder={todosRotulo}
      className={className}
    />
  )
}
