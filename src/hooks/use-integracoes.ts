import { useQuery } from "@tanstack/react-query"
import { integracoesApi } from "@/lib/integracoes"

/** Chaves de cache do domínio de integração. */
export const integracoesKeys = {
  raiz: ["integracoes"] as const,
  lista: () => ["integracoes", "lista"] as const,
  resumo: () => ["integracoes", "resumo"] as const,
  provedoresIa: () => ["integracoes", "provedores-ia"] as const,
}

/** Conexões com status, latência, modo e buffer offline. */
export function useIntegracoes() {
  return useQuery({
    queryKey: integracoesKeys.lista(),
    queryFn: () => integracoesApi.listar(),
  })
}

/** KPIs do painel de integração. */
export function useResumoIntegracoes() {
  return useQuery({
    queryKey: integracoesKeys.resumo(),
    queryFn: () => integracoesApi.resumo(),
  })
}

/** Provedores de IA do AI Gateway. */
export function useProvedoresIa() {
  return useQuery({
    queryKey: integracoesKeys.provedoresIa(),
    queryFn: () => integracoesApi.provedoresIa(),
  })
}
