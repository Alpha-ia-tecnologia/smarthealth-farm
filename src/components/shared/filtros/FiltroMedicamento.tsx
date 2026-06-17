import { useEffect, useMemo, useRef } from "react"
import { useMedicamentos } from "@/hooks/use-medicamentos"
import { SelectFiltro } from "./SelectFiltro"

interface Props {
  /** Medicamento selecionado; `undefined` = todos. */
  valor: string | undefined
  onChange: (medicamentoId: string | undefined) => void
  /** Unidade selecionada — restringe a lista aos medicamentos com estoque nela (dependente). */
  unidadeId?: string
  label?: string
  todosRotulo?: string
  className?: string
}

/**
 * Filtro de medicamento, dependente da unidade: sem unidade, lista o catálogo todo; com unidade,
 * apenas os medicamentos com posição de estoque nela (GET /medicamentos?unidadeId=). Ao trocar a
 * unidade, limpa a seleção que não existir mais na nova lista.
 */
export function FiltroMedicamento({
  valor,
  onChange,
  unidadeId,
  label = "Medicamento",
  todosRotulo = "Todos os medicamentos",
  className,
}: Props) {
  const { data, isPending, isFetching } = useMedicamentos({ ativo: true, unidadeId })
  const medicamentos = useMemo(() => data ?? [], [data])
  const opcoes = useMemo(
    () => medicamentos.map((m) => ({ valor: m.id, rotulo: `${m.nome} (${m.codigo})` })),
    [medicamentos],
  )

  // Só reavaliamos a seleção quando a UNIDADE muda (não ao escolher/reabrir o medicamento).
  // 1) detecta a troca de unidade e arma a revalidação; 2) ao terminar de carregar a nova lista,
  // limpa o medicamento que não existir mais nela. Todo o estado de controle fica em refs, e só é
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
    if (valor != null && !medicamentos.some((m) => m.id === valor)) {
      onChange(undefined)
    }
  }, [isFetching, valor, medicamentos, onChange])

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
