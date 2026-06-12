import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { auditoriaApi, type AuditoriaFiltros } from "@/lib/auditoria"

/** Chaves de cache do domínio de auditoria. */
export const auditoriaKeys = {
  raiz: ["auditoria"] as const,
  lista: (filtros: AuditoriaFiltros) => ["auditoria", "lista", filtros] as const,
  resumo: () => ["auditoria", "resumo"] as const,
}

/** Trilha de auditoria com filtros (mais recentes primeiro). Mantém a lista anterior ao filtrar. */
export function useAuditoria(filtros: AuditoriaFiltros = {}) {
  return useQuery({
    queryKey: auditoriaKeys.lista(filtros),
    queryFn: () => auditoriaApi.listar(filtros),
    placeholderData: keepPreviousData,
  })
}

/** KPIs do painel de auditoria. */
export function useResumoAuditoria() {
  return useQuery({
    queryKey: auditoriaKeys.resumo(),
    queryFn: () => auditoriaApi.resumo(),
  })
}
