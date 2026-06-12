import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import {
  previsoesKeys,
  usePrevisaoDetalhe,
  usePrevisoes,
  useRecalibrarPrevisoes,
} from "@/hooks/use-previsoes"
import { previsoesTeste } from "@/test/handlers"

function criarAmbiente() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("hooks de previsões", () => {
  it("usePrevisoes carrega a página (itens + total)", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => usePrevisoes(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.itens).toHaveLength(previsoesTeste.length)
    expect(result.current.data?.total).toBe(previsoesTeste.length)
  })

  it("usePrevisaoDetalhe não dispara sem medicamento/unidade", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => usePrevisaoDetalhe(undefined, undefined), { wrapper })
    expect(result.current.fetchStatus).toBe("idle")
    expect(result.current.isPending).toBe(true)
  })

  it("usePrevisaoDetalhe busca a série quando os ids existem", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => usePrevisaoDetalhe("med-001", "uni-hto"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.serie.length).toBeGreaterThan(0)
  })

  it("recalibrar invalida o cache do domínio", async () => {
    const { qc, wrapper } = criarAmbiente()
    const invalidar = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useRecalibrarPrevisoes(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync()
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: previsoesKeys.raiz })
  })
})
