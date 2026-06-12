import { useQuery } from "@tanstack/react-query"
import { indicadoresApi } from "@/lib/indicadores"

/** Chaves de cache do domínio de indicadores. */
export const indicadoresKeys = {
  raiz: ["indicadores"] as const,
  lista: () => ["indicadores", "lista"] as const,
  resumo: () => ["indicadores", "resumo"] as const,
  detalhe: (codigo: string) => ["indicadores", "detalhe", codigo] as const,
}

/** Lista de indicadores do projeto com histórico e progresso. */
export function useIndicadores() {
  return useQuery({
    queryKey: indicadoresKeys.lista(),
    queryFn: () => indicadoresApi.listar(),
  })
}

/** KPIs do painel de indicadores. */
export function useResumoIndicadores() {
  return useQuery({
    queryKey: indicadoresKeys.resumo(),
    queryFn: () => indicadoresApi.resumo(),
  })
}

/** Detalhe de um indicador pelo código (só dispara com código definido). */
export function useIndicador(codigo?: string) {
  return useQuery({
    queryKey: indicadoresKeys.detalhe(codigo ?? ""),
    queryFn: () => indicadoresApi.detalhar(codigo!),
    enabled: !!codigo,
  })
}
