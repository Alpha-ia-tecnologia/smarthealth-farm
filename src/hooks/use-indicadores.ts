import { useQuery } from "@tanstack/react-query"
import { indicadoresApi, type IndicadoresFiltros } from "@/lib/indicadores"

/** Chaves de cache do domínio de indicadores. */
export const indicadoresKeys = {
  raiz: ["indicadores"] as const,
  lista: (filtros: IndicadoresFiltros) => ["indicadores", "lista", filtros] as const,
  resumo: () => ["indicadores", "resumo"] as const,
  detalhe: (codigo: string) => ["indicadores", "detalhe", codigo] as const,
}

/**
 * Lista de indicadores do projeto com histórico e progresso. Filtros opcionais por unidade/insumo
 * recalculam o valor atual no escopo (baseline/meta seguem do edital).
 */
export function useIndicadores(filtros: IndicadoresFiltros = {}) {
  return useQuery({
    queryKey: indicadoresKeys.lista(filtros),
    queryFn: () => indicadoresApi.listar(filtros),
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
