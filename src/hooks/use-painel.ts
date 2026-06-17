import { useQuery } from "@tanstack/react-query"
import {
  painelApi,
  type PainelGerencialFiltros,
  type PainelOperacionalFiltros,
} from "@/lib/painel"

/** Chaves de cache do domínio de painel. */
export const painelKeys = {
  raiz: ["painel"] as const,
  gerencial: (filtros: PainelGerencialFiltros) => ["painel", "gerencial", filtros] as const,
  operacional: (filtros: PainelOperacionalFiltros) => ["painel", "operacional", filtros] as const,
}

/** Dashboard gerencial consolidado (totais, cobertura, série, alertas, recomendações). */
export function usePainelGerencial(filtros: PainelGerencialFiltros = {}) {
  return useQuery({
    queryKey: painelKeys.gerencial(filtros),
    queryFn: () => painelApi.dashboard(filtros),
  })
}

/** Painel operacional (situação por unidade + filas de alertas/recomendações). */
export function usePainelOperacional(filtros: PainelOperacionalFiltros = {}) {
  return useQuery({
    queryKey: painelKeys.operacional(filtros),
    queryFn: () => painelApi.operacional(filtros),
  })
}
