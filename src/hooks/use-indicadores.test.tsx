import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { useIndicador, useIndicadores } from "@/hooks/use-indicadores"
import { indicadoresTeste } from "@/test/handlers"

function criarAmbiente() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { wrapper }
}

describe("hooks de indicadores", () => {
  it("useIndicadores carrega a lista", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useIndicadores(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(indicadoresTeste.length)
  })

  it("useIndicador não dispara sem código", () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useIndicador(undefined), { wrapper })
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("useIndicador busca o detalhe quando há código", async () => {
    const { wrapper } = criarAmbiente()
    const { result } = renderHook(() => useIndicador("ind-mape"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.codigo).toBe("ind-mape")
  })
})
