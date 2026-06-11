import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import {
  recomendacoesKeys,
  useAprovarRecomendacao,
  useExecutarRecomendacao,
  useGerarRecomendacoes,
  useRecomendacoes,
} from "@/hooks/use-recomendacoes"
import { recomendacoesTeste } from "@/test/handlers"

function criarAmbiente() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("hooks de recomendações", () => {
  it("useRecomendacoes carrega a página (itens + total)", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useRecomendacoes(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.itens).toHaveLength(recomendacoesTeste.length)
    expect(result.current.data?.total).toBe(recomendacoesTeste.length)
  })

  it("aprovar invalida o cache do domínio (lista + resumo)", async () => {
    const { qc, wrapper } = criarAmbiente()
    const invalidar = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useAprovarRecomendacao(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync("rec-1")
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: recomendacoesKeys.raiz })
  })

  it("executar invalida o cache do domínio", async () => {
    const { qc, wrapper } = criarAmbiente()
    const invalidar = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useExecutarRecomendacao(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync("rec-2")
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: recomendacoesKeys.raiz })
  })

  it("gerar invalida o cache do domínio", async () => {
    const { qc, wrapper } = criarAmbiente()
    const invalidar = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useGerarRecomendacoes(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync()
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: recomendacoesKeys.raiz })
  })
})
