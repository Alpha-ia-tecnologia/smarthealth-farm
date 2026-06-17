import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  alertasApi,
  type AlertaFiltros,
  type AtualizarLimiares,
  type StatusAlerta,
} from "@/lib/alertas"
import type { FiltrosResumo, ParamsPaginacao } from "@/lib/api"

/** Chaves de cache do domínio de alertas. */
export const alertasKeys = {
  raiz: ["alertas"] as const,
  lista: (filtros: AlertaFiltros, paginacao: ParamsPaginacao) =>
    ["alertas", "lista", filtros, paginacao] as const,
  resumo: (filtros: FiltrosResumo) => ["alertas", "resumo", filtros] as const,
  limiares: () => ["alertas", "limiares"] as const,
}

/** Alertas paginados, mais urgentes primeiro (+ filtros). Mantém a página anterior ao paginar. */
export function useAlertas(filtros: AlertaFiltros = {}, paginacao: ParamsPaginacao = {}) {
  return useQuery({
    queryKey: alertasKeys.lista(filtros, paginacao),
    queryFn: () => alertasApi.listar(filtros, paginacao),
    placeholderData: keepPreviousData,
  })
}

/** KPIs do painel de alertas (filtros opcionais por unidade/medicamento). */
export function useResumoAlertas(filtros: FiltrosResumo = {}) {
  return useQuery({
    queryKey: alertasKeys.resumo(filtros),
    queryFn: () => alertasApi.resumo(filtros),
  })
}

/** Configuração vigente dos limiares (RF-ALE-03). */
export function useLimiares() {
  return useQuery({
    queryKey: alertasKeys.limiares(),
    queryFn: () => alertasApi.limiares(),
  })
}

/** Trata um alerta (muda o status) e invalida lista + resumo. */
export function useTratarAlerta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusAlerta }) =>
      alertasApi.atualizarStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertasKeys.raiz }),
  })
}

/** Regenera os alertas pelo motor (Gestor) e invalida lista + resumo. */
export function useGerarAlertas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => alertasApi.gerar(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertasKeys.raiz }),
  })
}

/** Salva os limiares (Gestor) e invalida a configuração em cache. */
export function useSalvarLimiares() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (limiares: AtualizarLimiares) => alertasApi.salvarLimiares(limiares),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertasKeys.limiares() }),
  })
}
