import { useQuery } from "@tanstack/react-query"
import { unidadesApi, type UnidadeFiltros } from "@/lib/unidades"

/** Chaves de cache do domínio de unidades. */
export const unidadesKeys = {
  raiz: ["unidades"] as const,
  lista: (filtros: UnidadeFiltros) => ["unidades", "lista", filtros] as const,
  detalhe: (id: string) => ["unidades", "detalhe", id] as const,
}

/** Lista unidades (com filtros opcionais). */
export function useUnidades(filtros: UnidadeFiltros = {}) {
  return useQuery({
    queryKey: unidadesKeys.lista(filtros),
    queryFn: () => unidadesApi.listar(filtros),
  })
}

/** Detalha uma unidade por id (desabilitado sem id). */
export function useUnidade(id: string | undefined) {
  return useQuery({
    queryKey: unidadesKeys.detalhe(id ?? ""),
    queryFn: () => unidadesApi.buscar(id as string),
    enabled: Boolean(id),
  })
}
