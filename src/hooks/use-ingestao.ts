import { useQuery } from "@tanstack/react-query"
import { ingestaoApi } from "@/lib/ingestao"

/** Chaves de cache do domínio de ingestão. */
export const ingestaoKeys = {
  raiz: ["ingestao"] as const,
  fontes: () => ["ingestao", "fontes"] as const,
  qualidade: () => ["ingestao", "qualidade"] as const,
  resumo: () => ["ingestao", "resumo"] as const,
}

/** Fontes de dados com status, volume, qualidade e procedência. */
export function useFontes() {
  return useQuery({
    queryKey: ingestaoKeys.fontes(),
    queryFn: () => ingestaoApi.fontes(),
  })
}

/** Maturidade e qualidade por família terapêutica. */
export function useQualidadeFamilias() {
  return useQuery({
    queryKey: ingestaoKeys.qualidade(),
    queryFn: () => ingestaoApi.qualidade(),
  })
}

/** KPIs do painel de ingestão. */
export function useResumoIngestao() {
  return useQuery({
    queryKey: ingestaoKeys.resumo(),
    queryFn: () => ingestaoApi.resumo(),
  })
}
