import { useQuery } from "@tanstack/react-query"
import { painelApi } from "@/lib/painel"

/** Chaves de cache do domínio de painel. */
export const painelKeys = {
  raiz: ["painel"] as const,
  gerencial: () => ["painel", "gerencial"] as const,
  operacional: () => ["painel", "operacional"] as const,
}

/** Dashboard gerencial consolidado (totais, cobertura, série, alertas, recomendações). */
export function usePainelGerencial() {
  return useQuery({
    queryKey: painelKeys.gerencial(),
    queryFn: () => painelApi.dashboard(),
  })
}

/** Painel operacional (situação por unidade + filas de alertas/recomendações). */
export function usePainelOperacional() {
  return useQuery({
    queryKey: painelKeys.operacional(),
    queryFn: () => painelApi.operacional(),
  })
}
